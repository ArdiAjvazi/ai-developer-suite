import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

type EnvSnapshot = Record<string, string>;

let snapshotCache: EnvSnapshot | null | undefined;

/**
 * Load build-time env snapshot (written by scripts/snapshot-runtime-env.mjs).
 * Used when Vercel/Next leaves custom secrets out of process.env at runtime.
 */
function loadEnvSnapshot(): EnvSnapshot {
  if (snapshotCache !== undefined) {
    return snapshotCache ?? {};
  }

  const candidates = [
    join(process.cwd(), ".runtime-env.json"),
    join(process.cwd(), ".next", "..", ".runtime-env.json"),
  ];

  for (const path of candidates) {
    try {
      if (!existsSync(path)) continue;
      const raw = readFileSync(path, "utf8");
      const parsed = JSON.parse(raw) as EnvSnapshot;
      snapshotCache = parsed && typeof parsed === "object" ? parsed : {};
      return snapshotCache;
    } catch (error) {
      console.error("[runtime-env] failed to read snapshot", path, error);
    }
  }

  snapshotCache = null;
  return {};
}

function clean(value: string | undefined | null): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim().replace(/^["']|["']$/g, "");
  return trimmed.length > 0 ? trimmed : undefined;
}

/**
 * Static process.env reads so Next/Turbopack keep these server keys available.
 * Falls back to the build-time `.runtime-env.json` snapshot when live env is empty.
 */
function readLive(name: string): string | undefined {
  // IMPORTANT: keep these as literal process.env.KEY references (not dynamic).
  switch (name) {
    case "DATABASE_URL":
      return clean(process.env.DATABASE_URL);
    case "AUTH_SECRET":
      return clean(process.env.AUTH_SECRET);
    case "NEXTAUTH_SECRET":
      return clean(process.env.NEXTAUTH_SECRET);
    case "AUTH_URL":
      return clean(process.env.AUTH_URL);
    case "NEXTAUTH_URL":
      return clean(process.env.NEXTAUTH_URL);
    case "AUTH_GITHUB_ID":
      return clean(process.env.AUTH_GITHUB_ID);
    case "AUTH_GITHUB_SECRET":
      return clean(process.env.AUTH_GITHUB_SECRET);
    case "SETTINGS_ENCRYPTION_KEY":
      return clean(process.env.SETTINGS_ENCRYPTION_KEY);
    case "OPENAI_API_KEY":
      return clean(process.env.OPENAI_API_KEY);
    case "OPENAI_BASE_URL":
      return clean(process.env.OPENAI_BASE_URL);
    case "OPENAI_MODEL":
      return clean(process.env.OPENAI_MODEL);
    case "AUTH_DEBUG":
      return clean(process.env.AUTH_DEBUG);
    case "VERCEL":
      return clean(process.env.VERCEL);
    case "VERCEL_ENV":
      return clean(process.env.VERCEL_ENV);
    case "VERCEL_URL":
      return clean(process.env.VERCEL_URL);
    case "VERCEL_PROJECT_PRODUCTION_URL":
      return clean(process.env.VERCEL_PROJECT_PRODUCTION_URL);
    default:
      return clean(process.env[name]);
  }
}

export function runtimeEnv(name: string): string | undefined {
  const live = readLive(name);
  if (live) return live;

  const fromSnapshot = clean(loadEnvSnapshot()[name]);
  if (fromSnapshot) {
    // Re-hydrate process.env so Auth.js / Prisma see the value too.
    process.env[name] = fromSnapshot;
    return fromSnapshot;
  }

  return undefined;
}

export function requireRuntimeEnv(name: string): string {
  const value = runtimeEnv(name);
  if (!value) {
    throw new Error(
      `Missing environment variable ${name}. Set it for Production (Build + Runtime) in Vercel and redeploy.`,
    );
  }
  return value;
}

/** Presence diagnostics without exposing secret values. */
export function envPresenceReport() {
  const keys = [
    "DATABASE_URL",
    "AUTH_SECRET",
    "NEXTAUTH_SECRET",
    "AUTH_URL",
    "NEXTAUTH_URL",
  ] as const;

  const snapshot = loadEnvSnapshot();
  const report = keys.map((key) => ({
    key,
    live: Boolean(readLive(key)),
    snapshot: Boolean(clean(snapshot[key])),
    resolved: Boolean(runtimeEnv(key)),
  }));

  return {
    snapshotKeyCount: Object.keys(snapshot).length,
    snapshotLoaded: snapshotCache !== null && snapshotCache !== undefined,
    keys: report,
  };
}
