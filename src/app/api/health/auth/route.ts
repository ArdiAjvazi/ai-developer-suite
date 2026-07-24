import { NextResponse } from "next/server";
import { getEnv } from "@/config/runtime-env";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Non-secret diagnostics: presence of env vars via dynamic (non-inlined) reads.
 */
export async function GET() {
  const authUrl = getEnv("AUTH_URL") ?? getEnv("NEXTAUTH_URL") ?? null;
  let authUrlHost: string | null = null;
  try {
    authUrlHost = authUrl ? new URL(authUrl).host : null;
  } catch {
    authUrlHost = "invalid-url";
  }

  const hasAuthSecret = Boolean(
    getEnv("AUTH_SECRET") ?? getEnv("NEXTAUTH_SECRET"),
  );
  const hasDatabaseUrl = Boolean(getEnv("DATABASE_URL"));
  const hasAuthUrl = Boolean(authUrl);

  const missing: string[] = [];
  if (!hasAuthSecret) missing.push("AUTH_SECRET or NEXTAUTH_SECRET");
  if (!hasDatabaseUrl) missing.push("DATABASE_URL");
  if (!hasAuthUrl) missing.push("AUTH_URL or NEXTAUTH_URL");

  return NextResponse.json({
    ok: missing.length === 0,
    hasAuthSecret,
    hasDatabaseUrl,
    hasAuthUrl,
    hasGithubOAuth: Boolean(
      getEnv("AUTH_GITHUB_ID") && getEnv("AUTH_GITHUB_SECRET"),
    ),
    authUrlHost,
    missing,
    // Confirms dynamic lookup sees platform vars (sanity check for inlining bugs).
    vercelEnv: getEnv("VERCEL_ENV") ?? null,
    vercelUrl: getEnv("VERCEL_URL") ?? null,
  });
}
