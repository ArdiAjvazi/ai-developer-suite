import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { generateReportSchema } from "@/features/reports/schemas/generate-report";
import {
  deleteReportForUser,
  generateReportForUser,
  listReportHistoryForUser,
  regenerateReportForUser,
} from "@/features/reports/services/generate-report";

export const runtime = "nodejs";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const history = await listReportHistoryForUser(session.user.id);
  return NextResponse.json({ history });
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

  const actionBody = body as { action?: string; reportId?: string };

  try {
    if (actionBody.action === "regenerate" && actionBody.reportId) {
      const result = await regenerateReportForUser(
        session.user.id,
        actionBody.reportId,
      );
      if (!result) {
        return NextResponse.json({ error: "Report not found" }, { status: 404 });
      }
      return new NextResponse(new Uint8Array(result.buffer), {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${result.filename}"`,
          "X-Report-Id": result.reportId,
          "X-Report-Title": result.payload.title,
        },
      });
    }

    const parsed = generateReportSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 },
      );
    }

    const result = await generateReportForUser(session.user.id, parsed.data);
    return new NextResponse(new Uint8Array(result.buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${result.filename}"`,
        "X-Report-Id": result.reportId,
        "X-Report-Title": result.payload.title,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to generate PDF report.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = new URL(request.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const deleted = await deleteReportForUser(session.user.id, id);
  if (!deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
