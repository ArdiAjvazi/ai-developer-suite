import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is required to seed the database.");
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
    },
    create: {
      email,
      name: "Demo User",
      passwordHash,
      role: "ADMIN",
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
