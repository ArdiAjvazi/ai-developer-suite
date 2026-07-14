import { NextRequest } from "next/server";
import { config as loadEnv } from "dotenv";

loadEnv({ override: true });

async function main() {
  if (!process.env.AUTH_SECRET && !process.env.NEXTAUTH_SECRET) {
    process.env.AUTH_SECRET = "local-diagnosis-secret-min-32-characters";
  }

  // Simulate what a bad Vercel copy-paste looks like, then ensure prepareAuthEnv fixes it.
  // Keep localhost for local test.
  process.env.AUTH_URL = "http://localhost:3000";
  process.env.NEXTAUTH_URL = "http://localhost:3000";

  const { handlers } = await import("../src/server/auth/index");

  const providersReq = new NextRequest(
    "http://localhost:3000/api/auth/providers",
  );
  const providersRes = await handlers.GET(providersReq);
  console.log("[diag] providers status", providersRes.status);
  console.log("[diag] providers body", await providersRes.text());

  const csrfReq = new NextRequest("http://localhost:3000/api/auth/csrf");
  const csrfRes = await handlers.GET(csrfReq);
  const csrfJson = (await csrfRes.json()) as { csrfToken?: string };
  console.log("[diag] csrf status", csrfRes.status, Boolean(csrfJson.csrfToken));

  if (!csrfJson.csrfToken) {
    throw new Error("No csrf token");
  }

  const cookieHeader = (csrfRes.headers.getSetCookie?.() ?? [])
    .map((c) => c.split(";")[0])
    .join("; ");

  const body = new URLSearchParams({
    csrfToken: csrfJson.csrfToken,
    email: "demo@codepilot.ai",
    password: "password123",
    callbackUrl: "http://localhost:3000/dashboard",
  });

  const loginReq = new NextRequest(
    "http://localhost:3000/api/auth/callback/credentials",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "X-Auth-Return-Redirect": "1",
        cookie: cookieHeader,
      },
      body,
    },
  );

  const loginRes = await handlers.POST(loginReq);
  console.log("[diag] credentials status", loginRes.status);
  console.log("[diag] credentials body", await loginRes.text());
  console.log(
    "[diag] set-cookie count",
    loginRes.headers.getSetCookie?.().length ?? 0,
  );
}

main().catch((error) => {
  console.error("[diag] FAILED");
  console.error(error);
  process.exit(1);
});
