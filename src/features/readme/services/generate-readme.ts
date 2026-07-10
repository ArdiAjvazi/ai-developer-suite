import { prisma } from "@/server/db";
import { createChatCompletion, isOpenAiConfigured } from "@/server/ai/client";
import { buildReadmePrompt } from "@/server/ai/prompts/readme";
import { buildMockReadme } from "@/server/ai/prompts/mock-readme";
import type { GenerateReadmeInput } from "@/features/readme/schemas/generate-readme";

async function ensureDefaultProject(userId: string) {
  const existing = await prisma.project.findFirst({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });

  if (existing) {
    return existing;
  }

  return prisma.project.create({
    data: {
      userId,
      name: "Default Project",
      description: "Auto-created workspace project",
    },
  });
}

export type GenerateReadmeResult = {
  jobId: string;
  markdown: string;
  model: string;
  status: "SUCCEEDED" | "FAILED";
  mock?: boolean;
};

export async function generateReadmeForUser(
  userId: string,
  input: GenerateReadmeInput,
): Promise<GenerateReadmeResult> {
  const project = await ensureDefaultProject(userId);

  const job = await prisma.job.create({
    data: {
      userId,
      projectId: project.id,
      type: "README",
      status: "RUNNING",
      inputCode: JSON.stringify({
        stack: input.stack,
        description: input.description,
      }),
      startedAt: new Date(),
    },
  });

  try {
    const useMock = !isOpenAiConfigured();

    let markdown: string;
    let model: string;

    if (useMock) {
      // Small delay so the UI loading state is visible during local testing
      await new Promise((resolve) => setTimeout(resolve, 600));
      markdown = buildMockReadme(input);
      model = "mock-codepilot-local";
    } else {
      const prompt = buildReadmePrompt(input);
      const completion = await createChatCompletion(
        [
          { role: "system", content: prompt.system },
          { role: "user", content: prompt.user },
        ],
        { temperature: 0.35 },
      );
      markdown = stripWrappingFences(completion.content);
      model = completion.model;
    }

    await prisma.job.update({
      where: { id: job.id },
      data: {
        status: "SUCCEEDED",
        outputData: {
          markdown,
          model,
          stack: input.stack,
          mock: useMock,
        },
        finishedAt: new Date(),
      },
    });

    return {
      jobId: job.id,
      markdown,
      model,
      status: "SUCCEEDED",
      mock: useMock,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "README generation failed.";

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

function stripWrappingFences(content: string) {
  const trimmed = content.trim();
  const match = trimmed.match(/^```(?:markdown|md)?\s*([\s\S]*?)\s*```$/i);
  return match ? match[1].trim() : trimmed;
}
