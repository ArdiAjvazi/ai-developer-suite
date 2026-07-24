/**
 * Server env access that cannot be emptied by Turbopack/Next at build time.
 *
 * Root cause of the Vercel auth failure:
 * Literal `process.env.AUTH_SECRET` / `process.env.DATABASE_URL` can be replaced
 * with `undefined` during `next build` when those secrets are absent from the
 * Build environment (common for Sensitive / Runtime-only Vercel secrets).
 * The bundled server code then never sees the values Vercel injects at runtime.
 *
 * Dynamic key access (`env[name]`) keeps a real runtime lookup.
 */

function clean(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim().replace(/^["']|["']$/g, "");
  return trimmed.length > 0 ? trimmed : undefined;
}

/** Read a server env var at request/runtime — never bake empty values at build. */
export function getEnv(name: string): string | undefined {
  // Important: do not rewrite as process.env.SOME_LITERAL — that can be inlined.
  const env = process.env;
  return clean(env[name]);
}

export function requireEnv(name: string): string {
  const value = getEnv(name);
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. Set it in Vercel → Settings → Environment Variables (Production, Runtime), then redeploy.`,
    );
  }
  return value;
}

/** @deprecated Use getEnv — kept for existing call sites during migration. */
export function runtimeEnv(name: string): string | undefined {
  return getEnv(name);
}

export function isNextBuildPhase(): boolean {
  const env = process.env;
  return (
    env.NEXT_PHASE === "phase-production-build" ||
    env.NEXT_PHASE === "phase-production-compile" ||
    env.npm_lifecycle_event === "build"
  );
}
