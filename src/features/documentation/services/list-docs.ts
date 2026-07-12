import { prisma } from "@/server/db";
import type {
  DocsHistoryItem,
  DocsJobDetail,
  DocsResult,
} from "@/features/documentation/types";

type JobOutput = {
  result?: DocsResult;
  markdown?: string;
  model?: string;
  projectName?: string;
  language?: string;
  scope?: string;
  qualityScore?: number;
  mock?: boolean;
};

function toHistoryItem(job: {
  id: string;
  createdAt: Date;
  status: string;
  inputCode: string | null;
  outputData: unknown;
}): DocsHistoryItem {
  const output = (job.outputData ?? {}) as JobOutput;
  let projectName = output.projectName ?? "Untitled Docs";
  let language = output.language ?? "Unknown";
  let scope = output.scope ?? "Full Project";

  if (job.inputCode) {
    try {
      const input = JSON.parse(job.inputCode) as {
        projectName?: string;
        language?: string;
        scope?: string;
      };
      projectName = input.projectName ?? projectName;
      language = input.language ?? language;
      scope = input.scope ?? scope;
    } catch {
      // ignore
    }
  }

  return {
    id: job.id,
    createdAt: job.createdAt.toISOString(),
    status: job.status,
    projectName,
    language,
    score: output.qualityScore ?? output.result?.quality.overall ?? null,
    scope,
    mock: Boolean(output.mock),
  };
}

export async function listDocsHistoryForUser(userId: string, limit = 50) {
  const jobs = await prisma.job.findMany({
    where: { userId, type: "DOCS" },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return jobs.map(toHistoryItem);
}

export async function getDocsJobForUser(userId: string, jobId: string) {
  const job = await prisma.job.findFirst({
    where: { id: jobId, userId, type: "DOCS" },
  });
  if (!job) return null;

  const output = (job.outputData ?? {}) as JobOutput;
  return {
    jobId: job.id,
    status: job.status,
    createdAt: job.createdAt.toISOString(),
    markdown: output.markdown ?? output.result?.markdown ?? null,
    result: output.result ?? null,
    model: output.model ?? null,
    mock: Boolean(output.mock),
  } satisfies DocsJobDetail;
}

export async function deleteDocsJobForUser(userId: string, jobId: string) {
  const existing = await prisma.job.findFirst({
    where: { id: jobId, userId, type: "DOCS" },
    select: { id: true },
  });
  if (!existing) return false;
  await prisma.job.delete({ where: { id: existing.id } });
  return true;
}

export async function duplicateDocsJobForUser(userId: string, jobId: string) {
  const existing = await prisma.job.findFirst({
    where: { id: jobId, userId, type: "DOCS" },
  });
  if (!existing) return null;

  const copy = await prisma.job.create({
    data: {
      userId,
      projectId: existing.projectId,
      type: "DOCS",
      status: existing.status,
      inputCode: existing.inputCode,
      outputData: existing.outputData ?? undefined,
      error: existing.error,
      startedAt: new Date(),
      finishedAt: new Date(),
    },
  });

  return toHistoryItem(copy);
}
