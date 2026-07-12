import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import {
  deleteReadmeJobForUser,
  duplicateReadmeJobForUser,
  getReadmeJobForUser,
  listReadmeHistoryForUser,
} from "@/features/readme/services/list-readmes";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get("jobId");

  if (jobId) {
    const job = await getReadmeJobForUser(session.user.id, jobId);
    if (!job) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(job);
  }

  const history = await listReadmeHistoryForUser(session.user.id);
  return NextResponse.json({ history });
}

export async function DELETE(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get("jobId");

  if (!jobId) {
    return NextResponse.json({ error: "jobId is required" }, { status: 400 });
  }

  const deleted = await deleteReadmeJobForUser(session.user.id, jobId);
  if (!deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { jobId?: string; action?: string };
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

  const duplicated = await duplicateReadmeJobForUser(
    session.user.id,
    body.jobId,
  );

  if (!duplicated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ item: duplicated });
}
