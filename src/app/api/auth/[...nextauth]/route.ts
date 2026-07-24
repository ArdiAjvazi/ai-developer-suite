import { handlers } from "@/server/auth";

/**
 * Auth.js App Router handlers — Node.js runtime only.
 * No custom env preflight: Auth.js reads AUTH_SECRET / NEXTAUTH_SECRET itself.
 */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const { GET, POST } = handlers;
