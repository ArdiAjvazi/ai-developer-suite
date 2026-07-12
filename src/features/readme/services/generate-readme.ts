import { prisma } from "@/server/db";
import { createChatCompletion, isOpenAiConfigured } from "@/server/ai/client";
import { buildReadmePrompt } from "@/server/ai/prompts/readme";
import { buildMockReadmeResult } from "@/server/ai/prompts/mock-readme";
import type { GenerateReadmeInput } from "@/features/readme/schemas/generate-readme";
import type { ReadmeResult } from "@/features/readme/types";
import {
  detectProjectStack,
  deriveProjectName,
} from "@/features/readme/lib/detect-stack";
import {
  buildBadges,
  templateSections,
} from "@/features/readme/lib/templates";

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

function stripWrappingFences(content: string) {
  const trimmed = content.trim();
  const match = trimmed.match(/^```(?:markdown|md)?\s*([\s\S]*?)\s*```$/i);
  return match ? match[1].trim() : trimmed;
}

function enrichLiveMarkdown(
  markdown: string,
  input: GenerateReadmeInput,
  generationTimeMs: number,
): ReadmeResult {
  const template = input.template ?? "Professional";
  const detected = detectProjectStack(input.description, input.stack);
  const projectName = deriveProjectName(input.description, input.projectName);
  const sections = templateSections(template);
  const badges = buildBadges(detected, template);
  const wordCount = markdown.trim().split(/\s+/).length;
  const completeness = Math.min(98, 72 + sections.length);
  const clarity = Math.min(96, 80 + Math.min(15, Math.floor(markdown.length / 400)));
  const professionalism = Math.min(97, 84);
  const seo = Math.min(94, 78);
  const githubReadability = Math.min(98, 82 + Math.floor(sections.length / 2));
  const overall = Math.round(
    (completeness + clarity + professionalism + seo + githubReadability) / 5,
  );

  return {
    markdown,
    projectName,
    quality: {
      overall,
      completeness,
      clarity,
      professionalism,
      seo,
      githubReadability,
    },
    metrics: {
      generationTimeMs,
      wordCount,
      sectionCount: sections.length,
      template,
      detectedStack: detected,
    },
    badges,
    sectionsGenerated: sections,
  };
}

export type GenerateReadmeResult = {
  jobId: string;
  markdown: string;
  model: string;
  status: "SUCCEEDED" | "FAILED";
  mock: boolean;
  result: ReadmeResult;
};

export async function generateReadmeForUser(
  userId: string,
  input: GenerateReadmeInput,
): Promise<GenerateReadmeResult> {
  const project = await ensureDefaultProject(userId);
  const startedAt = new Date();
  const template = input.template ?? "Professional";
  const detected = detectProjectStack(input.description, input.stack);
  const projectName = deriveProjectName(input.description, input.projectName);

  const job = await prisma.job.create({
    data: {
      userId,
      projectId: project.id,
      type: "README",
      status: "RUNNING",
      inputCode: JSON.stringify({
        description: input.description,
        template,
        projectName,
        stack: input.stack ?? detected.primaryStack,
        detected,
      }),
      startedAt,
    },
  });

  try {
    const useMock = !isOpenAiConfigured();
    let result: ReadmeResult;
    let model: string;

    if (useMock) {
      await new Promise((resolve) => setTimeout(resolve, 800));
      const generationTimeMs = Date.now() - startedAt.getTime();
      result = buildMockReadmeResult(input, generationTimeMs);
      model = "mock-codepilot-local";
    } else {
      const prompt = buildReadmePrompt({
        description: input.description,
        template,
        projectName,
        detected,
      });
      const completion = await createChatCompletion(
        [
          { role: "system", content: prompt.system },
          { role: "user", content: prompt.user },
        ],
        { temperature: 0.35 },
      );
      const markdown = stripWrappingFences(completion.content);
      const generationTimeMs = Date.now() - startedAt.getTime();
      result = enrichLiveMarkdown(markdown, input, generationTimeMs);
      model = completion.model;
    }

    await prisma.job.update({
      where: { id: job.id },
      data: {
        status: "SUCCEEDED",
        outputData: {
          result,
          markdown: result.markdown,
          model,
          template,
          projectName: result.projectName,
          qualityScore: result.quality.overall,
          language: result.metrics.detectedStack.language,
          mock: useMock,
        },
        finishedAt: new Date(),
      },
    });

    return {
      jobId: job.id,
      markdown: result.markdown,
      model,
      status: "SUCCEEDED",
      mock: useMock,
      result,
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
