import { getEnv } from "@/config/runtime-env";

/**
 * Normalize AUTH_URL / NEXTAUTH_URL for Auth.js on Vercel.
 * Edge-safe — process.env only, no filesystem.
 */
export function prepareAuthEnv(): void {
  const raw = getEnv("AUTH_URL") ?? getEnv("NEXTAUTH_URL");
  if (!raw) {
    // trustHost: true lets Auth.js infer host from request headers.
    return;
  }

  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    console.error("[auth] Ignoring invalid AUTH_URL / NEXTAUTH_URL");
    return;
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    console.error("[auth] Ignoring AUTH_URL with unsupported protocol");
    return;
  }

  // Auth.js should receive origin only (a path becomes basePath and breaks /api/auth).
  const origin = parsed.origin;
  const env = process.env;
  env.AUTH_URL = origin;
  env.NEXTAUTH_URL = origin;
}

/**
 * Prefer AUTH_SECRET, then NEXTAUTH_SECRET (Auth.js / NextAuth compatibility).
 * Returns undefined when unset — Auth.js reports Configuration itself.
 */
export function resolveAuthSecret(): string | undefined {
  return getEnv("AUTH_SECRET") ?? getEnv("NEXTAUTH_SECRET");
}
