import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import { prisma } from "@/server/db";
import { getAuthConfig } from "@/server/auth/config";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

/**
 * Full Auth.js instance (Node runtime).
 * Lazy config ensures AUTH_SECRET / AUTH_URL are read on each request on Vercel
 * instead of being frozen at module import / build time.
 *
 * JWT sessions avoid PrismaAdapter session-table writes for credentials login.
 * Adapter remains for OAuth account linking when GitHub is configured.
 *
 * GitHub callback URL (OAuth App → Authorization callback URL):
 *   https://<your-vercel-host>/api/auth/callback/github
 * e.g. https://ai-developer-suite.vercel.app/api/auth/callback/github
 */
export const { handlers, auth, signIn, signOut } = NextAuth(() => {
  const base = getAuthConfig();

  const secret = base.secret;
  if (!secret) {
    console.error(
      "[auth] Missing AUTH_SECRET (or NEXTAUTH_SECRET). Auth.js cannot start.",
    );
  } else {
    console.info("[auth] Auth.js config loaded (secret present, trustHost=true)");
  }

  return {
    ...base,
    secret,
    trustHost: true,
    adapter: PrismaAdapter(prisma),
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
