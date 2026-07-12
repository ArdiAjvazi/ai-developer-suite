import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import {
  deleteDocsJobForUser,
  duplicateDocsJobForUser,
  getDocsJobForUser,
  listDocsHistoryForUser,
} from "@/features/documentation/services/list-docs";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const jobId = new URL(request.url).searchParams.get("jobId");
  if (jobId) {
    const job = await getDocsJobForUser(session.user.id, jobId);
    if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(job);
  }

  const history = await listDocsHistoryForUser(session.user.id);
  return NextResponse.json({ history });
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const jobId = new URL(request.url).searchParams.get("jobId");
  if (!jobId) {
    return NextResponse.json({ error: "jobId is required" }, { status: 400 });
  }

  const deleted = await deleteDocsJobForUser(session.user.id, jobId);
  if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { action?: string; jobId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (body.action !== "duplicate" || !body.jobId) {
    return NextResponse.json(
      { error: "Unsupported action. Use { action: 'duplicate', jobId }" },
      { status: 400 },
    );
  }

  const item = await duplicateDocsJobForUser(session.user.id, body.jobId);
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ item });
}
