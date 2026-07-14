import { NextResponse } from "next/server";

/**
 * Non-secret auth diagnostics for Vercel debugging.
 * Does not expose secret values — only presence / host checks.
 */
export async function GET() {
  const authUrl = process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? null;
  let authUrlHost: string | null = null;
  try {
    authUrlHost = authUrl ? new URL(authUrl).host : null;
  } catch {
    authUrlHost = "invalid-url";
  }

  return NextResponse.json({
    ok: true,
    hasAuthSecret: Boolean(
      process.env.AUTH_SECRET?.trim() || process.env.NEXTAUTH_SECRET?.trim(),
    ),
    hasDatabaseUrl: Boolean(process.env.DATABASE_URL?.trim()),
    hasGithubOAuth: Boolean(
      process.env.AUTH_GITHUB_ID?.trim() &&
        process.env.AUTH_GITHUB_SECRET?.trim(),
    ),
    authUrlHost,
    vercelEnv: process.env.VERCEL_ENV ?? null,
    vercelUrl: process.env.VERCEL_URL ?? null,
  });
}
