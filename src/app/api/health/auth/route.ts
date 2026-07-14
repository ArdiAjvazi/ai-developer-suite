import { NextResponse } from "next/server";
import { runtimeEnv } from "@/config/runtime-env";
import { resolveAuthSecret } from "@/server/auth/env";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Non-secret auth diagnostics for Vercel debugging.
 * Does not expose secret values — only presence / host checks.
 * Force clean production redeploy to rebuild env cache.
 */
export async function GET() {
  const authUrl = runtimeEnv("AUTH_URL") ?? runtimeEnv("NEXTAUTH_URL") ?? null;
  let authUrlHost: string | null = null;
  try {
    authUrlHost = authUrl ? new URL(authUrl).host : null;
  } catch {
    authUrlHost = "invalid-url";
  }

  const hasAuthSecret = Boolean(resolveAuthSecret());
  const hasDatabaseUrl = Boolean(runtimeEnv("DATABASE_URL"));
  const hasAuthUrl = Boolean(authUrl);

  const missing: string[] = [];
  if (!hasAuthSecret) missing.push("NEXTAUTH_SECRET or AUTH_SECRET");
  if (!hasDatabaseUrl) missing.push("DATABASE_URL");
  if (!hasAuthUrl) missing.push("AUTH_URL or NEXTAUTH_URL");

  return NextResponse.json({
    ok: missing.length === 0,
    hasAuthSecret,
    hasDatabaseUrl,
    hasAuthUrl,
    hasGithubOAuth: Boolean(
      runtimeEnv("AUTH_GITHUB_ID") && runtimeEnv("AUTH_GITHUB_SECRET"),
    ),
    authUrlHost,
    missing,
    hint:
      missing.length > 0
        ? "Set missing vars in Vercel → Settings → Environment Variables for Production (enable Build + Runtime), then Redeploy."
        : null,
    vercelEnv: runtimeEnv("VERCEL_ENV") ?? null,
    vercelUrl: runtimeEnv("VERCEL_URL") ?? null,
  });
}
