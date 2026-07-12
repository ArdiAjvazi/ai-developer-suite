import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { importRepositorySchema } from "@/features/repositories/schemas/import-repository";
import {
  deleteRepositoryForUser,
  getRepositoryForUser,
  importRepositoryForUser,
  listRepositoriesForUser,
  refreshRepositoryForUser,
} from "@/features/repositories/services/import-repository";
import {
  messageForImportError,
  RepositoryImportError,
} from "@/features/repositories/lib/parse-github-url";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = new URL(request.url).searchParams.get("id");
  if (id) {
    const repository = await getRepositoryForUser(session.user.id, id);
    if (!repository) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ repository });
  }

  const history = await listRepositoriesForUser(session.user.id);
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

  const actionBody = body as { action?: string; id?: string; url?: string };

  if (actionBody.action === "refresh" && actionBody.id) {
    const repository = await refreshRepositoryForUser(
      session.user.id,
      actionBody.id,
    );
    if (!repository) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ repository });
  }

  const parsed = importRepositorySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  try {
    const repository = await importRepositoryForUser(
      session.user.id,
      parsed.data.url,
    );
    return NextResponse.json({ repository });
  } catch (error) {
    const message = messageForImportError(error);
    const status =
      error instanceof RepositoryImportError
        ? error.code === "INVALID_URL"
          ? 400
          : error.code === "NOT_FOUND"
            ? 404
            : error.code === "PRIVATE"
              ? 403
              : 502
        : 500;
    return NextResponse.json(
      {
        error: message,
        code: error instanceof RepositoryImportError ? error.code : "UNKNOWN",
      },
      { status },
    );
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

  const deleted = await deleteRepositoryForUser(session.user.id, id);
  if (!deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
