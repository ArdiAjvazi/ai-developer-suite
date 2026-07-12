import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { checkRateLimit } from "@/server/security/rate-limit";
import { preferencesSchema } from "@/features/settings/schemas/settings";
import { updatePreferencesForUser } from "@/features/settings/services/update-preferences";
import { getSettingsSnapshot } from "@/features/settings/services/get-settings";

export const runtime = "nodejs";

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rate = checkRateLimit({
    key: `settings:preferences:${session.user.id}`,
    limit: 40,
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

  const parsed = preferencesSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid preferences." },
      { status: 400 },
    );
  }

  try {
    await updatePreferencesForUser(session.user.id, parsed.data);
    const settings = await getSettingsSnapshot(session.user.id);
    return NextResponse.json({ settings, message: "Preferences saved." });
  } catch {
    return NextResponse.json(
      { error: "Unable to save preferences." },
      { status: 400 },
    );
  }
}
