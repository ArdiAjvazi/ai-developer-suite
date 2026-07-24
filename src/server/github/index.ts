import {
  assembleAnalysis,
  buildSummaryMarkdown,
  purposeForDependency,
} from "@/features/repositories/lib/analyze-repository";
import { buildMockRepository } from "@/features/repositories/lib/mock-repository";
import {
  parseGitHubUrl,
  RepositoryImportError,
  type ParsedGitHubUrl,
} from "@/features/repositories/lib/parse-github-url";
import type {
  RepoDependency,
  RepoTreeNode,
} from "@/features/repositories/types";
import type { FetchedRepositoryPayload } from "@/features/repositories/lib/mock-repository";
import { getEnv } from "@/config/runtime-env";

type GhRepo = {
  id: number;
  full_name: string;
  name: string;
  owner: { login: string };
  description: string | null;
  html_url: string;
  private: boolean;
  default_branch: string;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  license: { spdx_id: string | null } | null;
  size: number;
  pushed_at: string | null;
  visibility?: string;
};

type GhTreeItem = {
  path: string;
  type: "blob" | "tree";
};

function githubHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "CodePilot-AI",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  const token = getEnv("GITHUB_TOKEN");
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

async function githubFetch(url: string): Promise<Response> {
  try {
    return await fetch(url, {
      headers: githubHeaders(),
      next: { revalidate: 0 },
    });
  } catch {
    throw new RepositoryImportError(
      "NETWORK",
      "Network failure while contacting GitHub. Using mock analysis.",
    );
  }
}

function buildTreeFromPaths(items: GhTreeItem[]): RepoTreeNode[] {
  type Mutable = {
    id: string;
    name: string;
    path: string;
    type: "file" | "folder";
    children?: Map<string, Mutable>;
  };

  const root = new Map<string, Mutable>();

  for (const item of items) {
    const parts = item.path.split("/").filter(Boolean);
    let cursor = root;
    let currentPath = "";

    parts.forEach((part, index) => {
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      const isLeaf = index === parts.length - 1;
      const existing = cursor.get(part);

      if (!existing) {
        const node: Mutable = {
          id: currentPath,
          name: part,
          path: currentPath,
          type: isLeaf && item.type === "blob" ? "file" : "folder",
          children: isLeaf && item.type === "blob" ? undefined : new Map(),
        };
        cursor.set(part, node);
        if (node.children) cursor = node.children;
      } else if (existing.children) {
        cursor = existing.children;
      }
    });
  }

  const toNodes = (map: Map<string, Mutable>): RepoTreeNode[] =>
    [...map.values()]
      .sort((a, b) => {
        if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
        return a.name.localeCompare(b.name);
      })
      .map((n) => ({
        id: n.id,
        name: n.name,
        path: n.path,
        type: n.type,
        children: n.children ? toNodes(n.children) : undefined,
      }));

  return toNodes(root);
}

function parsePackageJsonDeps(raw: string): RepoDependency[] {
  try {
    const json = JSON.parse(raw) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    const entries = {
      ...(json.dependencies ?? {}),
      ...(json.devDependencies ?? {}),
    };
    return Object.entries(entries)
      .slice(0, 80)
      .map(([name, version]) => ({
        name,
        version: String(version).replace(/^[\^~]/, ""),
        purpose: purposeForDependency(name),
        manager: "npm",
      }));
  } catch {
    return [];
  }
}

function parseRequirements(raw: string): RepoDependency[] {
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .slice(0, 80)
    .map((line) => {
      const [name, version = "latest"] = line.split(/[=<>!~]+/);
      return {
        name: name.trim(),
        version: version.trim() || "latest",
        purpose: purposeForDependency(name.trim()),
        manager: "pip",
      };
    });
}

function parseComposer(raw: string): RepoDependency[] {
  try {
    const json = JSON.parse(raw) as {
      require?: Record<string, string>;
      "require-dev"?: Record<string, string>;
    };
    const entries = { ...(json.require ?? {}), ...(json["require-dev"] ?? {}) };
    return Object.entries(entries)
      .filter(([name]) => name !== "php")
      .slice(0, 80)
      .map(([name, version]) => ({
        name,
        version: String(version),
        purpose: purposeForDependency(name),
        manager: "Composer",
      }));
  } catch {
    return [];
  }
}

function parseCargo(raw: string): RepoDependency[] {
  const deps: RepoDependency[] = [];
  let inDeps = false;
  for (const line of raw.split("\n")) {
    if (line.trim() === "[dependencies]") {
      inDeps = true;
      continue;
    }
    if (line.trim().startsWith("[")) {
      inDeps = false;
      continue;
    }
    if (!inDeps) continue;
    const match = line.match(/^([A-Za-z0-9_-]+)\s*=\s*"?([^"]+)"?/);
    if (match) {
      deps.push({
        name: match[1],
        version: match[2].replace(/[{}"]/g, "").trim(),
        purpose: purposeForDependency(match[1]),
        manager: "Cargo",
      });
    }
  }
  return deps.slice(0, 80);
}

function parseGoMod(raw: string): RepoDependency[] {
  return raw
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.startsWith("require ") || /^[^\s]+\s+v[\d.]+/.test(l))
    .map((l) => l.replace(/^require\s+/, "").replace(/[()]/g, "").trim())
    .map((l) => {
      const [name, version = "latest"] = l.split(/\s+/);
      return {
        name,
        version,
        purpose: purposeForDependency(name),
        manager: "Go modules",
      };
    })
    .filter((d) => d.name && !d.name.startsWith("//"))
    .slice(0, 80);
}

async function fetchFileContent(
  owner: string,
  repo: string,
  path: string,
): Promise<string | null> {
  const res = await githubFetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
  );
  if (!res.ok) return null;
  const data = (await res.json()) as { content?: string; encoding?: string };
  if (!data.content || data.encoding !== "base64") return null;
  try {
    return Buffer.from(data.content.replace(/\n/g, ""), "base64").toString("utf8");
  } catch {
    return null;
  }
}

async function fetchDependencies(
  owner: string,
  repo: string,
  paths: string[],
): Promise<{ deps: RepoDependency[]; packageManagerHint: string | null }> {
  const lower = paths.map((p) => p.toLowerCase());
  const has = (name: string) => lower.includes(name) || lower.some((p) => p.endsWith(`/${name}`));

  if (has("package.json")) {
    const raw = await fetchFileContent(owner, repo, "package.json");
    if (raw) {
      let hint: string | null = "npm";
      if (has("pnpm-lock.yaml")) hint = "pnpm";
      else if (has("yarn.lock")) hint = "Yarn";
      else if (has("bun.lock") || has("bun.lockb")) hint = "Bun";
      return { deps: parsePackageJsonDeps(raw), packageManagerHint: hint };
    }
  }
  if (has("composer.json")) {
    const raw = await fetchFileContent(owner, repo, "composer.json");
    if (raw) return { deps: parseComposer(raw), packageManagerHint: "Composer" };
  }
  if (has("requirements.txt")) {
    const raw = await fetchFileContent(owner, repo, "requirements.txt");
    if (raw) return { deps: parseRequirements(raw), packageManagerHint: "pip" };
  }
  if (has("cargo.toml")) {
    const raw = await fetchFileContent(owner, repo, "Cargo.toml");
    if (raw) return { deps: parseCargo(raw), packageManagerHint: "Cargo" };
  }
  if (has("go.mod")) {
    const raw = await fetchFileContent(owner, repo, "go.mod");
    if (raw) return { deps: parseGoMod(raw), packageManagerHint: "Go modules" };
  }
  if (has("pom.xml")) {
    return {
      deps: [
        {
          name: "maven-project",
          version: "detected",
          purpose: "Java / Maven project",
          manager: "Maven",
        },
      ],
      packageManagerHint: "Maven",
    };
  }

  return { deps: [], packageManagerHint: null };
}

async function fetchLiveRepository(
  parsed: ParsedGitHubUrl,
): Promise<FetchedRepositoryPayload> {
  const metaRes = await githubFetch(
    `https://api.github.com/repos/${parsed.owner}/${parsed.repo}`,
  );

  if (metaRes.status === 404) {
    throw new RepositoryImportError(
      "NOT_FOUND",
      "Repository not found. Check the owner and repository name.",
    );
  }

  if (metaRes.status === 403) {
    const body = await metaRes.text();
    if (/rate limit/i.test(body)) {
      throw new RepositoryImportError(
        "RATE_LIMIT",
        "GitHub API rate limit reached. Using mock analysis.",
      );
    }
    throw new RepositoryImportError(
      "PRIVATE",
      "This repository appears to be private or inaccessible with the current credentials.",
    );
  }

  if (metaRes.status === 401) {
    throw new RepositoryImportError(
      "PRIVATE",
      "Private repository — authentication is required to import it.",
    );
  }

  if (!metaRes.ok) {
    throw new RepositoryImportError(
      "UNKNOWN",
      `GitHub returned status ${metaRes.status}. Using mock analysis.`,
    );
  }

  const meta = (await metaRes.json()) as GhRepo;
  if (meta.private) {
    throw new RepositoryImportError(
      "PRIVATE",
      "Private repositories are not supported in this import flow yet.",
    );
  }

  const [langRes, treeRes] = await Promise.all([
    githubFetch(
      `https://api.github.com/repos/${parsed.owner}/${parsed.repo}/languages`,
    ),
    githubFetch(
      `https://api.github.com/repos/${parsed.owner}/${parsed.repo}/git/trees/${encodeURIComponent(meta.default_branch)}?recursive=1`,
    ),
  ]);

  if (langRes.status === 403 || treeRes.status === 403) {
    throw new RepositoryImportError(
      "RATE_LIMIT",
      "GitHub API rate limit reached. Using mock analysis.",
    );
  }

  const languages = langRes.ok
    ? ((await langRes.json()) as Record<string, number>)
    : { [meta.language ?? "Unknown"]: 1 };

  let treeItems: GhTreeItem[] = [];
  if (treeRes.ok) {
    const treeJson = (await treeRes.json()) as { tree?: GhTreeItem[]; truncated?: boolean };
    treeItems = (treeJson.tree ?? []).filter((t) => t.path).slice(0, 400);
  }

  const tree =
    treeItems.length > 0
      ? buildTreeFromPaths(treeItems)
      : [
          {
            id: "README.md",
            name: "README.md",
            path: "README.md",
            type: "file" as const,
          },
        ];

  const paths = treeItems.map((t) => t.path);
  const { deps, packageManagerHint } = await fetchDependencies(
    parsed.owner,
    parsed.repo,
    paths,
  );

  let analysis = assembleAnalysis({
    tree,
    dependencies: deps,
    languages,
    sizeKb: meta.size,
    hasLicense: Boolean(meta.license?.spdx_id && meta.license.spdx_id !== "NOASSERTION"),
    packageManagerHint,
  });

  analysis = {
    ...analysis,
    summaryMarkdown: buildSummaryMarkdown({
      fullName: meta.full_name,
      description: meta.description,
      htmlUrl: meta.html_url,
      stack: analysis.stack,
      statistics: analysis.statistics,
      health: analysis.health,
    }),
  };

  return {
    githubId: String(meta.id),
    fullName: meta.full_name,
    name: meta.name,
    owner: meta.owner.login,
    description: meta.description,
    htmlUrl: meta.html_url,
    visibility: meta.visibility ?? (meta.private ? "private" : "public"),
    defaultBranch: meta.default_branch,
    primaryLanguage: meta.language,
    stars: meta.stargazers_count,
    forks: meta.forks_count,
    openIssues: meta.open_issues_count,
    license:
      meta.license?.spdx_id && meta.license.spdx_id !== "NOASSERTION"
        ? meta.license.spdx_id
        : null,
    sizeKb: meta.size,
    lastCommitAt: meta.pushed_at,
    analysis,
    mock: false,
  };
}

export async function fetchRepositoryByUrl(
  url: string,
  options?: { forceMock?: boolean },
): Promise<FetchedRepositoryPayload> {
  const parsed = parseGitHubUrl(url);
  if (!parsed) {
    throw new RepositoryImportError(
      "INVALID_URL",
      "Invalid GitHub repository URL. Example: https://github.com/vercel/next.js",
    );
  }

  if (options?.forceMock || getEnv("GITHUB_FORCE_MOCK") === "true") {
    return buildMockRepository(parsed);
  }

  try {
    return await fetchLiveRepository(parsed);
  } catch (error) {
    if (error instanceof RepositoryImportError) {
      if (
        error.code === "INVALID_URL" ||
        error.code === "NOT_FOUND" ||
        error.code === "PRIVATE"
      ) {
        throw error;
      }
      // Rate limit / network / unknown → mock mode
      return buildMockRepository(parsed);
    }
    return buildMockRepository(parsed);
  }
}

export { parseGitHubUrl };
