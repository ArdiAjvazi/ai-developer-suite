import { PrismaAdapter } from "@auth/prisma-adapter";
import { compare as bcryptCompare } from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import { getEnv } from "@/config/runtime-env";
import { prisma } from "@/server/db";
import { getAuthConfig } from "@/server/auth/config";
import { prepareAuthEnv, resolveAuthSecret } from "@/server/auth/env";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

/**
 * Auth.js v5 (NextAuth) — Node runtime, lazy config.
 *
 * Env is read inside the factory on each auth request so Turbopack cannot
 * bake empty AUTH_SECRET / DATABASE_URL values from build time.
 * JWT sessions; PrismaAdapter only when GitHub OAuth is configured.
 */
export const { handlers, auth, signIn, signOut } = NextAuth(() => {
  prepareAuthEnv();
  const base = getAuthConfig();
  const secret = resolveAuthSecret();

  const githubEnabled = Boolean(
    getEnv("AUTH_GITHUB_ID") && getEnv("AUTH_GITHUB_SECRET"),
  );

  return {
    ...base,
    ...(secret ? { secret } : {}),
    trustHost: true,
    ...(githubEnabled ? { adapter: PrismaAdapter(prisma) } : {}),
    session: {
      strategy: "jwt" as const,
      maxAge: 30 * 24 * 60 * 60,
    },
    providers: [
      ...base.providers,
      Credentials({
        id: "credentials",
        name: "Email and Password",
        credentials: {
          email: { label: "Email", type: "email" },
          password: { label: "Password", type: "password" },
        },
        async authorize(rawCredentials) {
          try {
            const parsed = credentialsSchema.safeParse(rawCredentials);
            if (!parsed.success) {
              return null;
            }

            const email = parsed.data.email.toLowerCase().trim();
            const { password } = parsed.data;

            const user = await prisma.user.findUnique({
              where: { email },
              select: {
                id: true,
                email: true,
                name: true,
                image: true,
                role: true,
                passwordHash: true,
              },
            });

            if (!user?.passwordHash) {
              return null;
            }

            const valid = await bcryptCompare(password, user.passwordHash);
            if (!valid) {
              return null;
            }

            return {
              id: String(user.id),
              email: user.email,
              name: user.name ?? undefined,
              image: user.image ?? undefined,
              role: user.role === "ADMIN" ? "ADMIN" : "USER",
            };
          } catch (error) {
            console.error("[auth] credentials authorize failed", error);
            return null;
          }
        },
      }),
    ],
  };
});
