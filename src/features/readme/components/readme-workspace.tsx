"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Label } from "@/shared/components/ui/label";
import { Select } from "@/shared/components/ui/select";
import { Textarea } from "@/shared/components/ui/textarea";
import { PageHeader } from "@/shared/components/ui/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { cn } from "@/shared/lib/cn";
import {
  README_TEMPLATES,
  type ReadmeTemplate,
} from "@/features/readme/schemas/generate-readme";
import {
  detectProjectStack,
} from "@/features/readme/lib/detect-stack";
import { MarkdownPreview } from "@/shared/components/ui/markdown-preview";
import { ReadmeQualityScore } from "@/features/readme/components/readme-quality-score";
import { DetectedStackCard } from "@/features/readme/components/detected-stack-card";
import { ReadmeMetadata } from "@/features/readme/components/readme-metadata";
import { ReadmeQuickActions } from "@/features/readme/components/readme-quick-actions";
import { ReadmeHistory } from "@/features/readme/components/readme-history";
import { ReadmeLoadingState } from "@/features/readme/components/readme-loading-state";
import type {
  ReadmeHistoryItem,
  ReadmeJobDetail,
  ReadmeResult,
} from "@/features/readme/types";

type ViewMode = "editor" | "preview" | "split";

type ApiSuccess = {
  jobId: string;
  status: "SUCCEEDED";
  markdown: string;
  model: string;
  mock?: boolean;
  result: ReadmeResult;
};

type ApiError = { error: string };

type ReadmeWorkspaceProps = {
  initialHistory: ReadmeHistoryItem[];
};

const SAMPLE = `CodePilot AI is a premium Next.js SaaS for developers.
It uses TypeScript, React, Prisma, PostgreSQL/Neon, Auth.js, and an OpenAI-compatible API.
Features include AI Code Review, README generation, documentation, GitHub import, and PDF reports.
Deployed on Vercel with npm scripts for dev/build/start.`;

export function ReadmeWorkspace({ initialHistory }: ReadmeWorkspaceProps) {
  const [description, setDescription] = useState(SAMPLE);
  const [template, setTemplate] = useState<ReadmeTemplate>("Professional");
  const [projectName, setProjectName] = useState("CodePilot AI");
  const [viewMode, setViewMode] = useState<ViewMode>("split");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [markdown, setMarkdown] = useState("");
  const [result, setResult] = useState<ReadmeResult | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [model, setModel] = useState<string | null>(null);
  const [history, setHistory] =
    useState<ReadmeHistoryItem[]>(initialHistory);
  const [lastInput, setLastInput] = useState<{
    description: string;
    template: ReadmeTemplate;
    projectName?: string;
  } | null>(null);

  const liveDetection = useMemo(
    () => detectProjectStack(description),
    [description],
  );

  const canGenerate = description.trim().length >= 20 && !pending;

  async function refreshHistory() {
    const response = await fetch("/api/readme");
    if (!response.ok) return;
    const data = (await response.json()) as { history: ReadmeHistoryItem[] };
    setHistory(data.history);
  }

  async function runGenerate(payload: {
    description: string;
    template: ReadmeTemplate;
    projectName?: string;
  }) {
    setPending(true);
    setError(null);
    setSuccessMessage(null);
    setLastInput(payload);

    try {
      const response = await fetch("/api/generate/readme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as ApiSuccess | ApiError;

      if (!response.ok) {
        setError("error" in data ? data.error : "Generation failed.");
        return;
      }

      if ("result" in data) {
        setResult(data.result);
        setMarkdown(data.markdown);
        setJobId(data.jobId);
        setModel(data.model);
        setProjectName(data.result.projectName);
        setSuccessMessage(
          data.mock
            ? "Mock README generated and saved to history."
            : "README generated and saved to history.",
        );
        await refreshHistory();
      }
    } catch {
      setError("Network error while generating README.");
    } finally {
      setPending(false);
    }
  }

  async function onSelectHistory(selectedJobId: string) {
    setPending(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(`/api/readme?jobId=${selectedJobId}`);
      const data = (await response.json()) as ReadmeJobDetail & {
        error?: string;
      };

      if (!response.ok) {
        setError(data.error ?? "Unable to load README job.");
        return;
      }

      if (data.result) {
        setResult(data.result);
        setMarkdown(data.markdown ?? data.result.markdown);
        setJobId(data.jobId);
        setModel(data.model);
        setProjectName(data.result.projectName);
        setTemplate(data.result.metrics.template);
        setSuccessMessage("Previous README reopened.");
      } else if (data.markdown) {
        setMarkdown(data.markdown);
        setJobId(data.jobId);
        setModel(data.model);
        setResult(null);
        setSuccessMessage("Previous README markdown loaded.");
      } else {
        setError("This job has no saved README payload.");
      }
    } catch {
      setError("Network error while loading history.");
    } finally {
      setPending(false);
    }
  }

  async function onDelete(selectedJobId: string) {
    const response = await fetch(`/api/readme?jobId=${selectedJobId}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      setError("Unable to delete README job.");
      return;
    }
    if (jobId === selectedJobId) {
      setResult(null);
      setMarkdown("");
      setJobId(null);
      setModel(null);
      setSuccessMessage(null);
    }
    await refreshHistory();
  }

  async function onDuplicate(selectedJobId: string) {
    const response = await fetch("/api/readme", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "duplicate", jobId: selectedJobId }),
    });
    if (!response.ok) {
      setError("Unable to duplicate README job.");
      return;
    }
    setSuccessMessage("README job duplicated.");
    await refreshHistory();
  }

  async function onRegenerateFromHistory(selectedJobId: string) {
    const response = await fetch(`/api/readme?jobId=${selectedJobId}`);
    if (!response.ok) {
      setError("Unable to load job for regenerate.");
      return;
    }
    const data = (await response.json()) as ReadmeJobDetail;
    const nextTemplate = data.result?.metrics.template ?? template;
    const nextName = data.result?.projectName ?? projectName;
    await runGenerate({
      description,
      template: nextTemplate,
      projectName: nextName,
    });
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="README Generator"
        description="Premium GitHub-ready README generation with smart stack detection, templates, quality scoring, and export workflows."
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(340px,0.85fr)]">
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Project input</CardTitle>
              <CardDescription>
                Describe the product once — stack signals are detected automatically
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="readme-template">Template</Label>
                  <Select
                    id="readme-template"
                    value={template}
                    disabled={pending}
                    onChange={(event) =>
                      setTemplate(event.target.value as ReadmeTemplate)
                    }
                    aria-label="README template"
                  >
                    {README_TEMPLATES.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="project-name">Project name</Label>
                  <input
                    id="project-name"
                    value={projectName}
                    disabled={pending}
                    onChange={(event) => setProjectName(event.target.value)}
                    aria-label="Project name"
                    className="flex h-10 w-full rounded-md border border-border bg-elevated px-3 text-sm text-foreground outline-none transition focus:border-zinc-500 focus-visible:ring-2 focus-visible:ring-zinc-500 disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Project description / source</Label>
                <Textarea
                  id="description"
                  value={description}
                  disabled={pending}
                  onChange={(event) => setDescription(event.target.value)}
                  aria-label="Project description"
                  className="min-h-[220px] font-mono text-[13px] leading-relaxed"
                  placeholder="Paste product context, stack notes, scripts, and architecture details…"
                />
                <p className="text-[11px] text-muted-foreground">
                  {description.trim().length}/20,000 · minimum 20 characters
                </p>
              </div>

              {error ? (
                <div
                  role="alert"
                  className="rounded-md border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-300"
                >
                  {error}
                </div>
              ) : null}

              {successMessage ? (
                <div
                  role="status"
                  className="flex items-center gap-2 rounded-md border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  {successMessage}
                </div>
              ) : null}

              <Button
                type="button"
                disabled={!canGenerate}
                onClick={() =>
                  runGenerate({
                    description,
                    template,
                    projectName: projectName || undefined,
                  })
                }
                aria-label="Generate README"
              >
                {pending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating…
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Generate README
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <DetectedStackCard detected={liveDetection} />

          {pending ? <ReadmeLoadingState /> : null}

          {!pending && result && jobId ? (
            <div className="space-y-5" aria-live="polite">
              <ReadmeQuickActions
                markdown={markdown}
                projectName={result.projectName}
                jobId={jobId}
                pending={pending}
                onRegenerate={() =>
                  runGenerate(
                    lastInput ?? {
                      description,
                      template,
                      projectName,
                    },
                  )
                }
              />

              <div className="grid gap-4 lg:grid-cols-2">
                <ReadmeQualityScore quality={result.quality} />
                <ReadmeMetadata
                  result={result}
                  model={model}
                  jobId={jobId}
                />
              </div>

              <Card>
                <CardHeader className="space-y-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <CardTitle>Markdown workspace</CardTitle>
                      <CardDescription>
                        Switch between editor, preview, and split view
                      </CardDescription>
                    </div>
                    <div
                      className="inline-flex rounded-lg border border-border bg-elevated p-1"
                      role="tablist"
                      aria-label="Markdown view mode"
                    >
                      {(["editor", "preview", "split"] as ViewMode[]).map(
                        (mode) => (
                          <button
                            key={mode}
                            type="button"
                            role="tab"
                            aria-selected={viewMode === mode}
                            onClick={() => setViewMode(mode)}
                            className={cn(
                              "rounded-md px-3 py-1.5 text-xs font-medium capitalize transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500",
                              viewMode === mode
                                ? "bg-foreground text-background"
                                : "text-muted-foreground hover:text-foreground",
                            )}
                          >
                            {mode === "split" ? "Split view" : mode}
                          </button>
                        ),
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div
                    className={cn(
                      "grid gap-4",
                      viewMode === "split" && "lg:grid-cols-2",
                    )}
                  >
                    {viewMode !== "preview" ? (
                      <Textarea
                        value={markdown}
                        onChange={(event) => setMarkdown(event.target.value)}
                        aria-label="README markdown editor"
                        className="min-h-[420px] font-mono text-[12px] leading-relaxed"
                      />
                    ) : null}
                    {viewMode !== "editor" ? (
                      <div className="min-h-[420px] overflow-auto rounded-md border border-border bg-[#0d0d0f] p-4">
                        <MarkdownPreview markdown={markdown} />
                      </div>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : null}

          {!pending && !result ? (
            <Card>
              <CardContent className="flex min-h-[180px] flex-col items-center justify-center text-center">
                <Sparkles className="mb-3 h-5 w-5 text-muted-foreground" aria-hidden />
                <p className="text-sm font-medium text-foreground">
                  Ready to generate your README
                </p>
                <p className="mt-1 max-w-md text-xs leading-relaxed text-muted-foreground">
                  Pick a template, paste project context, and generate a complete
                  GitHub-ready README with badges, structure, examples, and exports.
                </p>
              </CardContent>
            </Card>
          ) : null}
        </div>

        <ReadmeHistory
          items={history}
          activeJobId={jobId}
          onSelect={onSelectHistory}
          onDelete={onDelete}
          onDuplicate={onDuplicate}
          onRegenerate={onRegenerateFromHistory}
        />
      </div>
    </div>
  );
}
