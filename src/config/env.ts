import { z } from "zod";
import { isNextBuildPhase, runtimeEnv } from "@/config/runtime-env";

const BUILD_PLACEHOLDER_DATABASE_URL =
  "postgresql://build:build@127.0.0.1:5432/build?schema=public";

/** Neon + node-pg: channel_binding=require often breaks serverless clients. */
export function sanitizeDatabaseUrl(connectionString: string): string {
  try {
    const url = new URL(connectionString);
    if (url.searchParams.get("channel_binding") === "require") {
      url.searchParams.delete("channel_binding");
    }
    return url.toString();
  } catch {
    return connectionString.replace(/([&?])channel_binding=require&?/g, "$1");
  }
}

export { isNextBuildPhase } from "@/config/runtime-env";

/**
 * Resolve DATABASE_URL for Prisma / server bootstrapping.
 * Build phase uses a non-connecting placeholder when unset so `next build`
 * and `prisma generate` succeed without a live database.
 */
export function resolveDatabaseUrl(): string {
  const configured = runtimeEnv("DATABASE_URL");
  if (configured) return sanitizeDatabaseUrl(configured);

  if (isNextBuildPhase()) {
    return BUILD_PLACEHOLDER_DATABASE_URL;
  }

  throw new Error(
    "DATABASE_URL is not set. In Vercel: Settings → Environment Variables → add DATABASE_URL for Production (Build + Runtime), then Redeploy.",
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
          runtimeEnv("AUTH_SECRET") ??
          runtimeEnv("NEXTAUTH_SECRET") ??
          "fallback-secret-for-build",
        NEXTAUTH_SECRET: runtimeEnv("NEXTAUTH_SECRET"),
        AUTH_URL: runtimeEnv("AUTH_URL"),
        NEXTAUTH_URL: runtimeEnv("NEXTAUTH_URL"),
        AUTH_GITHUB_ID: runtimeEnv("AUTH_GITHUB_ID"),
        AUTH_GITHUB_SECRET: runtimeEnv("AUTH_GITHUB_SECRET"),
        OPENAI_API_KEY: runtimeEnv("OPENAI_API_KEY"),
        OPENAI_BASE_URL: runtimeEnv("OPENAI_BASE_URL"),
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
      (allowSoftValidation ? "fallback-secret-for-build" : data.AUTH_SECRET),
  };
}
