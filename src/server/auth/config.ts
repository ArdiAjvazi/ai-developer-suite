import type { NextAuthConfig } from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import type { Provider } from "next-auth/providers";
import { getEnv } from "@/config/runtime-env";
import { prepareAuthEnv, resolveAuthSecret } from "@/server/auth/env";
import {
  resolveGitHubOAuth,
  resolveGoogleOAuth,
} from "@/server/auth/oauth";

const AUTH_PAGE_PREFIXES = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
] as const;

function buildProviders(): Provider[] {
  const providers: Provider[] = [];

  const github = resolveGitHubOAuth();
  if (github) {
    providers.push(
      GitHub({
        clientId: github.id,
        clientSecret: github.secret,
        allowDangerousEmailAccountLinking: true,
      }),
    );
  }

  const google = resolveGoogleOAuth();
  if (google) {
    providers.push(
      Google({
        clientId: google.id,
        clientSecret: google.secret,
        allowDangerousEmailAccountLinking: true,
      }),
    );
  }

  return providers;
}

function isAuthPage(pathname: string): boolean {
  return AUTH_PAGE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/**
 * Edge-safe Auth.js config (no Prisma).
 * Used by `src/proxy.ts` and merged into the Node auth instance.
 */
export function getAuthConfig(): NextAuthConfig {
  prepareAuthEnv();

  const secret = resolveAuthSecret();

  return {
    ...(secret ? { secret } : {}),
    trustHost: true,
    debug: getEnv("AUTH_DEBUG") === "true",
    pages: {
      signIn: "/login",
      error: "/login",
      verifyRequest: "/verify-email",
      newUser: "/dashboard",
    },
    providers: buildProviders(),
    callbacks: {
      authorized({ auth, request }) {
        const { pathname } = request.nextUrl;
        const isLoggedIn = Boolean(auth?.user);

        const isApiAuth = pathname.startsWith("/api/auth");
        const isHealthRoute = pathname.startsWith("/api/health");
        const isPublicRoute =
          pathname === "/" ||
          isAuthPage(pathname) ||
          isApiAuth ||
          isHealthRoute;

        if (isLoggedIn && isAuthPage(pathname)) {
          return Response.redirect(new URL("/dashboard", request.nextUrl));
        }

        if (isPublicRoute) {
          return true;
        }

        // Protect dashboard + all authenticated app routes.
        if (!isLoggedIn) {
          const login = new URL("/login", request.nextUrl);
          login.searchParams.set("callbackUrl", pathname);
          return Response.redirect(login);
        }

        return true;
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
