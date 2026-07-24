import { getEnv } from "@/config/runtime-env";

/** Neon + node-pg: channel_binding=require often breaks serverless clients. */
export function sanitizeDatabaseUrl(connectionString: string): string {
  try {
    const url = new URL(connectionString);
    if (url.searchParams.get("channel_binding") === "require") {
      url.searchParams.delete("channel_binding");
    }
    return url.toString();
  } catch {
    return connectionString.replace(/([&?])channel_binding=require&?/g, "$1");
  }
}

export { isNextBuildPhase } from "@/config/runtime-env";

/**
 * Resolve DATABASE_URL for Prisma at runtime.
 * No fake app-level placeholder — missing URL is a real configuration error.
 * (prisma.config.js may still use a generate-only placeholder for `prisma generate`.)
 */
export function resolveDatabaseUrl(): string {
  const configured = getEnv("DATABASE_URL");
  if (configured) return sanitizeDatabaseUrl(configured);

  throw new Error(
    "DATABASE_URL is not set. Set it in Vercel → Environment Variables (Production, Runtime) and redeploy.",
  );
}
