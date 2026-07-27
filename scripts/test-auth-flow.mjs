import { config as loadEnv } from "dotenv";
import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

loadEnv({ override: true });

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  const email = `flowtest+${Date.now()}@example.com`;
  const passwordHash = await bcrypt.hash("TestPass123!", 12);

  const user = await prisma.user.create({
    data: { email, name: "Flow Test", passwordHash },
  });

  const raw = randomBytes(32).toString("hex");
  const token = createHash("sha256").update(raw).digest("hex");
  await prisma.verificationToken.create({
    data: {
      identifier: email,
      token,
      expires: new Date(Date.now() + 3600_000),
    },
  });

  const vt = await prisma.verificationToken.findUnique({ where: { token } });
  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerified: new Date() },
  });
  await prisma.verificationToken.delete({
    where: { identifier_token: { identifier: email, token } },
  });

  const rawReset = randomBytes(32).toString("hex");
  const resetHash = createHash("sha256").update(rawReset).digest("hex");
  await prisma.passwordResetToken.create({
    data: {
      email,
      token: resetHash,
      expiresAt: new Date(Date.now() + 3600_000),
      userId: user.id,
    },
  });

  const fresh = await prisma.user.findUnique({ where: { id: user.id } });
  const passwordOk = fresh?.passwordHash
    ? await bcrypt.compare("TestPass123!", fresh.passwordHash)
    : false;

  await prisma.passwordResetToken.deleteMany({ where: { email } });
  await prisma.user.delete({ where: { id: user.id } });

  console.log(
    JSON.stringify({
      created: Boolean(user.id),
      verifiedTokenFound: Boolean(vt),
      passwordOk,
      cleaned: true,
    }),
  );

  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error(error);
  process.exit(1);
});
