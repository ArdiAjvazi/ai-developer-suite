/**
 * Read environment variables at runtime.
 *
 * Next.js can inline `process.env.SOME_KEY` at build time. If a secret was
 * missing during `next build`, the bundled value stays empty forever even
 * after you add it in Vercel — unless access goes through a dynamic key.
 */
export function runtimeEnv(name: string): string | undefined {
  const value = process.env[name];
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim().replace(/^["']|["']$/g, "");
  return trimmed.length > 0 ? trimmed : undefined;
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
