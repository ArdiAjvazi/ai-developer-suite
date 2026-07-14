import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import { prisma } from "@/server/db";
import { getAuthConfig } from "@/server/auth/config";
import { prepareAuthEnv } from "@/server/auth/env";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

/**
 * Full Auth.js instance (Node runtime).
 * Lazy config ensures AUTH_SECRET / AUTH_URL are read on each request on Vercel.
 *
 * JWT sessions — credentials login never writes Session rows.
 * PrismaAdapter is only attached when GitHub OAuth is configured (account linking).
 */
export const { handlers, auth, signIn, signOut } = NextAuth(() => {
  prepareAuthEnv();
  const base = getAuthConfig();

  const secret = base.secret;
  if (!secret) {
    console.error(
      "[auth] Missing AUTH_SECRET (or NEXTAUTH_SECRET). Auth.js cannot start.",
    );
  }

  const githubEnabled = Boolean(
    process.env.AUTH_GITHUB_ID?.trim() &&
      process.env.AUTH_GITHUB_SECRET?.trim(),
  );

  return {
    ...base,
    secret,
    trustHost: true,
    // Avoid PrismaAdapter for credentials-only — JWT sessions need no DB session table.
    ...(githubEnabled ? { adapter: PrismaAdapter(prisma) } : {}),
    session: {
      strategy: "jwt",
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
            });

            if (!user?.passwordHash) {
              console.warn("[auth] credentials: user not found or no password");
              return null;
            }

            const valid = await bcrypt.compare(password, user.passwordHash);
            if (!valid) {
              console.warn("[auth] credentials: invalid password");
              return null;
            }

            return {
              id: user.id,
              email: user.email,
              name: user.name,
              image: user.image,
              role: user.role,
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
