import { prisma } from "@/server/db";
import { createChatCompletion, isOpenAiConfigured } from "@/server/ai/client";
import { buildDocsPrompt } from "@/server/ai/prompts/docs";
import { buildMockDocsResult } from "@/server/ai/prompts/mock-docs";
import type { GenerateDocsInput } from "@/features/documentation/schemas/generate-docs";
import type { DocsResult } from "@/features/documentation/types";
import {
  analyzeSource,
  deriveDocsProjectName,
} from "@/features/documentation/lib/analyze-source";

async function ensureDefaultProject(userId: string) {
  const existing = await prisma.project.findFirst({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });

  if (existing) return existing;

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

function enrichLiveDocs(
  markdown: string,
  input: GenerateDocsInput,
  generationTimeMs: number,
): DocsResult {
  const analysis = analyzeSource(input);
  const projectName = deriveDocsProjectName(input);
  const scope = input.scope ?? "Full Project";
  const sections = [
    "Project Overview",
    "Architecture",
    "Functions",
    "Classes",
    "API Endpoints",
    "Database Models",
    "Configuration",
    "Deployment Notes",
  ];
  const coverageUnits =
    analysis.functions.length +
    analysis.classes.length +
    analysis.endpoints.length +
    analysis.models.length;
  const completeness = Math.min(98, 70 + sections.length);
  const readability = Math.min(96, 80);
  const coverage = Math.min(97, 62 + coverageUnits * 4);
  const maintainability = Math.min(95, 76);
  const overall = Math.round(
    (completeness + readability + coverage + maintainability) / 4,
  );

  return {
    markdown,
    projectName,
    quality: {
      overall,
      completeness,
      readability,
      coverage,
      maintainability,
    },
    metrics: {
      generationTimeMs,
      language: String(analysis.language),
      filesAnalyzed: 1,
      functionsFound: analysis.functions.length,
      classesFound: analysis.classes.length,
      interfacesFound: analysis.interfaces.length,
      endpointsFound: analysis.endpoints.length,
      modelsFound: analysis.models.length,
      documentationVersion: "1.0.0",
      scope,
      wordCount: markdown.trim().split(/\s+/).length,
      sectionCount: sections.length,
    },
    sections,
    searchIndex: [
      projectName,
      String(analysis.language),
      ...analysis.functions,
      ...analysis.classes,
      ...sections,
    ],
  };
}

export type GenerateDocsResult = {
  jobId: string;
  markdown: string;
  model: string;
  status: "SUCCEEDED" | "FAILED";
  mock: boolean;
  result: DocsResult;
};

export async function generateDocsForUser(
  userId: string,
  input: GenerateDocsInput,
): Promise<GenerateDocsResult> {
  const project = await ensureDefaultProject(userId);
  const startedAt = new Date();
  const analysis = analyzeSource(input);
  const projectName = deriveDocsProjectName(input);
  const scope = input.scope ?? "Full Project";

  const job = await prisma.job.create({
    data: {
      userId,
      projectId: project.id,
      type: "DOCS",
      status: "RUNNING",
      inputCode: JSON.stringify({
        code: input.code,
        language: analysis.language,
        scope,
        projectName,
        fileName: input.fileName,
        repositoryHint: input.repositoryHint,
      }),
      startedAt,
    },
  });

  try {
    const useMock = !isOpenAiConfigured();
    let result: DocsResult;
    let model: string;

    if (useMock) {
      await new Promise((resolve) => setTimeout(resolve, 900));
      result = buildMockDocsResult(
        input,
        Date.now() - startedAt.getTime(),
      );
      model = "mock-codepilot-local";
    } else {
      const prompt = buildDocsPrompt({
        code: input.code,
        projectName,
        scope,
        fileName: input.fileName ?? "source.ts",
        analysis,
      });
      const completion = await createChatCompletion(
        [
          { role: "system", content: prompt.system },
          { role: "user", content: prompt.user },
        ],
        { temperature: 0.25 },
      );
      const markdown = stripWrappingFences(completion.content);
      result = enrichLiveDocs(
        markdown,
        input,
        Date.now() - startedAt.getTime(),
      );
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
          projectName: result.projectName,
          language: result.metrics.language,
          scope: result.metrics.scope,
          qualityScore: result.quality.overall,
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
      error instanceof Error ? error.message : "Documentation generation failed.";

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
