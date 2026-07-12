import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { checkRateLimit } from "@/server/security/rate-limit";
import { changePasswordSchema } from "@/features/settings/schemas/settings";
import {
  changePasswordForUser,
  logoutOtherSessionsForUser,
} from "@/features/settings/services/security";
import { getSettingsSnapshot } from "@/features/settings/services/get-settings";

export const runtime = "nodejs";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings = await getSettingsSnapshot(session.user.id);
  if (!settings) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  return NextResponse.json({ sessions: settings.sessions });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const actionBody = body as { action?: string };

  if (actionBody.action === "logout-others") {
    const rate = checkRateLimit({
      key: `settings:sessions:${session.user.id}`,
      limit: 5,
      windowMs: 60_000,
    });
    if (!rate.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again shortly." },
        { status: 429 },
      );
    }

    const count = await logoutOtherSessionsForUser(session.user.id);
    const settings = await getSettingsSnapshot(session.user.id);
    return NextResponse.json({
      settings,
      message: `Signed out ${count} other session${count === 1 ? "" : "s"}.`,
    });
  }

  const rate = checkRateLimit({
    key: `settings:password:${session.user.id}`,
    limit: 5,
    windowMs: 60_000,
  });
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Too many password attempts. Please try again shortly." },
      { status: 429 },
    );
  }

  const parsed = changePasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid password payload." },
      { status: 400 },
    );
  }

  try {
    await changePasswordForUser(session.user.id, parsed.data);
    return NextResponse.json({ message: "Password updated successfully." });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to update password.",
      },
      { status: 400 },
    );
  }
}
