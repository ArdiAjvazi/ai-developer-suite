import { getEnv } from "@/config/runtime-env";

export type OAuthProviderFlags = {
  github: boolean;
  google: boolean;
};

function resolveOAuthCredentials(
  primaryId: string,
  primarySecret: string,
  fallbackId: string,
  fallbackSecret: string,
): { id: string; secret: string } | null {
  const id = getEnv(primaryId) ?? getEnv(fallbackId);
  const secret = getEnv(primarySecret) ?? getEnv(fallbackSecret);
  if (!id || !secret) return null;
  return { id, secret };
}

/** GitHub: AUTH_GITHUB_* (preferred) or GITHUB_CLIENT_* */
export function resolveGitHubOAuth() {
  return resolveOAuthCredentials(
    "AUTH_GITHUB_ID",
    "AUTH_GITHUB_SECRET",
    "GITHUB_CLIENT_ID",
    "GITHUB_CLIENT_SECRET",
  );
}

/** Google: AUTH_GOOGLE_* (preferred) or GOOGLE_CLIENT_* */
export function resolveGoogleOAuth() {
  return resolveOAuthCredentials(
    "AUTH_GOOGLE_ID",
    "AUTH_GOOGLE_SECRET",
    "GOOGLE_CLIENT_ID",
    "GOOGLE_CLIENT_SECRET",
  );
}

export function getOAuthProviderFlags(): OAuthProviderFlags {
  return {
    github: Boolean(resolveGitHubOAuth()),
    google: Boolean(resolveGoogleOAuth()),
  };
}
