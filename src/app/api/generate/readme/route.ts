import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { generateReadmeSchema } from "@/features/readme/schemas/generate-readme";
import { generateReadmeForUser } from "@/features/readme/services/generate-readme";

export const runtime = "nodejs";
export const maxDuration = 60;

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

  const parsed = generateReadmeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Validation failed",
        issues: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  try {
    const result = await generateReadmeForUser(session.user.id, parsed.data);

    return NextResponse.json({
      jobId: result.jobId,
      status: result.status,
      markdown: result.markdown,
      model: result.model,
      mock: Boolean(result.mock),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "README generation failed.";

    return NextResponse.json(
      {
        error: message,
        status: "FAILED",
      },
      { status: 502 },
    );
  }
}
