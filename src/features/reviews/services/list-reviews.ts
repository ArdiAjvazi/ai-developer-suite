import { prisma } from "@/server/db";
import type {
  CodeReviewResult,
  ReviewHistoryItem,
  ReviewJobDetail,
} from "@/features/reviews/types";

type JobOutput = {
  review?: CodeReviewResult;
  language?: string;
  fileName?: string;
  mock?: boolean;
  model?: string;
};

function toHistoryItem(job: {
  id: string;
  createdAt: Date;
  status: string;
  inputCode: string | null;
  outputData: unknown;
}): ReviewHistoryItem {
  const output = (job.outputData ?? {}) as JobOutput;
  let language = output.language ?? "Unknown";
  let fileName = output.fileName ?? "snippet";

  if (job.inputCode) {
    try {
      const input = JSON.parse(job.inputCode) as {
        language?: string;
        fileName?: string;
      };
      language = input.language ?? language;
      fileName = input.fileName ?? fileName;
    } catch {
      // ignore malformed input snapshots
    }
  }

  const categoryScores: ReviewHistoryItem["categoryScores"] = {};
  for (const category of output.review?.categories ?? []) {
    categoryScores[category.category] = category.score;
  }

  return {
    id: job.id,
    createdAt: job.createdAt.toISOString(),
    status: job.status,
    language,
    fileName,
    score: output.review?.score ?? null,
    issueCount: output.review?.issues?.length ?? 0,
    mock: Boolean(output.mock),
    highCount: output.review?.severityCounts?.High ?? 0,
    mediumCount: output.review?.severityCounts?.Medium ?? 0,
    lowCount: output.review?.severityCounts?.Low ?? 0,
    categoryScores,
  };
}

export async function listReviewHistoryForUser(
  userId: string,
  limit = 50,
): Promise<ReviewHistoryItem[]> {
  const jobs = await prisma.job.findMany({
    where: {
      userId,
      type: "REVIEW",
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return jobs.map(toHistoryItem);
}

export async function getReviewJobForUser(
  userId: string,
  jobId: string,
): Promise<ReviewJobDetail | null> {
  const job = await prisma.job.findFirst({
    where: {
      id: jobId,
      userId,
      type: "REVIEW",
    },
  });

  if (!job) {
    return null;
  }

  const output = (job.outputData ?? {}) as JobOutput;

  return {
    jobId: job.id,
    status: job.status,
    createdAt: job.createdAt.toISOString(),
    startedAt: job.startedAt?.toISOString() ?? null,
    finishedAt: job.finishedAt?.toISOString() ?? null,
    review: output.review ?? null,
    model: output.model ?? null,
    mock: Boolean(output.mock),
    language: output.language ?? null,
    fileName: output.fileName ?? null,
  };
}

export async function deleteReviewJobForUser(userId: string, jobId: string) {
  const existing = await prisma.job.findFirst({
    where: {
      id: jobId,
      userId,
      type: "REVIEW",
    },
    select: { id: true },
  });

  if (!existing) {
    return false;
  }

  await prisma.job.delete({ where: { id: existing.id } });
  return true;
}
