import NextAuth from "next-auth";
import { getAuthConfig } from "@/server/auth/config";

/**
 * Next.js 16 Proxy (formerly middleware).
 * Uses the Edge-safe auth config factory — never import Prisma here.
 * Lazy init so AUTH_SECRET is read from the Edge runtime env on each invoke.
 */
const { auth } = NextAuth(() => getAuthConfig());

export default auth;

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
