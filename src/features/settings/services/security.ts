import bcrypt from "bcryptjs";
import { prisma } from "@/server/db/prisma";
import { writeAuditLog } from "@/server/security/audit";
import type { ChangePasswordInput } from "@/features/settings/schemas/settings";

export async function changePasswordForUser(
  userId: string,
  input: ChangePasswordInput,
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { passwordHash: true },
  });

  if (!user?.passwordHash) {
    throw new Error("Password login is not configured for this account.");
  }

  const valid = await bcrypt.compare(input.currentPassword, user.passwordHash);
  if (!valid) {
    throw new Error("Current password is incorrect.");
  }

  const passwordHash = await bcrypt.hash(input.newPassword, 12);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });

  await writeAuditLog({
    userId,
    action: "password.changed",
  });
}

export async function logoutOtherSessionsForUser(userId: string) {
  const result = await prisma.session.deleteMany({
    where: { userId },
  });

  await writeAuditLog({
    userId,
    action: "sessions.revoked",
    metadata: { count: result.count },
  });

  return result.count;
}
