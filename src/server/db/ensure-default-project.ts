import { prisma } from "@/server/db";

/**
 * Ensure the authenticated user exists in the DB, then return (or create)
 * their default workspace project.
 *
 * Stale JWTs (e.g. after reseeding Neon) otherwise trip Project_userId_fkey.
 */
export async function ensureDefaultProject(userId: string) {
  if (!userId) {
    throw new Error("Unauthorized: missing user id in session.");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });

  if (!user) {
    throw new Error(
      "Your session no longer matches a user in the database. Sign out and sign in again.",
    );
  }

  const existing = await prisma.project.findFirst({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });

  if (existing) {
    return existing;
  }

  return prisma.project.create({
    data: {
      userId,
      name: "Default Project",
      description: "Auto-created workspace project",
    },
  });
}
