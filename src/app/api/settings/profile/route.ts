import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { checkRateLimit } from "@/server/security/rate-limit";
import { getSettingsSnapshot } from "@/features/settings/services/get-settings";
import { updateProfileForUser } from "@/features/settings/services/update-profile";
import { profileSchema } from "@/features/settings/schemas/settings";

export const runtime = "nodejs";

function friendlyError(error: unknown, fallback: string) {
  if (error instanceof Error && !error.message.includes("SETTINGS_ENCRYPTION")) {
    return error.message;
  }
  return fallback;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings = await getSettingsSnapshot(session.user.id);
  if (!settings) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  return NextResponse.json({ settings });
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rate = checkRateLimit({
    key: `settings:profile:${session.user.id}`,
    limit: 20,
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

  const parsed = profileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid profile data." },
      { status: 400 },
    );
  }

  try {
    await updateProfileForUser(session.user.id, parsed.data);
    const settings = await getSettingsSnapshot(session.user.id);
    return NextResponse.json({ settings, message: "Profile updated." });
  } catch (error) {
    return NextResponse.json(
      { error: friendlyError(error, "Unable to update profile.") },
      { status: 400 },
    );
  }
}
