import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { generateDocsSchema } from "@/features/documentation/schemas/generate-docs";
import { generateDocsForUser } from "@/features/documentation/services/generate-docs";

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

  const parsed = generateDocsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const result = await generateDocsForUser(session.user.id, parsed.data);
    return NextResponse.json({
      jobId: result.jobId,
      status: result.status,
      markdown: result.markdown,
      model: result.model,
      mock: result.mock,
      result: result.result,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Documentation generation failed.";
    return NextResponse.json({ error: message, status: "FAILED" }, { status: 502 });
  }
}
