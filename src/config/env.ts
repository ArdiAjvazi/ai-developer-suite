import { z } from "zod";

const BUILD_PLACEHOLDER_DATABASE_URL =
  "postgresql://build:build@127.0.0.1:5432/build?schema=public";

/** True while Next.js is compiling / collecting page data. */
export function isNextBuildPhase(): boolean {
  return (
    process.env.NEXT_PHASE === "phase-production-build" ||
    process.env.NEXT_PHASE === "phase-production-compile" ||
    process.env.npm_lifecycle_event === "build"
  );
}

/**
 * Resolve DATABASE_URL for Prisma / server bootstrapping.
 * During Next/Vercel production builds the var can be unavailable while
 * collecting page data — use a non-connecting placeholder so imports succeed.
 * Prefer a real DATABASE_URL whenever it is present.
 */
export function resolveDatabaseUrl(): string {
  const configured = process.env.DATABASE_URL?.trim();
  if (configured) return configured;

  if (isNextBuildPhase() || process.env.VERCEL === "1") {
    return BUILD_PLACEHOLDER_DATABASE_URL;
  }

  throw new Error(
    "DATABASE_URL is not set. Copy .env.example to .env and configure Neon/PostgreSQL.",
  );
}

const envSchema = z.object({
  DATABASE_URL: z.string().min(1).optional(),
  AUTH_SECRET: z.string().min(1).optional(),
  NEXTAUTH_SECRET: z.string().min(1).optional(),
  AUTH_URL: z.string().url().optional(),
  NEXTAUTH_URL: z.string().url().optional(),
  AUTH_GITHUB_ID: z.string().optional(),
  AUTH_GITHUB_SECRET: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_BASE_URL: z.string().url().optional(),
});

export type ServerEnv = z.infer<typeof envSchema> & {
  DATABASE_URL: string;
};

export function getServerEnv(): ServerEnv {
  const allowSoftValidation =
    isNextBuildPhase() || process.env.VERCEL === "1";

  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    if (allowSoftValidation) {
      return {
        DATABASE_URL: resolveDatabaseUrl(),
        AUTH_SECRET:
          process.env.AUTH_SECRET ??
          process.env.NEXTAUTH_SECRET ??
          "build-placeholder-secret",
        NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
        AUTH_URL: process.env.AUTH_URL,
        NEXTAUTH_URL: process.env.NEXTAUTH_URL,
        AUTH_GITHUB_ID: process.env.AUTH_GITHUB_ID,
        AUTH_GITHUB_SECRET: process.env.AUTH_GITHUB_SECRET,
        OPENAI_API_KEY: process.env.OPENAI_API_KEY,
        OPENAI_BASE_URL: process.env.OPENAI_BASE_URL,
      };
    }
    throw new Error(`Invalid environment: ${parsed.error.message}`);
  }

  const data = parsed.data;

  if (!allowSoftValidation && !data.AUTH_SECRET && !data.NEXTAUTH_SECRET) {
    throw new Error("Set AUTH_SECRET (or NEXTAUTH_SECRET) in your environment.");
  }

  return {
    ...data,
    DATABASE_URL: resolveDatabaseUrl(),
    AUTH_SECRET:
      data.AUTH_SECRET ??
      data.NEXTAUTH_SECRET ??
      (allowSoftValidation ? "build-placeholder-secret" : data.AUTH_SECRET),
  };
}
