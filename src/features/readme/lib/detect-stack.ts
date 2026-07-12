import type { DetectedStack } from "@/features/readme/types";

function has(text: string, pattern: RegExp) {
  return pattern.test(text);
}

export function detectProjectStack(
  description: string,
  fallbackStack?: string,
): DetectedStack {
  const text = description.toLowerCase();

  const language =
    (has(text, /\btypescript\b|\.tsx?\b/) && "TypeScript") ||
    (has(text, /\bjavascript\b|\.jsx?\b/) && "JavaScript") ||
    (has(text, /\bpython\b|\.py\b|django|fastapi|flask/) && "Python") ||
    (has(text, /\brust\b|\.rs\b|cargo/) && "Rust") ||
    (has(text, /\bgolang\b|\bgo\b|\.go\b/) && "Go") ||
    (has(text, /\bjava\b|\.java\b/) && "Java") ||
    null;

  const framework =
    (has(text, /\bnext\.?js\b/) && "Next.js") ||
    (has(text, /\bnest\.?js\b/) && "NestJS") ||
    (has(text, /\bexpress\b/) && "Express") ||
    (has(text, /\bdjango\b/) && "Django") ||
    (has(text, /\bfastapi\b/) && "FastAPI") ||
    (has(text, /\bflask\b/) && "Flask") ||
    (has(text, /\brails\b/) && "Rails") ||
    (has(text, /\blaravel\b/) && "Laravel") ||
    null;

  const packageManager =
    (has(text, /\bpnpm\b/) && "pnpm") ||
    (has(text, /\byarn\b/) && "yarn") ||
    (has(text, /\bbun\b/) && "bun") ||
    (has(text, /\bpip\b|poetry|requirements\.txt/) && "pip") ||
    (has(text, /\bcargo\b/) && "cargo") ||
    (has(text, /\bnpm\b|package\.json/) && "npm") ||
    (language === "TypeScript" || language === "JavaScript" ? "npm" : null);

  const frontend =
    (has(text, /\bnext\.?js\b/) && "Next.js") ||
    (has(text, /\breact\b/) && "React") ||
    (has(text, /\bvue\b/) && "Vue") ||
    (has(text, /\bsvelte\b/) && "Svelte") ||
    null;

  const backend =
    (has(text, /\bnext\.?js\b|app router|route handlers/) && "Next.js API") ||
    (has(text, /\bnode\.?js\b|express|nest/) && "Node.js") ||
    (has(text, /\bfastapi|django|flask|python/) && "Python") ||
    null;

  const database =
    (has(text, /\bpostgres|postgresql|neon\b/) && "PostgreSQL") ||
    (has(text, /\bmongodb|mongo\b/) && "MongoDB") ||
    (has(text, /\bmysql\b/) && "MySQL") ||
    (has(text, /\bsqlite\b/) && "SQLite") ||
    (has(text, /\bredis\b/) && "Redis") ||
    null;

  const orm =
    (has(text, /\bprisma\b/) && "Prisma") ||
    (has(text, /\bdrizzle\b/) && "Drizzle") ||
    (has(text, /\btypeorm\b/) && "TypeORM") ||
    (has(text, /\bsqlalchemy\b/) && "SQLAlchemy") ||
    null;

  const authentication =
    (has(text, /\bauth\.js|nextauth|next-auth\b/) && "Auth.js") ||
    (has(text, /\bclerk\b/) && "Clerk") ||
    (has(text, /\bsupabase auth\b/) && "Supabase Auth") ||
    (has(text, /\boauth|jwt\b/) && "OAuth / JWT") ||
    null;

  const deployment =
    (has(text, /\bvercel\b/) && "Vercel") ||
    (has(text, /\bnetlify\b/) && "Netlify") ||
    (has(text, /\bdocker\b/) && "Docker") ||
    (has(text, /\baws\b/) && "AWS") ||
    (has(text, /\brailway\b/) && "Railway") ||
    null;

  const primaryStack =
    fallbackStack ||
    framework ||
    frontend ||
    language ||
    "Full-stack SaaS";

  return {
    language,
    framework,
    packageManager,
    backend,
    frontend,
    database,
    orm,
    authentication,
    deployment,
    primaryStack,
  };
}

export function deriveProjectName(description: string, fallback?: string) {
  if (fallback?.trim()) return fallback.trim();

  const firstLine =
    description
      .split(/\r?\n/)
      .map((line) => line.trim())
      .find((line) => line.length > 0) ?? "Untitled Project";

  return firstLine
    .replace(/^#+\s*/, "")
    .replace(/^["'`]+|["'`]+$/g, "")
    .slice(0, 80);
}
