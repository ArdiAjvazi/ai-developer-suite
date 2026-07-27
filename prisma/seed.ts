import { config as loadEnv } from "dotenv";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Prefer .env over any stale shell DATABASE_URL (common when switching to Neon).
loadEnv({ override: true });

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is required to seed the database.");
  }

  if (!/neon\.tech/i.test(connectionString) && process.env.ALLOW_NON_NEON_SEED !== "1") {
    console.warn(
      "[seed] DATABASE_URL does not look like Neon. Continuing anyway (set ALLOW_NON_NEON_SEED=1 to silence).",
    );
  }

  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });

  const email = "demo@codepilot.ai";
  const passwordHash = await bcrypt.hash("password123", 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      name: "Demo User",
      passwordHash,
      role: "ADMIN",
      emailVerified: new Date(),
    },
    create: {
      email,
      name: "Demo User",
      passwordHash,
      role: "ADMIN",
      emailVerified: new Date(),
    },
  });

  await prisma.project.upsert({
    where: { id: "seed-demo-project" },
    update: {
      name: "Welcome Project",
      description: "Starter project for CodePilot AI demos",
    },
    create: {
      id: "seed-demo-project",
      userId: user.id,
      name: "Welcome Project",
      description: "Starter project for CodePilot AI demos",
    },
  });

  console.log(`Seeded demo user: ${email} / password123`);
  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error(error);
  process.exit(1);
});
