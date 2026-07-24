import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { generateReviewSchema } from "@/features/reviews/schemas/generate-review";
import { generateCodeReviewForUser } from "@/features/reviews/services/generate-review";

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

  const parsed = generateReviewSchema.safeParse(body);
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
    const result = await generateCodeReviewForUser(
      session.user.id,
      parsed.data,
    );

    return NextResponse.json({
      jobId: result.jobId,
      status: result.status,
      model: result.model,
      mock: result.mock,
      review: result.review,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Code review failed.";
    const staleSession = message.toLowerCase().includes("sign out");

    return NextResponse.json(
      {
        error: message,
        status: "FAILED",
      },
      { status: staleSession ? 401 : 502 },
    );
  }
}
