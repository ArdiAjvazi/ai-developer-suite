import { prisma } from "@/server/db/prisma";

export async function ensureUserSettings(userId: string) {
  return prisma.userSettings.upsert({
    where: { userId },
    create: { userId },
    update: {},
  });
}
