import NextAuth from "next-auth";
import { getAuthConfig } from "@/server/auth/config";
import { prepareAuthEnv } from "@/server/auth/env";

/**
 * Next.js 16 Proxy (formerly middleware).
 * Edge-safe auth config only — never import Prisma here.
 */
const { auth } = NextAuth(() => {
  prepareAuthEnv();
  return getAuthConfig();
});

export default auth;

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
