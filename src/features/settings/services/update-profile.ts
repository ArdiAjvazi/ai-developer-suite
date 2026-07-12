import { prisma } from "@/server/db/prisma";
import { writeAuditLog } from "@/server/security/audit";
import { ensureUserSettings } from "@/features/settings/services/ensure-settings";
import type { ProfileInput } from "@/features/settings/schemas/settings";

export async function updateProfileForUser(userId: string, input: ProfileInput) {
  const email = input.email.toLowerCase();

  const existingEmail = await prisma.user.findFirst({
    where: { email, NOT: { id: userId } },
    select: { id: true },
  });
  if (existingEmail) {
    throw new Error("That email address is already in use.");
  }

  const settings = await ensureUserSettings(userId);
  if (input.username) {
    const taken = await prisma.userSettings.findFirst({
      where: {
        username: input.username,
        NOT: { id: settings.id },
      },
      select: { id: true },
    });
    if (taken) {
      throw new Error("That username is already taken.");
    }
  }

  const image =
    input.image === "" || input.image == null ? null : input.image;

  if (image && image.startsWith("data:image/") && image.length > 350_000) {
    throw new Error("Avatar is too large. Please use an image under 250KB.");
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: {
        name: input.name,
        email,
        image,
      },
    }),
    prisma.userSettings.update({
      where: { userId },
      data: { username: input.username },
    }),
  ]);

  await writeAuditLog({
    userId,
    action: "profile.updated",
    metadata: { email, username: input.username },
  });
}
