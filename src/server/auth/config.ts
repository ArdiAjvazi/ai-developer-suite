import type { NextAuthConfig } from "next-auth";
import GitHub from "next-auth/providers/github";
import type { Provider } from "next-auth/providers";

function buildProviders(): Provider[] {
  const providers: Provider[] = [];

  if (process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET) {
    providers.push(
      GitHub({
        clientId: process.env.AUTH_GITHUB_ID,
        clientSecret: process.env.AUTH_GITHUB_SECRET,
        allowDangerousEmailAccountLinking: true,
      }),
    );
  }

  return providers;
}

/**
 * Edge-safe Auth.js config (no Prisma / Node-only imports).
 * Used by `src/proxy.ts` and merged into the full auth instance.
 */
export const authConfig = {
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  trustHost: true,
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: buildProviders(),
  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Secure-authjs.session-token"
          : "authjs.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax" as const,
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
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
} satisfies NextAuthConfig;
