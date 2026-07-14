import { runtimeEnv } from "@/config/runtime-env";

/**
 * Normalize Auth.js env before NextAuth reads process.env.
 * Bad AUTH_URL values crash next-auth's reqWithEnvURL (unhandled new URL()).
 * Localhost AUTH_URL on Vercel rewrites redirects to the wrong host after login.
 */
export function prepareAuthEnv(): void {
  const raw = runtimeEnv("AUTH_URL") ?? runtimeEnv("NEXTAUTH_URL");

  let parsed: URL | null = null;
  if (raw) {
    try {
      parsed = new URL(raw);
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        parsed = null;
      }
    } catch {
      parsed = null;
    }
  }

  const onVercel = runtimeEnv("VERCEL") === "1";
  const vercelHost =
    runtimeEnv("VERCEL_PROJECT_PRODUCTION_URL")?.replace(/^https?:\/\//, "") ||
    runtimeEnv("VERCEL_URL");

  const isLocalhost =
    !!parsed &&
    (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1");

  if (onVercel && vercelHost && (!parsed || isLocalhost)) {
    const canonical = `https://${vercelHost.replace(/\/$/, "")}`;
    process.env.AUTH_URL = canonical;
    process.env.NEXTAUTH_URL = canonical;
    console.warn(`[auth] Using deployment URL for Auth.js: ${canonical}`);
    return;
  }

  if (!parsed) {
    if (raw) {
      console.error(
        "[auth] Invalid AUTH_URL/NEXTAUTH_URL — clearing so trustHost can infer the host.",
      );
    }
    delete process.env.AUTH_URL;
    delete process.env.NEXTAUTH_URL;
    return;
  }

  // Origin only — a path becomes basePath and breaks /api/auth.
  const origin = parsed.origin;
  process.env.AUTH_URL = origin;
  process.env.NEXTAUTH_URL = origin;
}

/** Prefer NEXTAUTH_SECRET, then AUTH_SECRET (Auth.js v5 accepts either). */
export function resolveAuthSecret(): string | undefined {
  return runtimeEnv("NEXTAUTH_SECRET") ?? runtimeEnv("AUTH_SECRET");
}
