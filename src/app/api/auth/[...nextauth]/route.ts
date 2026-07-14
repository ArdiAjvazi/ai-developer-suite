import { handlers } from "@/server/auth";

// Prevent Next.js from statically analyzing this route at build time
// (Prisma/Auth adapter would otherwise initialize without a live DATABASE_URL).
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const { GET, POST } = handlers;
