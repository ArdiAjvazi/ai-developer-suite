import { config as loadEnv } from "dotenv";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

loadEnv({ override: true });

function describeUrl(connectionString: string) {
  try {
    const url = new URL(connectionString);
    return {
      host: url.hostname,
      database: url.pathname.replace(/^\//, "") || "(none)",
      user: url.username,
      sslmode: url.searchParams.get("sslmode"),
      channel_binding: url.searchParams.get("channel_binding"),
      isNeon: /neon\.tech$/i.test(url.hostname),
    };
  } catch {
    return { parseError: true as const };
  }
}

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set in .env");
  }

  const target = describeUrl(connectionString);
  console.log("[verify] DATABASE_URL target:", JSON.stringify(target, null, 2));

  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });

  const email = "demo@codepilot.ai";
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      passwordHash: true,
      createdAt: true,
    },
  });

  if (!user) {
    console.error(`[verify] FAIL: user ${email} was NOT found.`);
    await prisma.$disconnect();
    process.exit(1);
  }

  const passwordOk = user.passwordHash
    ? await bcrypt.compare("password123", user.passwordHash)
    : false;

  console.log(
    "[verify] OK:",
    JSON.stringify(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        hasPasswordHash: Boolean(user.passwordHash),
        password123Matches: passwordOk,
        createdAt: user.createdAt,
      },
      null,
      2,
    ),
  );

  if (!passwordOk) {
    console.error("[verify] FAIL: password123 does not match stored hash.");
    await prisma.$disconnect();
    process.exit(1);
  }

  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error("[verify] connection/query error:");
  console.error(error);
  process.exit(1);
});
