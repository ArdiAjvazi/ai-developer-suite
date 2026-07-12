import { prisma } from "@/server/db/prisma";

export async function writeAuditLog(input: {
  userId: string;
  action: string;
  metadata?: Record<string, string | number | boolean | null | string[]>;
}) {
  await prisma.auditLog.create({
    data: {
      userId: input.userId,
      action: input.action,
      metadata: input.metadata ?? undefined,
    },
  });
}
