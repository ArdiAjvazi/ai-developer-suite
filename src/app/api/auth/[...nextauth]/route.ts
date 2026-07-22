import type { NextRequest } from "next/server";
import { handlers } from "@/server/auth";
import { resolveAuthSecret } from "@/server/auth/env";
import { runtimeEnv } from "@/config/runtime-env";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function missingEnvResponse() {
  // Hydrate from build snapshot before checking.
  const secret = resolveAuthSecret();
  const databaseUrl = runtimeEnv("DATABASE_URL");

  const missing = [
    !secret ? "NEXTAUTH_SECRET|AUTH_SECRET" : null,
    !databaseUrl ? "DATABASE_URL" : null,
  ].filter(Boolean);

  if (missing.length === 0) return null;

  console.error("[auth-route] Missing runtime env:", missing.join(", "));

  return Response.json(
    {
      message:
        "There was a problem with the server configuration. Check the server logs for more information.",
      missing,
      hint: "Vercel → Project Settings → Environment Variables: set these for Production with Build + Runtime enabled, then Redeploy. Build logs should show [snapshot-runtime-env].",
    },
    { status: 500 },
  );
}

async function withEnvGuard(
  request: NextRequest,
  handler: (req: NextRequest) => Promise<Response>,
) {
  const blocked = missingEnvResponse();
  if (blocked) {
    console.error("[auth-route] Missing runtime env");
    return blocked;
  }

  try {
    return await handler(request);
  } catch (error) {
    console.error("[auth-route] Unhandled auth error", error);
    return Response.json(
      {
        message:
          "Authentication handler crashed. Check Vercel function logs for details.",
      },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  return withEnvGuard(request, (req) => handlers.GET(req));
}

export async function POST(request: NextRequest) {
  return withEnvGuard(request, (req) => handlers.POST(req));
}
