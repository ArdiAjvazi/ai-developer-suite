import NextAuth from "next-auth";
import { authConfig } from "@/server/auth/config";

/**
 * Next.js 16 Proxy (formerly middleware).
 * Uses the Edge-safe auth config — never import Prisma here.
 */
const { auth } = NextAuth(authConfig);

export default auth;

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
