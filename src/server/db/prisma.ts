import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { resolveDatabaseUrl } from "@/config/env";

const PRISMA_CLIENT_GENERATION = 6;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaGeneration?: number;
};

function createPrismaClient() {
  const connectionString = resolveDatabaseUrl();
  const adapter = new PrismaPg({ connectionString });

  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

function isUsableClient(
  client: PrismaClient | undefined,
): client is PrismaClient {
  if (!client) return false;

  const delegates = client as unknown as {
    user?: { findMany?: unknown };
    job?: { findMany?: unknown };
    repository?: { findMany?: unknown };
    project?: { findMany?: unknown };
    userSettings?: { findMany?: unknown };
    auditLog?: { findMany?: unknown };
  };

  return (
    typeof delegates.user?.findMany === "function" &&
    typeof delegates.job?.findMany === "function" &&
    typeof delegates.repository?.findMany === "function" &&
    typeof delegates.project?.findMany === "function" &&
    typeof delegates.userSettings?.findMany === "function" &&
    typeof delegates.auditLog?.findMany === "function"
  );
}

function getPrismaClient() {
  const existing = globalForPrisma.prisma;
  const generationMatches =
    globalForPrisma.prismaGeneration === PRISMA_CLIENT_GENERATION;

  if (existing && (!generationMatches || !isUsableClient(existing))) {
    void existing.$disconnect().catch(() => undefined);
    globalForPrisma.prisma = undefined;
  }

  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
    globalForPrisma.prismaGeneration = PRISMA_CLIENT_GENERATION;
  }

  if (!isUsableClient(globalForPrisma.prisma)) {
    throw new Error(
      "Prisma Client is missing required model delegates. Run `npx prisma generate` and restart the dev server.",
    );
  }

  return globalForPrisma.prisma;
}

/**
 * Lazy Prisma proxy — module import never connects / never requires DATABASE_URL.
 * URL is read on first query via getEnv (dynamic, runtime-safe).
 */
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const client = getPrismaClient();
    const value = Reflect.get(client, prop, receiver);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
