import type { NextAuthConfig } from "next-auth";
import GitHub from "next-auth/providers/github";
import type { Provider } from "next-auth/providers";
import { runtimeEnv } from "@/config/runtime-env";
import { prepareAuthEnv, resolveAuthSecret } from "@/server/auth/env";

function buildProviders(): Provider[] {
  const providers: Provider[] = [];

  const githubId = runtimeEnv("AUTH_GITHUB_ID");
  const githubSecret = runtimeEnv("AUTH_GITHUB_SECRET");

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
 */
export function getAuthConfig(): NextAuthConfig {
  prepareAuthEnv();

  return {
    // Explicit secret — required on Vercel; prefer NEXTAUTH_SECRET.
    secret: resolveAuthSecret(),
    trustHost: true,
    debug: runtimeEnv("AUTH_DEBUG") !== "false",
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
        // Keep JWT payload JSON-serializable primitives only.
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
        // Return a fresh plain object — never mutate with non-serializable values.
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
