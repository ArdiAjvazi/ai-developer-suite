import type { NextAuthConfig } from "next-auth";
import GitHub from "next-auth/providers/github";
import type { Provider } from "next-auth/providers";

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
 * Must be a factory so AUTH_SECRET is read per-request on Vercel — a static
 * NextAuth({...}) call can bake an empty secret during build/import.
 */
export function getAuthConfig(): NextAuthConfig {
  return {
    secret: resolveAuthSecret(),
    trustHost: true,
    // Enabled so Vercel function logs show Auth.js configuration errors.
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
        const isPublicRoute = pathname === "/" || isAuthRoute;

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
          token.id = user.id;
          token.role = user.role;
        }
        return token;
      },
      session({ session, token }) {
        if (session.user) {
          session.user.id = token.id as string;
          session.user.role = (token.role as "USER" | "ADMIN") ?? "USER";
        }
        return session;
      },
    },
    session: {
      strategy: "jwt",
    },
  };
}
