import { prisma } from "@/server/db/prisma";
import { JobType } from "@/generated/prisma/enums";
import { getDocsJobForUser } from "@/features/documentation/services/list-docs";
import { getReviewJobForUser } from "@/features/reviews/services/list-reviews";
import { getRepositoryForUser } from "@/features/repositories/services/import-repository";
import { buildReviewReportPayload } from "@/features/reports/lib/build-review-payload";
import { buildDocsReportPayload } from "@/features/reports/lib/build-docs-payload";
import { buildRepositoryReportPayload } from "@/features/reports/lib/build-repository-payload";
import { renderReportPdf } from "@/server/pdf";
import type {
  GenerateReportRequest,
  PdfReportPayload,
  ReportHistoryItem,
} from "@/features/reports/types";

export async function resolveReportPayload(
  userId: string,
  input: GenerateReportRequest,
): Promise<PdfReportPayload> {
  if (input.sourceType === "REVIEW") {
    const job = await getReviewJobForUser(userId, input.sourceId);
    if (!job?.review) {
      throw new Error("Code review not found or incomplete.");
    }
    return buildReviewReportPayload({
      jobId: job.jobId,
      review: job.review,
      fileName: job.fileName,
      language: job.language,
      mock: job.mock,
    });
  }

  if (input.sourceType === "DOCS") {
    const job = await getDocsJobForUser(userId, input.sourceId);
    if (!job?.result) {
      throw new Error("Documentation job not found or incomplete.");
    }
    return buildDocsReportPayload({
      jobId: job.jobId,
      result: job.result,
      mock: job.mock,
    });
  }

  const repository = await getRepositoryForUser(userId, input.sourceId);
  if (!repository) {
    throw new Error("Repository not found.");
  }
  return buildRepositoryReportPayload(repository);
}

export async function generateReportForUser(
  userId: string,
  input: GenerateReportRequest,
): Promise<{
  buffer: Buffer;
  filename: string;
  reportId: string;
  payload: PdfReportPayload;
}> {
  const payload = await resolveReportPayload(userId, input);
  const { buffer, filename } = await renderReportPdf(payload);

  const job = await prisma.job.create({
    data: {
      userId,
      type: JobType.REPORT,
      status: "SUCCEEDED",
      inputCode: JSON.stringify(input),
      outputData: {
        sourceType: payload.sourceType,
        sourceId: payload.sourceId,
        title: payload.title,
        projectName: payload.projectName,
        overallScore: payload.overallScore,
        filename,
        mock: Boolean(payload.mock),
        generatedAt: payload.generatedAt,
      },
      startedAt: new Date(),
      finishedAt: new Date(),
    },
  });

  return { buffer, filename, reportId: job.id, payload };
}

export async function listReportHistoryForUser(
  userId: string,
  limit = 50,
): Promise<ReportHistoryItem[]> {
  const jobs = await prisma.job.findMany({
    where: { userId, type: JobType.REPORT },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return jobs.map((job) => {
    const output = (job.outputData ?? {}) as {
      sourceType?: ReportHistoryItem["sourceType"];
      sourceId?: string;
      title?: string;
      projectName?: string;
      overallScore?: number | null;
      mock?: boolean;
    };

    let sourceType = output.sourceType ?? "REVIEW";
    let sourceId = output.sourceId ?? "";
    if (job.inputCode) {
      try {
        const input = JSON.parse(job.inputCode) as GenerateReportRequest;
        sourceType = input.sourceType;
        sourceId = input.sourceId;
      } catch {
        // ignore
      }
    }

    return {
      id: job.id,
      createdAt: job.createdAt.toISOString(),
      status: job.status,
      sourceType,
      sourceId,
      title: output.title ?? "PDF Report",
      projectName: output.projectName ?? "Untitled",
      overallScore: output.overallScore ?? null,
      mock: Boolean(output.mock),
    };
  });
}

export async function deleteReportForUser(userId: string, id: string) {
  const existing = await prisma.job.findFirst({
    where: { id, userId, type: JobType.REPORT },
    select: { id: true },
  });
  if (!existing) return false;
  await prisma.job.delete({ where: { id: existing.id } });
  return true;
}

export async function regenerateReportForUser(userId: string, reportId: string) {
  const existing = await prisma.job.findFirst({
    where: { id: reportId, userId, type: JobType.REPORT },
  });
  if (!existing?.inputCode) return null;

  let input: GenerateReportRequest;
  try {
    input = JSON.parse(existing.inputCode) as GenerateReportRequest;
  } catch {
    return null;
  }

  return generateReportForUser(userId, input);
}
