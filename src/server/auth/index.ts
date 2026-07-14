import { PrismaAdapter } from "@auth/prisma-adapter";
import { compare as bcryptCompare } from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import { runtimeEnv } from "@/config/runtime-env";
import { prisma } from "@/server/db";
import { getAuthConfig } from "@/server/auth/config";
import { prepareAuthEnv, resolveAuthSecret } from "@/server/auth/env";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

/**
 * Full Auth.js instance (Node runtime).
 *
 * - trustHost: true — required on Vercel behind proxies
 * - secret from NEXTAUTH_SECRET (fallback AUTH_SECRET)
 * - bcryptjs (pure JS) — avoids native `bcrypt` binary mismatches on serverless
 * - JWT sessions; PrismaAdapter only when GitHub OAuth is configured
 */
export const { handlers, auth, signIn, signOut } = NextAuth(() => {
  prepareAuthEnv();
  const base = getAuthConfig();
  const secret = resolveAuthSecret();

  if (!secret) {
    console.error(
      "[auth] Missing NEXTAUTH_SECRET / AUTH_SECRET in runtime env. Check Vercel → Settings → Environment Variables (Production, Build + Runtime).",
    );
  }

  const githubEnabled = Boolean(
    runtimeEnv("AUTH_GITHUB_ID") && runtimeEnv("AUTH_GITHUB_SECRET"),
  );

  return {
    ...base,
    secret: secret ?? process.env.NEXTAUTH_SECRET,
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
              console.warn("[auth] credentials: user not found or no password");
              return null;
            }

            // bcryptjs — pure JavaScript, safe on Vercel serverless (no native addon).
            const valid = await bcryptCompare(password, user.passwordHash);
            if (!valid) {
              console.warn("[auth] credentials: invalid password");
              return null;
            }

            // Plain serializable user object only (no Date / Prisma class instances).
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
