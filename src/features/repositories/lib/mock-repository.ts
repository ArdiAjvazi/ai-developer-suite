import {
  assembleAnalysis,
  buildSummaryMarkdown,
  purposeForDependency,
} from "@/features/repositories/lib/analyze-repository";
import type {
  RepoDependency,
  RepoTreeNode,
  RepositoryAnalysis,
} from "@/features/repositories/types";
import type { ParsedGitHubUrl } from "@/features/repositories/lib/parse-github-url";

export type FetchedRepositoryPayload = {
  githubId: string | null;
  fullName: string;
  name: string;
  owner: string;
  description: string | null;
  htmlUrl: string;
  visibility: string;
  defaultBranch: string;
  primaryLanguage: string | null;
  stars: number;
  forks: number;
  openIssues: number;
  license: string | null;
  sizeKb: number;
  lastCommitAt: string | null;
  analysis: RepositoryAnalysis;
  mock: boolean;
};

function node(
  name: string,
  path: string,
  type: "file" | "folder",
  children?: RepoTreeNode[],
): RepoTreeNode {
  return { id: path, name, path, type, children };
}

function nextJsTree(): RepoTreeNode[] {
  return [
    node("app", "app", "folder", [
      node("layout.tsx", "app/layout.tsx", "file"),
      node("page.tsx", "app/page.tsx", "file"),
      node("api", "app/api", "folder", [
        node("route.ts", "app/api/route.ts", "file"),
      ]),
    ]),
    node("components", "components", "folder", [
      node("ui", "components/ui", "folder", [
        node("button.tsx", "components/ui/button.tsx", "file"),
        node("card.tsx", "components/ui/card.tsx", "file"),
      ]),
      node("header.tsx", "components/header.tsx", "file"),
    ]),
    node("lib", "lib", "folder", [
      node("utils.ts", "lib/utils.ts", "file"),
      node("db.ts", "lib/db.ts", "file"),
    ]),
    node("prisma", "prisma", "folder", [
      node("schema.prisma", "prisma/schema.prisma", "file"),
    ]),
    node("public", "public", "folder", [
      node("favicon.ico", "public/favicon.ico", "file"),
    ]),
    node("package.json", "package.json", "file"),
    node("tsconfig.json", "tsconfig.json", "file"),
    node("README.md", "README.md", "file"),
    node("next.config.ts", "next.config.ts", "file"),
    node(".github", ".github", "folder", [
      node("workflows", ".github/workflows", "folder", [
        node("ci.yml", ".github/workflows/ci.yml", "file"),
      ]),
    ]),
  ];
}

function genericTree(owner: string, repo: string): RepoTreeNode[] {
  return [
    node("src", "src", "folder", [
      node("index.ts", "src/index.ts", "file"),
      node("app.ts", "src/app.ts", "file"),
      node("utils", "src/utils", "folder", [
        node("helpers.ts", "src/utils/helpers.ts", "file"),
      ]),
    ]),
    node("tests", "tests", "folder", [
      node("app.test.ts", "tests/app.test.ts", "file"),
    ]),
    node("docs", "docs", "folder", [
      node("guide.md", "docs/guide.md", "file"),
    ]),
    node("package.json", "package.json", "file"),
    node("README.md", "README.md", "file"),
    node("LICENSE", "LICENSE", "file"),
    node(".gitignore", ".gitignore", "file"),
    node(`${repo}.config.js`, `${repo}.config.js`, "file"),
    node("tsconfig.json", "tsconfig.json", "file"),
    node("owner.txt", `meta/${owner}.txt`, "file"),
  ];
}

function nextDeps(): RepoDependency[] {
  const pkgs: Array<[string, string]> = [
    ["next", "15.1.0"],
    ["react", "19.0.0"],
    ["react-dom", "19.0.0"],
    ["typescript", "5.7.2"],
    ["@prisma/client", "6.1.0"],
    ["prisma", "6.1.0"],
    ["tailwindcss", "4.0.0"],
    ["zod", "3.24.1"],
    ["next-auth", "5.0.0-beta.25"],
    ["pg", "8.13.1"],
    ["lucide-react", "0.469.0"],
    ["openai", "4.77.0"],
  ];
  return pkgs.map(([name, version]) => ({
    name,
    version,
    purpose: purposeForDependency(name),
    manager: "npm",
  }));
}

function genericDeps(): RepoDependency[] {
  const pkgs: Array<[string, string]> = [
    ["express", "4.21.2"],
    ["typescript", "5.6.3"],
    ["zod", "3.23.8"],
    ["pg", "8.13.0"],
    ["dotenv", "16.4.5"],
  ];
  return pkgs.map(([name, version]) => ({
    name,
    version,
    purpose: purposeForDependency(name),
    manager: "npm",
  }));
}

function hashSeed(text: string): number {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) >>> 0;
  return h;
}

export function buildMockRepository(
  parsed: ParsedGitHubUrl,
): FetchedRepositoryPayload {
  const seed = hashSeed(parsed.fullName);
  const isNextLike =
    /next|vercel|react|codepilot|ai-developer/i.test(parsed.fullName) ||
    seed % 3 === 0;

  const tree = isNextLike ? nextJsTree() : genericTree(parsed.owner, parsed.repo);
  const dependencies = isNextLike ? nextDeps() : genericDeps();
  const languages: Record<string, number> = isNextLike
    ? { TypeScript: 420_000, JavaScript: 85_000, CSS: 22_000, MDX: 12_000 }
    : { TypeScript: 180_000, JavaScript: 40_000, JSON: 8_000 };

  const sizeKb = 1200 + (seed % 8000);
  const stars = 50 + (seed % 50_000);
  const forks = Math.round(stars * 0.12);
  const openIssues = 3 + (seed % 120);
  const license = seed % 5 === 0 ? null : "MIT";
  const primaryLanguage = Object.keys(languages)[0] ?? "TypeScript";

  let analysis = assembleAnalysis({
    tree,
    dependencies,
    languages,
    sizeKb,
    hasLicense: Boolean(license),
    packageManagerHint: "pnpm",
  });

  analysis = {
    ...analysis,
    summaryMarkdown: buildSummaryMarkdown({
      fullName: parsed.fullName,
      description: `${parsed.repo} — mock analysis generated for CodePilot AI when GitHub API is unavailable.`,
      htmlUrl: parsed.htmlUrl,
      stack: analysis.stack,
      statistics: analysis.statistics,
      health: analysis.health,
    }),
  };

  const daysAgo = 1 + (seed % 40);
  const lastCommitAt = new Date(Date.now() - daysAgo * 86_400_000).toISOString();

  return {
    githubId: `mock-${seed}`,
    fullName: parsed.fullName,
    name: parsed.repo,
    owner: parsed.owner,
    description: `Imported mock profile for ${parsed.fullName}. Realistic analysis used while the GitHub API is unavailable.`,
    htmlUrl: parsed.htmlUrl,
    visibility: "public",
    defaultBranch: "main",
    primaryLanguage,
    stars,
    forks,
    openIssues,
    license,
    sizeKb,
    lastCommitAt,
    analysis,
    mock: true,
  };
}
