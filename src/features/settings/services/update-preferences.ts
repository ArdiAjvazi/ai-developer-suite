import { prisma } from "@/server/db/prisma";
import { writeAuditLog } from "@/server/security/audit";
import { ensureUserSettings } from "@/features/settings/services/ensure-settings";
import type { PreferencesInput } from "@/features/settings/schemas/settings";

export async function updatePreferencesForUser(
  userId: string,
  input: PreferencesInput,
) {
  await ensureUserSettings(userId);

  await prisma.userSettings.update({
    where: { userId },
    data: {
      aiProvider: input.ai.aiProvider,
      aiModel: input.ai.aiModel,
      temperature: input.ai.temperature,
      maxTokens: input.ai.maxTokens,
      language: input.ai.language,
      reviewStyle: input.ai.reviewStyle,
      theme: input.appearance.theme,
      sidebarCollapsed: input.appearance.sidebarCollapsed,
      compactMode: input.appearance.compactMode,
      animations: input.appearance.animations,
      reducedMotion: input.appearance.reducedMotion,
      emailNotifications: input.notifications.emailNotifications,
      notifyReviewCompleted: input.notifications.notifyReviewCompleted,
      notifyRepoImported: input.notifications.notifyRepoImported,
      notifySecurityAlerts: input.notifications.notifySecurityAlerts,
      notifyWeeklyReports: input.notifications.notifyWeeklyReports,
    },
  });

  await writeAuditLog({
    userId,
    action: "preferences.changed",
    metadata: {
      aiProvider: input.ai.aiProvider,
      theme: input.appearance.theme,
    },
  });
}
