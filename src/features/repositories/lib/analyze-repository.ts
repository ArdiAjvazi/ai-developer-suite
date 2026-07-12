import type {
  DetectedRepoStack,
  RepoDependency,
  RepoHealthScores,
  RepoStatistics,
  RepoTreeNode,
  RepositoryAnalysis,
} from "@/features/repositories/types";

const PURPOSE_MAP: Record<string, string> = {
  next: "React framework for production",
  react: "UI library",
  "react-dom": "React DOM renderer",
  vue: "Progressive JavaScript framework",
  angular: "Application framework",
  express: "Node.js web framework",
  nestjs: "Progressive Node.js framework",
  "@nestjs/core": "NestJS core runtime",
  prisma: "Next-generation ORM",
  "@prisma/client": "Prisma database client",
  mongoose: "MongoDB ODM",
  sequelize: "SQL ORM",
  typeorm: "TypeScript ORM",
  drizzle: "TypeScript ORM",
  "drizzle-orm": "TypeScript ORM",
  tailwindcss: "Utility-first CSS",
  typescript: "Typed JavaScript",
  zod: "Schema validation",
  openai: "OpenAI API client",
  pg: "PostgreSQL client",
  mongodb: "MongoDB driver",
  firebase: "Firebase SDK",
  "@supabase/supabase-js": "Supabase client",
  nextauth: "Authentication for Next.js",
  "next-auth": "Authentication for Next.js",
  bcryptjs: "Password hashing",
  axios: "HTTP client",
  lodash: "Utility helpers",
  django: "Python web framework",
  flask: "Python microframework",
  fastapi: "Python API framework",
  laravel: "PHP web framework",
};

export function purposeForDependency(name: string): string {
  const key = name.toLowerCase();
  if (PURPOSE_MAP[key]) return PURPOSE_MAP[key];
  if (key.includes("auth")) return "Authentication";
  if (key.includes("test") || key.includes("jest") || key.includes("vitest"))
    return "Testing";
  if (key.includes("eslint") || key.includes("prettier")) return "Code quality";
  if (key.includes("webpack") || key.includes("vite") || key.includes("esbuild"))
    return "Build tooling";
  return "Project dependency";
}

export function detectStackFromSignals(input: {
  dependencies: RepoDependency[];
  treePaths: string[];
  languages: Record<string, number>;
  packageManagerHint?: string | null;
}): DetectedRepoStack {
  const names = new Set(input.dependencies.map((d) => d.name.toLowerCase()));
  const paths = input.treePaths.map((p) => p.toLowerCase());
  const has = (pkg: string) => names.has(pkg.toLowerCase());
  const pathHas = (fragment: string) =>
    paths.some((p) => p.includes(fragment.toLowerCase()));

  let framework: string | null = null;
  let frontend: string | null = null;
  let backend: string | null = null;
  let database: string | null = null;
  let orm: string | null = null;
  let authentication: string | null = null;
  let packageManager: string | null = input.packageManagerHint ?? null;
  let deployment: string | null = null;

  if (has("next") || pathHas("next.config")) framework = "Next.js";
  else if (has("nuxt") || pathHas("nuxt.config")) framework = "Nuxt";
  else if (has("@nestjs/core") || pathHas("nest-cli")) framework = "NestJS";
  else if (has("express")) framework = "Express";
  else if (has("@angular/core") || pathHas("angular.json")) framework = "Angular";
  else if (has("vue") || pathHas("vite.config")) {
    if (has("vue")) framework = "Vue";
  } else if (pathHas("artisan") || pathHas("composer.json")) framework = "Laravel";
  else if (pathHas("manage.py") || has("django")) framework = "Django";
  else if (has("fastapi") || pathHas("main.py")) {
    if (has("fastapi")) framework = "FastAPI";
  }

  if (has("react") || has("react-dom") || framework === "Next.js") frontend = "React";
  else if (has("vue") || framework === "Nuxt" || framework === "Vue") frontend = "Vue";
  else if (framework === "Angular") frontend = "Angular";
  else if (has("svelte")) frontend = "Svelte";

  if (framework === "NestJS" || framework === "Express") backend = framework;
  else if (framework === "Django" || framework === "Laravel" || framework === "FastAPI")
    backend = framework;
  else if (framework === "Next.js") backend = "Next.js API Routes";
  else if (has("express")) backend = "Express";

  if (has("@prisma/client") || has("prisma") || pathHas("prisma/schema"))
    orm = "Prisma";
  else if (has("mongoose")) orm = "Mongoose";
  else if (has("typeorm")) orm = "TypeORM";
  else if (has("drizzle-orm") || has("drizzle")) orm = "Drizzle";
  else if (has("sequelize")) orm = "Sequelize";
  else if (has("eloquent") || framework === "Laravel") orm = "Eloquent";

  if (has("pg") || has("postgres") || pathHas("postgresql")) database = "PostgreSQL";
  else if (has("mongodb") || has("mongoose")) database = "MongoDB";
  else if (has("@supabase/supabase-js")) database = "Supabase";
  else if (has("firebase") || has("firebase-admin")) database = "Firebase";
  else if (has("mysql") || has("mysql2")) database = "MySQL";
  else if (orm === "Prisma") database = "PostgreSQL";

  if (has("next-auth") || has("@auth/core")) authentication = "Auth.js";
  else if (has("@clerk/nextjs") || has("@clerk/clerk-react")) authentication = "Clerk";
  else if (has("@supabase/auth-helpers-nextjs")) authentication = "Supabase Auth";
  else if (has("firebase") && pathHas("auth")) authentication = "Firebase Auth";
  else if (has("passport")) authentication = "Passport";

  if (!packageManager) {
    if (pathHas("pnpm-lock.yaml")) packageManager = "pnpm";
    else if (pathHas("yarn.lock")) packageManager = "Yarn";
    else if (pathHas("bun.lock")) packageManager = "Bun";
    else if (pathHas("package-lock.json") || pathHas("package.json"))
      packageManager = "npm";
    else if (pathHas("composer.json")) packageManager = "Composer";
    else if (pathHas("requirements.txt") || pathHas("pyproject.toml"))
      packageManager = "pip";
    else if (pathHas("cargo.toml")) packageManager = "Cargo";
    else if (pathHas("go.mod")) packageManager = "Go modules";
    else if (pathHas("pom.xml")) packageManager = "Maven";
  }

  if (pathHas("vercel.json") || framework === "Next.js") deployment = "Vercel";
  else if (pathHas("netlify.toml")) deployment = "Netlify";
  else if (pathHas("dockerfile") || pathHas("docker-compose"))
    deployment = "Docker";
  else if (pathHas("fly.toml")) deployment = "Fly.io";
  else if (pathHas(".github/workflows")) deployment = "GitHub Actions";

  if (has("tailwindcss") && !frontend) frontend = frontend ?? "Tailwind CSS";

  const languages = Object.keys(input.languages).sort(
    (a, b) => (input.languages[b] ?? 0) - (input.languages[a] ?? 0),
  );

  return {
    framework,
    frontend,
    backend,
    database,
    orm,
    authentication,
    packageManager,
    deployment,
    languages: languages.length ? languages : ["Unknown"],
  };
}

export function buildHealthScores(input: {
  hasReadme: boolean;
  hasLicense: boolean;
  hasTests: boolean;
  hasCi: boolean;
  hasTsConfig: boolean;
  dependencyCount: number;
  folderCount: number;
  primaryLanguage: string | null;
}): RepoHealthScores {
  const architecture = clamp(
    70 +
      (input.hasTsConfig ? 8 : 0) +
      (input.folderCount > 3 ? 6 : 2) +
      (input.primaryLanguage ? 4 : 0),
  );
  const security = clamp(
    68 + (input.hasLicense ? 10 : 0) + (input.hasCi ? 8 : 0) - Math.min(10, Math.floor(input.dependencyCount / 40)),
  );
  const maintainability = clamp(
    72 + (input.hasTests ? 12 : 0) + (input.hasTsConfig ? 6 : 0),
  );
  const documentation = clamp(55 + (input.hasReadme ? 30 : 0) + (input.hasLicense ? 5 : 0));
  const projectStructure = clamp(
    70 + (input.folderCount >= 4 ? 12 : 4) + (input.hasTsConfig ? 6 : 0),
  );
  const dependencyQuality = clamp(
    80 - Math.min(25, Math.floor(Math.max(0, input.dependencyCount - 20) / 3)) + (input.hasTsConfig ? 5 : 0),
  );

  const overall = Math.round(
    architecture * 0.18 +
      security * 0.16 +
      maintainability * 0.18 +
      documentation * 0.16 +
      projectStructure * 0.16 +
      dependencyQuality * 0.16,
  );

  return {
    overall,
    architecture,
    security,
    maintainability,
    documentation,
    projectStructure,
    dependencyQuality,
  };
}

function clamp(n: number) {
  return Math.max(35, Math.min(98, Math.round(n)));
}

export function countTree(nodes: RepoTreeNode[]): { files: number; folders: number } {
  let files = 0;
  let folders = 0;
  const walk = (list: RepoTreeNode[]) => {
    for (const node of list) {
      if (node.type === "folder") {
        folders += 1;
        if (node.children) walk(node.children);
      } else {
        files += 1;
      }
    }
  };
  walk(nodes);
  return { files, folders };
}

export function findLargestFolder(nodes: RepoTreeNode[]): string {
  let best = "—";
  let bestCount = -1;

  const walk = (list: RepoTreeNode[], parentPath: string) => {
    for (const node of list) {
      if (node.type !== "folder") continue;
      const count = countDescendantFiles(node);
      if (count > bestCount) {
        bestCount = count;
        best = node.path || parentPath || node.name;
      }
      if (node.children) walk(node.children, node.path);
    }
  };

  walk(nodes, "");
  return best;
}

function countDescendantFiles(node: RepoTreeNode): number {
  if (node.type === "file") return 1;
  return (node.children ?? []).reduce((sum, child) => sum + countDescendantFiles(child), 0);
}

export function flattenTreePaths(nodes: RepoTreeNode[]): string[] {
  const out: string[] = [];
  const walk = (list: RepoTreeNode[]) => {
    for (const node of list) {
      out.push(node.path);
      if (node.children) walk(node.children);
    }
  };
  walk(nodes);
  return out;
}

export function buildSummaryMarkdown(input: {
  fullName: string;
  description: string | null;
  htmlUrl: string;
  stack: DetectedRepoStack;
  statistics: RepoStatistics;
  health: RepoHealthScores;
}): string {
  return `# Repository Summary — ${input.fullName}

${input.description ?? "_No description provided._"}

- **URL:** ${input.htmlUrl}
- **Health score:** ${input.health.overall}/100
- **Framework:** ${input.stack.framework ?? "—"}
- **Frontend:** ${input.stack.frontend ?? "—"}
- **Backend:** ${input.stack.backend ?? "—"}
- **Database:** ${input.stack.database ?? "—"}
- **Package manager:** ${input.stack.packageManager ?? "—"}

## Statistics

| Metric | Value |
| --- | --- |
| Files | ${input.statistics.files} |
| Folders | ${input.statistics.folders} |
| Lines of code | ${input.statistics.linesOfCode.toLocaleString()} |
| Dependencies | ${input.statistics.dependenciesCount} |
| Largest folder | ${input.statistics.largestFolder} |
| Avg file size | ${input.statistics.averageFileSizeKb} KB |

## Health breakdown

| Area | Score |
| --- | --- |
| Architecture | ${input.health.architecture} |
| Security | ${input.health.security} |
| Maintainability | ${input.health.maintainability} |
| Documentation | ${input.health.documentation} |
| Project structure | ${input.health.projectStructure} |
| Dependency quality | ${input.health.dependencyQuality} |
`;
}

export function assembleAnalysis(input: {
  tree: RepoTreeNode[];
  dependencies: RepoDependency[];
  languages: Record<string, number>;
  sizeKb: number;
  hasLicense: boolean;
  packageManagerHint?: string | null;
}): RepositoryAnalysis {
  const paths = flattenTreePaths(input.tree);
  const { files, folders } = countTree(input.tree);
  const stack = detectStackFromSignals({
    dependencies: input.dependencies,
    treePaths: paths,
    languages: input.languages,
    packageManagerHint: input.packageManagerHint,
  });

  const linesOfCode = Math.max(
    files * 42,
    Object.values(input.languages).reduce((a, b) => a + Math.round(b / 40), 0),
  );

  const statistics: RepoStatistics = {
    files,
    folders,
    linesOfCode,
    languagesUsed: input.languages,
    dependenciesCount: input.dependencies.length,
    largestFolder: findLargestFolder(input.tree),
    averageFileSizeKb:
      files > 0 ? Math.max(1, Math.round((input.sizeKb || files * 4) / files)) : 0,
  };

  const health = buildHealthScores({
    hasReadme: paths.some((p) => /(^|\/)readme(\.|$)/i.test(p)),
    hasLicense: input.hasLicense || paths.some((p) => /(^|\/)license/i.test(p)),
    hasTests: paths.some((p) => /(^|\/)(test|tests|__tests__|spec)\b/i.test(p)),
    hasCi: paths.some((p) => p.includes(".github/workflows")),
    hasTsConfig: paths.some((p) => p.toLowerCase().includes("tsconfig")),
    dependencyCount: input.dependencies.length,
    folderCount: folders,
    primaryLanguage: Object.keys(input.languages)[0] ?? null,
  });

  return {
    stack,
    statistics,
    health,
    tree: input.tree,
    dependencies: input.dependencies,
    summaryMarkdown: "",
  };
}
