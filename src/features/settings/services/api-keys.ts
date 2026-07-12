import { prisma } from "@/server/db/prisma";
import { writeAuditLog } from "@/server/security/audit";
import {
  decryptSecret,
  encryptSecret,
  secretHint,
} from "@/server/security/secret-crypto";
import { ensureUserSettings } from "@/features/settings/services/ensure-settings";
import type { ApiKeysInput } from "@/features/settings/schemas/settings";
import type { ApiKeyProvider, ConnectionStatus } from "@/features/settings/types";

function looksMasked(value: string | undefined) {
  return Boolean(value && value.includes("•"));
}

export async function updateApiKeysForUser(userId: string, input: ApiKeysInput) {
  await ensureUserSettings(userId);

  const data: {
    openaiKeyEnc?: string;
    openaiKeyHint?: string;
    openaiStatus?: string;
    openaiValidatedAt?: Date | null;
    githubTokenEnc?: string;
    githubTokenHint?: string;
    githubStatus?: string;
    githubValidatedAt?: Date | null;
    anthropicKeyEnc?: string;
    anthropicKeyHint?: string;
    anthropicStatus?: string;
    anthropicValidatedAt?: Date | null;
  } = {};

  const providers: string[] = [];

  if (input.openai && !looksMasked(input.openai)) {
    data.openaiKeyEnc = encryptSecret(input.openai);
    data.openaiKeyHint = secretHint(input.openai);
    data.openaiStatus = "never";
    data.openaiValidatedAt = null;
    providers.push("openai");
  }
  if (input.github && !looksMasked(input.github)) {
    data.githubTokenEnc = encryptSecret(input.github);
    data.githubTokenHint = secretHint(input.github);
    data.githubStatus = "never";
    data.githubValidatedAt = null;
    providers.push("github");
  }
  if (input.anthropic && !looksMasked(input.anthropic)) {
    data.anthropicKeyEnc = encryptSecret(input.anthropic);
    data.anthropicKeyHint = secretHint(input.anthropic);
    data.anthropicStatus = "never";
    data.anthropicValidatedAt = null;
    providers.push("anthropic");
  }

  if (providers.length === 0) {
    throw new Error("No new API keys were provided.");
  }

  await prisma.userSettings.update({
    where: { userId },
    data,
  });

  await writeAuditLog({
    userId,
    action: "api_keys.updated",
    metadata: { providers },
  });
}

async function readProviderSecret(
  userId: string,
  provider: ApiKeyProvider,
): Promise<string | null> {
  const settings = await ensureUserSettings(userId);
  const enc =
    provider === "openai"
      ? settings.openaiKeyEnc
      : provider === "github"
        ? settings.githubTokenEnc
        : settings.anthropicKeyEnc;
  if (!enc) return null;
  return decryptSecret(enc);
}

export async function validateApiKeyForUser(
  userId: string,
  provider: ApiKeyProvider,
): Promise<{ status: ConnectionStatus; validatedAt: string }> {
  const secret = await readProviderSecret(userId, provider);
  if (!secret) {
    throw new Error("No API key configured for this provider.");
  }

  let status: ConnectionStatus = "invalid";

  try {
    if (provider === "openai") {
      const res = await fetch("https://api.openai.com/v1/models", {
        headers: { Authorization: `Bearer ${secret}` },
        signal: AbortSignal.timeout(8000),
      });
      status = res.ok ? "connected" : "invalid";
    } else if (provider === "github") {
      const res = await fetch("https://api.github.com/user", {
        headers: {
          Authorization: `Bearer ${secret}`,
          Accept: "application/vnd.github+json",
          "User-Agent": "CodePilot-AI",
        },
        signal: AbortSignal.timeout(8000),
      });
      status = res.ok ? "connected" : "invalid";
    } else {
      const res = await fetch("https://api.anthropic.com/v1/models", {
        headers: {
          "x-api-key": secret,
          "anthropic-version": "2023-06-01",
        },
        signal: AbortSignal.timeout(8000),
      });
      if (res.status === 401 || res.status === 403) status = "invalid";
      else if (res.ok) status = "connected";
      else status = "invalid";
    }
  } catch {
    status = "invalid";
  }

  const validatedAt = new Date();
  const data =
    provider === "openai"
      ? { openaiStatus: status, openaiValidatedAt: validatedAt }
      : provider === "github"
        ? { githubStatus: status, githubValidatedAt: validatedAt }
        : { anthropicStatus: status, anthropicValidatedAt: validatedAt };

  await prisma.userSettings.update({ where: { userId }, data });

  await writeAuditLog({
    userId,
    action: "api_keys.validated",
    metadata: { provider, status },
  });

  return { status, validatedAt: validatedAt.toISOString() };
}
