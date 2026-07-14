/**
 * Prisma 7 config — plain CommonJS for Vercel/CI.
 *
 * Never use `env("DATABASE_URL")` from `prisma/config`: it throws
 * PrismaConfigEnvError during install/generate when the var is unset.
 * Load `.env` so local CLI commands (db push / migrate) see DATABASE_URL.
 */
require("dotenv").config({ override: true });

module.exports = {
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url:
      process.env.DATABASE_URL ||
      "postgresql://build:build@127.0.0.1:5432/build?schema=public",
  },
};
