import { getEnv } from "@/config/runtime-env";

/**
 * Neon + node-pg URL hygiene:
 * - Drop channel_binding=require (breaks many serverless clients).
 * - Keep sslmode=require compatible with upcoming pg/libpq semantics
 *   via uselibpqcompat=true (avoids the Node SECURITY WARNING).
 */
export function sanitizeDatabaseUrl(connectionString: string): string {
  try {
    const url = new URL(connectionString);
    if (url.searchParams.get("channel_binding") === "require") {
      url.searchParams.delete("channel_binding");
    }

    const sslMode = url.searchParams.get("sslmode");
    if (
      sslMode === "require" ||
      sslMode === "prefer" ||
      sslMode === "verify-ca"
    ) {
      url.searchParams.set("uselibpqcompat", "true");
    }

    return url.toString();
  } catch {
    let sanitized = connectionString.replace(
      /([&?])channel_binding=require&?/g,
      "$1",
    );
    if (
      /[?&]sslmode=(require|prefer|verify-ca)(?:&|$)/i.test(sanitized) &&
      !/[?&]uselibpqcompat=/i.test(sanitized)
    ) {
      sanitized += sanitized.includes("?")
        ? "&uselibpqcompat=true"
        : "?uselibpqcompat=true";
    }
    return sanitized;
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
