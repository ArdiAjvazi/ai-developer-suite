import { prisma } from "@/server/db/prisma";
import {
  maskSecret,
  secretHint,
  encryptSecret,
} from "@/server/security/secret-crypto";
import { ensureUserSettings } from "@/features/settings/services/ensure-settings";
import type {
  ApiKeyPublicState,
  SettingsSnapshot,
  SessionInfo,
} from "@/features/settings/types";

function mapApiKeys(settings: {
  openaiKeyEnc: string | null;
  openaiKeyHint: string | null;
  openaiValidatedAt: Date | null;
  openaiStatus: string;
  githubTokenEnc: string | null;
  githubTokenHint: string | null;
  githubValidatedAt: Date | null;
  githubStatus: string;
  anthropicKeyEnc: string | null;
  anthropicKeyHint: string | null;
  anthropicValidatedAt: Date | null;
  anthropicStatus: string;
}): ApiKeyPublicState[] {
  return [
    {
      provider: "openai",
      configured: Boolean(settings.openaiKeyEnc),
      masked: settings.openaiKeyEnc
        ? maskSecret(settings.openaiKeyHint, "sk")
        : null,
      status: (settings.openaiStatus as ApiKeyPublicState["status"]) || "never",
      validatedAt: settings.openaiValidatedAt?.toISOString() ?? null,
    },
    {
      provider: "github",
      configured: Boolean(settings.githubTokenEnc),
      masked: settings.githubTokenEnc
        ? maskSecret(settings.githubTokenHint, "ghp")
        : null,
      status: (settings.githubStatus as ApiKeyPublicState["status"]) || "never",
      validatedAt: settings.githubValidatedAt?.toISOString() ?? null,
    },
    {
      provider: "anthropic",
      configured: Boolean(settings.anthropicKeyEnc),
      masked: settings.anthropicKeyEnc
        ? maskSecret(settings.anthropicKeyHint, "sk-ant")
        : null,
      status:
        (settings.anthropicStatus as ApiKeyPublicState["status"]) || "never",
      validatedAt: settings.anthropicValidatedAt?.toISOString() ?? null,
    },
  ];
}

export async function getSettingsSnapshot(
  userId: string,
  currentSessionToken?: string | null,
): Promise<SettingsSnapshot | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
    },
  });
  if (!user) return null;

  const settings = await ensureUserSettings(userId);
  const sessions = await prisma.session.findMany({
    where: { userId },
    orderBy: { expires: "desc" },
    take: 20,
  });

  const sessionInfos: SessionInfo[] = [
    {
      id: "current",
      current: true,
      createdAt: null,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      label: "This device (active session)",
    },
    ...sessions
      .filter((session) => session.sessionToken !== currentSessionToken)
      .map((session) => ({
        id: session.id,
        current: false,
        createdAt: null,
        expiresAt: session.expires.toISOString(),
        label: `Session · expires ${session.expires.toLocaleString()}`,
      })),
  ];

  return {
    profile: {
      name: user.name ?? "",
      email: user.email,
      username: settings.username ?? user.email.split("@")[0] ?? "user",
      image: user.image,
    },
    apiKeys: mapApiKeys(settings),
    ai: {
      aiProvider: settings.aiProvider === "anthropic" ? "anthropic" : "openai",
      aiModel: settings.aiModel,
      temperature: settings.temperature,
      maxTokens: settings.maxTokens,
      language: settings.language,
      reviewStyle:
        settings.reviewStyle === "strict" || settings.reviewStyle === "beginner"
          ? settings.reviewStyle
          : "balanced",
    },
    appearance: {
      theme:
        settings.theme === "light" || settings.theme === "system"
          ? settings.theme
          : "dark",
      sidebarCollapsed: settings.sidebarCollapsed,
      compactMode: settings.compactMode,
      animations: settings.animations,
      reducedMotion: settings.reducedMotion,
    },
    notifications: {
      emailNotifications: settings.emailNotifications,
      notifyReviewCompleted: settings.notifyReviewCompleted,
      notifyRepoImported: settings.notifyRepoImported,
      notifySecurityAlerts: settings.notifySecurityAlerts,
      notifyWeeklyReports: settings.notifyWeeklyReports,
    },
    sessions: sessionInfos,
  };
}
