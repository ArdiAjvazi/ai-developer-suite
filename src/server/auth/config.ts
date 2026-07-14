import type { NextAuthConfig } from "next-auth";
import GitHub from "next-auth/providers/github";
import type { Provider } from "next-auth/providers";
import { prepareAuthEnv } from "@/server/auth/env";

function resolveAuthSecret(): string | undefined {
  const secret =
    process.env.AUTH_SECRET?.trim() || process.env.NEXTAUTH_SECRET?.trim();
  return secret || undefined;
}

function buildProviders(): Provider[] {
  const providers: Provider[] = [];

  const githubId = process.env.AUTH_GITHUB_ID?.trim();
  const githubSecret = process.env.AUTH_GITHUB_SECRET?.trim();

  if (githubId && githubSecret) {
    providers.push(
      GitHub({
        clientId: githubId,
        clientSecret: githubSecret,
        allowDangerousEmailAccountLinking: true,
      }),
    );
  }

  return providers;
}

/**
 * Edge-safe Auth.js config factory (no Prisma / Node-only imports).
 * Must be a factory so AUTH_SECRET is read per-request on Vercel.
 */
export function getAuthConfig(): NextAuthConfig {
  prepareAuthEnv();

  return {
    secret: resolveAuthSecret(),
    trustHost: true,
    // Set AUTH_DEBUG=false once login is stable.
    debug: process.env.AUTH_DEBUG !== "false",
    pages: {
      signIn: "/login",
      error: "/login",
    },
    providers: buildProviders(),
    callbacks: {
      authorized({ auth, request }) {
        const { pathname } = request.nextUrl;
        const isLoggedIn = !!auth?.user;

        const isAuthRoute =
          pathname.startsWith("/login") || pathname.startsWith("/api/auth");
        const isHealthRoute = pathname.startsWith("/api/health");
        const isPublicRoute =
          pathname === "/" || isAuthRoute || isHealthRoute;

        if (isPublicRoute) {
          if (isLoggedIn && pathname.startsWith("/login")) {
            return Response.redirect(new URL("/dashboard", request.nextUrl));
          }
          return true;
        }

        return isLoggedIn;
      },
      jwt({ token, user }) {
        if (user) {
          token.id = user.id ?? token.sub;
          token.role = user.role ?? "USER";
        }
        if (!token.id && token.sub) {
          token.id = token.sub;
        }
        if (!token.role) {
          token.role = "USER";
        }
        return token;
      },
      session({ session, token }) {
        if (session.user) {
          session.user.id = (token.id as string) || (token.sub as string) || "";
          session.user.role = (token.role as "USER" | "ADMIN") ?? "USER";
        }
        return session;
      },
    },
    session: {
      strategy: "jwt",
      maxAge: 30 * 24 * 60 * 60,
    },
  };
}
