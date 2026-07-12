import { prisma } from "@/server/db";
import type {
  ReadmeHistoryItem,
  ReadmeJobDetail,
  ReadmeResult,
} from "@/features/readme/types";

type JobOutput = {
  result?: ReadmeResult;
  markdown?: string;
  model?: string;
  template?: string;
  projectName?: string;
  qualityScore?: number;
  language?: string;
  mock?: boolean;
};

function toHistoryItem(job: {
  id: string;
  createdAt: Date;
  status: string;
  inputCode: string | null;
  outputData: unknown;
}): ReadmeHistoryItem {
  const output = (job.outputData ?? {}) as JobOutput;
  let projectName = output.projectName ?? "Untitled Project";
  let template = output.template ?? "Professional";
  let language = output.language ?? output.result?.metrics.detectedStack.language ?? null;

  if (job.inputCode) {
    try {
      const input = JSON.parse(job.inputCode) as {
        projectName?: string;
        template?: string;
        detected?: { language?: string | null };
      };
      projectName = input.projectName ?? projectName;
      template = input.template ?? template;
      language = language ?? input.detected?.language ?? null;
    } catch {
      // ignore
    }
  }

  return {
    id: job.id,
    createdAt: job.createdAt.toISOString(),
    status: job.status,
    projectName,
    template,
    qualityScore:
      output.qualityScore ?? output.result?.quality.overall ?? null,
    language,
    mock: Boolean(output.mock),
  };
}

export async function listReadmeHistoryForUser(
  userId: string,
  limit = 50,
): Promise<ReadmeHistoryItem[]> {
  const jobs = await prisma.job.findMany({
    where: { userId, type: "README" },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return jobs.map(toHistoryItem);
}

export async function getReadmeJobForUser(
  userId: string,
  jobId: string,
): Promise<ReadmeJobDetail | null> {
  const job = await prisma.job.findFirst({
    where: { id: jobId, userId, type: "README" },
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
  };
}

export async function deleteReadmeJobForUser(userId: string, jobId: string) {
  const existing = await prisma.job.findFirst({
    where: { id: jobId, userId, type: "README" },
    select: { id: true },
  });

  if (!existing) return false;

  await prisma.job.delete({ where: { id: existing.id } });
  return true;
}

export async function duplicateReadmeJobForUser(
  userId: string,
  jobId: string,
) {
  const existing = await prisma.job.findFirst({
    where: { id: jobId, userId, type: "README" },
  });

  if (!existing) return null;

  const copy = await prisma.job.create({
    data: {
      userId,
      projectId: existing.projectId,
      type: "README",
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
