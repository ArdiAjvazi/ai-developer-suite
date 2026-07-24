import type { NextAuthConfig } from "next-auth";
import GitHub from "next-auth/providers/github";
import type { Provider } from "next-auth/providers";
import { getEnv } from "@/config/runtime-env";
import { prepareAuthEnv, resolveAuthSecret } from "@/server/auth/env";

function buildProviders(): Provider[] {
  const providers: Provider[] = [];

  const githubId = getEnv("AUTH_GITHUB_ID");
  const githubSecret = getEnv("AUTH_GITHUB_SECRET");

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
 * Edge-safe Auth.js config (no Prisma).
 * Used by `src/proxy.ts` and merged into the Node auth instance.
 */
export function getAuthConfig(): NextAuthConfig {
  prepareAuthEnv();

  const secret = resolveAuthSecret();

  return {
    // Only set when present — never invent a fake build secret.
    ...(secret ? { secret } : {}),
    trustHost: true,
    debug: getEnv("AUTH_DEBUG") === "true",
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
          token.id = user.id ? String(user.id) : token.sub;
          token.role = user.role === "ADMIN" ? "ADMIN" : "USER";
        }
        if (!token.id && token.sub) {
          token.id = String(token.sub);
        }
        if (token.role !== "ADMIN" && token.role !== "USER") {
          token.role = "USER";
        }
        return token;
      },
      session({ session, token }) {
        const role = token.role === "ADMIN" ? "ADMIN" : "USER";
        return {
          expires: session.expires,
          user: {
            id: String(token.id ?? token.sub ?? ""),
            role,
            name: session.user?.name ?? null,
            email: session.user?.email ?? null,
            image: session.user?.image ?? null,
          },
        };
      },
    },
    session: {
      strategy: "jwt",
      maxAge: 30 * 24 * 60 * 60,
    },
  };
}
