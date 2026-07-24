/**
 * Prisma 7 config — plain CommonJS for Vercel/CI.
 *
 * Never use `env("DATABASE_URL")` from `prisma/config`: it throws
 * PrismaConfigEnvError during install/generate when the var is unset.
 * Load `.env` so local CLI commands (db push / migrate) see DATABASE_URL.
 * Generate always succeeds with the build placeholder when DATABASE_URL is missing.
 */
require("dotenv").config({ override: true });

const BUILD_PLACEHOLDER_DATABASE_URL =
  "postgresql://build:build@127.0.0.1:5432/build?schema=public";

module.exports = {
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env.DATABASE_URL || BUILD_PLACEHOLDER_DATABASE_URL,
  },
};
