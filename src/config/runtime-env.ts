/**
 * Edge-safe environment helpers (no Node `fs` — used by `src/proxy.ts`).
 *
 * Static `process.env.KEY` references keep Turbopack/Next from stripping keys.
 * Snapshot hydration lives in `runtime-env.node.ts` (Node/runtime only).
 */

function clean(value: string | undefined | null): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim().replace(/^["']|["']$/g, "");
  return trimmed.length > 0 ? trimmed : undefined;
}

/** True while Next.js is compiling / collecting page data. */
export function isNextBuildPhase(): boolean {
  return (
    process.env.NEXT_PHASE === "phase-production-build" ||
    process.env.NEXT_PHASE === "phase-production-compile" ||
    process.env.npm_lifecycle_event === "build"
  );
}

const BUILD_FALLBACK_SECRET = "fallback-secret-for-build";

/**
 * Static process.env reads so Next/Turbopack keep these server keys available.
 */
export function runtimeEnv(name: string): string | undefined {
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

export function requireRuntimeEnv(name: string): string {
  const value = runtimeEnv(name);
  if (!value) {
    throw new Error(
      `Missing environment variable ${name}. Set it for Production (Build + Runtime) in Vercel and redeploy.`,
    );
  }
  return value;
}

/**
 * Auth.js secret with build-safe fallback so NextAuth does not throw during
 * `next build` page collection when secrets are only available at runtime.
 *
 * Prefer AUTH_SECRET, then NEXTAUTH_SECRET (user-requested order).
 */
export function resolveAuthSecretWithFallback(): string {
  return (
    runtimeEnv("AUTH_SECRET") ||
    runtimeEnv("NEXTAUTH_SECRET") ||
    BUILD_FALLBACK_SECRET
  );
}

/** Presence diagnostics without exposing secret values (live process.env only). */
export function envPresenceReportLive() {
  const keys = [
    "DATABASE_URL",
    "AUTH_SECRET",
    "NEXTAUTH_SECRET",
    "AUTH_URL",
    "NEXTAUTH_URL",
  ] as const;

  return keys.map((key) => ({
    key,
    live: Boolean(runtimeEnv(key)),
  }));
}

export { BUILD_FALLBACK_SECRET };
