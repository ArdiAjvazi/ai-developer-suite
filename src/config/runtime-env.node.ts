import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { runtimeEnv } from "@/config/runtime-env";

type EnvSnapshot = Record<string, string>;

let snapshotCache: EnvSnapshot | null | undefined;
let hydrated = false;

function clean(value: string | undefined | null): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim().replace(/^["']|["']$/g, "");
  return trimmed.length > 0 ? trimmed : undefined;
}

function snapshotPath(): string {
  // Keep path statically scoped so Turbopack NFT tracing stays narrow.
  return join(/*turbopackIgnore: true*/ process.cwd(), ".runtime-env.json");
}

/**
 * Load build-time env snapshot (written by scripts/snapshot-runtime-env.mjs).
 * Node/runtime only — never import this from Edge (`src/proxy.ts`).
 */
function loadEnvSnapshot(): EnvSnapshot {
  if (snapshotCache !== undefined) {
    return snapshotCache ?? {};
  }

  const path = snapshotPath();
  try {
    if (existsSync(path)) {
      const raw = readFileSync(path, "utf8");
      const parsed = JSON.parse(raw) as EnvSnapshot;
      snapshotCache = parsed && typeof parsed === "object" ? parsed : {};
      return snapshotCache;
    }
  } catch (error) {
    console.error("[runtime-env] failed to read snapshot", path, error);
  }

  snapshotCache = null;
  return {};
}

/**
 * Copy snapshot values into process.env when live env is empty.
 * Call once at the start of Node route handlers / Prisma bootstrap.
 */
export function hydrateRuntimeEnvFromSnapshot(): void {
  if (hydrated) return;
  hydrated = true;

  const snapshot = loadEnvSnapshot();
  let applied = 0;
  for (const [key, value] of Object.entries(snapshot)) {
    if (!clean(process.env[key]) && clean(value)) {
      process.env[key] = value;
      applied += 1;
    }
  }

  if (applied > 0) {
    console.info(`[runtime-env] hydrated ${applied} keys from .runtime-env.json`);
  }
}

export function envPresenceReport() {
  const before = {
    DATABASE_URL: Boolean(clean(process.env.DATABASE_URL)),
    AUTH_SECRET: Boolean(clean(process.env.AUTH_SECRET)),
    NEXTAUTH_SECRET: Boolean(clean(process.env.NEXTAUTH_SECRET)),
    AUTH_URL: Boolean(clean(process.env.AUTH_URL)),
    NEXTAUTH_URL: Boolean(clean(process.env.NEXTAUTH_URL)),
  };

  const snapshot = loadEnvSnapshot();
  hydrateRuntimeEnvFromSnapshot();

  const keys = [
    "DATABASE_URL",
    "AUTH_SECRET",
    "NEXTAUTH_SECRET",
    "AUTH_URL",
    "NEXTAUTH_URL",
  ] as const;

  return {
    snapshotKeyCount: Object.keys(snapshot).length,
    snapshotLoaded: snapshotCache !== null && snapshotCache !== undefined,
    keys: keys.map((key) => ({
      key,
      live: before[key],
      snapshot: Boolean(clean(snapshot[key])),
      resolved: Boolean(runtimeEnv(key)),
    })),
  };
}
