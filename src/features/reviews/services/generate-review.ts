import { prisma } from "@/server/db";
import { ensureDefaultProject } from "@/server/db/ensure-default-project";
import { createChatCompletion, isOpenAiConfigured } from "@/server/ai/client";
import { buildCodeReviewPrompt } from "@/server/ai/prompts/review";
import { buildMockCodeReview } from "@/server/ai/prompts/mock-review";
import type { GenerateReviewInput } from "@/features/reviews/schemas/generate-review";
import type { CodeReviewResult } from "@/features/reviews/types";
import { parseReviewResultJson } from "@/features/reviews/lib/parse-review-result";
import { countLines } from "@/features/reviews/lib/review-metrics";

export type GenerateReviewResult = {
  jobId: string;
  status: "SUCCEEDED" | "FAILED";
  model: string;
  mock: boolean;
  review: CodeReviewResult;
};

export async function generateCodeReviewForUser(
  userId: string,
  input: GenerateReviewInput,
): Promise<GenerateReviewResult> {
  const project = await ensureDefaultProject(userId);
  const startedAt = new Date();

  const job = await prisma.job.create({
    data: {
      userId,
      projectId: project.id,
      type: "REVIEW",
      status: "RUNNING",
      inputCode: JSON.stringify({
        language: input.language,
        fileName: input.fileName,
        code: input.code,
      }),
      startedAt,
    },
  });

  try {
    const useMock = !isOpenAiConfigured();
    let review: CodeReviewResult;
    let model: string;

    if (useMock) {
      await new Promise((resolve) => setTimeout(resolve, 900));
      const durationMs = Date.now() - startedAt.getTime();
      review = buildMockCodeReview(input, durationMs);
      model = "mock-codepilot-local";
    } else {
      const prompt = buildCodeReviewPrompt(input);
      const completion = await createChatCompletion(
        [
          { role: "system", content: prompt.system },
          { role: "user", content: prompt.user },
        ],
        { temperature: 0.2 },
      );
      const durationMs = Date.now() - startedAt.getTime();
      review = parseReviewResultJson(completion.content, {
        language: input.language,
        linesOfCode: countLines(input.code),
        durationMs,
      });
      model = completion.model;
    }

    await prisma.job.update({
      where: { id: job.id },
      data: {
        status: "SUCCEEDED",
        outputData: {
          review,
          model,
          language: input.language,
          fileName: input.fileName,
          mock: useMock,
        },
        finishedAt: new Date(),
      },
    });

    return {
      jobId: job.id,
      status: "SUCCEEDED",
      model,
      mock: useMock,
      review,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Code review failed.";

    await prisma.job.update({
      where: { id: job.id },
      data: {
        status: "FAILED",
        error: message,
        finishedAt: new Date(),
      },
    });

    throw error;
  }
}
