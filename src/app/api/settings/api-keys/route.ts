import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { checkRateLimit } from "@/server/security/rate-limit";
import {
  apiKeysSchema,
  validateKeySchema,
} from "@/features/settings/schemas/settings";
import {
  updateApiKeysForUser,
  validateApiKeyForUser,
} from "@/features/settings/services/api-keys";
import { getSettingsSnapshot } from "@/features/settings/services/get-settings";

export const runtime = "nodejs";

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rate = checkRateLimit({
    key: `settings:api-keys:${session.user.id}`,
    limit: 10,
    windowMs: 60_000,
  });
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again shortly." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = apiKeysSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid API key payload." },
      { status: 400 },
    );
  }

  try {
    await updateApiKeysForUser(session.user.id, parsed.data);
    const settings = await getSettingsSnapshot(session.user.id);
    return NextResponse.json({ settings, message: "API keys updated." });
  } catch (error) {
    const message =
      error instanceof Error && error.message.includes("SETTINGS_ENCRYPTION")
        ? "Unable to store API keys securely. Contact support."
        : error instanceof Error
          ? error.message
          : "Unable to update API keys.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rate = checkRateLimit({
    key: `settings:validate-key:${session.user.id}`,
    limit: 8,
    windowMs: 60_000,
  });
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Too many validation attempts. Please try again shortly." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = validateKeySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid provider." }, { status: 400 });
  }

  try {
    const result = await validateApiKeyForUser(
      session.user.id,
      parsed.data.provider,
    );
    const settings = await getSettingsSnapshot(session.user.id);
    return NextResponse.json({
      settings,
      status: result.status,
      validatedAt: result.validatedAt,
      message:
        result.status === "connected"
          ? "Connection validated."
          : "Unable to validate API Key.",
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to validate API Key." },
      { status: 400 },
    );
  }
}
