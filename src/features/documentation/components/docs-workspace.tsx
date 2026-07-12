"use client";

import { useMemo, useState } from "react";
import { BookOpen, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Label } from "@/shared/components/ui/label";
import { Select } from "@/shared/components/ui/select";
import { Textarea } from "@/shared/components/ui/textarea";
import { PageHeader } from "@/shared/components/ui/page-header";
import { FileDropzone } from "@/shared/components/upload/file-dropzone";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import {
  DOC_LANGUAGES,
  DOC_SCOPES,
  type DocLanguage,
  type DocScope,
} from "@/features/documentation/schemas/generate-docs";
import {
  analyzeSource,
  detectLanguageFromFileName,
  deriveDocsProjectName,
} from "@/features/documentation/lib/analyze-source";
import { DocsQualityScore } from "@/features/documentation/components/docs-quality-score";
import { DocsMetadata } from "@/features/documentation/components/docs-metadata";
import { DocsQuickActions } from "@/features/documentation/components/docs-quick-actions";
import { DocsHistory } from "@/features/documentation/components/docs-history";
import { DocsDocumentViewer } from "@/features/documentation/components/docs-document-viewer";
import { DocsLoadingState } from "@/features/documentation/components/docs-loading-state";
import type {
  DocsHistoryItem,
  DocsJobDetail,
  DocsResult,
} from "@/features/documentation/types";

const SAMPLE = `import { NextResponse } from "next/server";
import { prisma } from "@/server/db";

export async function GET() {
  const users = await prisma.user.findMany();
  return NextResponse.json({ users });
}

export async function POST(request: Request) {
  const body = await request.json();
  const user = await prisma.user.create({ data: body });
  return NextResponse.json(user, { status: 201 });
}

export function useUsers() {
  return { users: [] as Array<{ id: string; email: string }> };
}

export class UserService {
  async list() {
    return prisma.user.findMany();
  }
}

model User {
  id    String @id @default(cuid())
  email String @unique
}
`;

type ApiSuccess = {
  jobId: string;
  status: "SUCCEEDED";
  markdown: string;
  model: string;
  mock?: boolean;
  result: DocsResult;
};

type ApiError = { error: string };

type DocsWorkspaceProps = {
  initialHistory: DocsHistoryItem[];
};

export function DocsWorkspace({ initialHistory }: DocsWorkspaceProps) {
  const [code, setCode] = useState(SAMPLE);
  const [language, setLanguage] = useState<DocLanguage>("Auto-detect");
  const [scope, setScope] = useState<DocScope>("Full Project");
  const [projectName, setProjectName] = useState("CodePilot API");
  const [fileName, setFileName] = useState("route.ts");
  const [repositoryHint, setRepositoryHint] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [markdown, setMarkdown] = useState("");
  const [result, setResult] = useState<DocsResult | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [model, setModel] = useState<string | null>(null);
  const [history, setHistory] = useState(initialHistory);
  const [lastInput, setLastInput] = useState<{
    code: string;
    language: DocLanguage;
    scope: DocScope;
    projectName?: string;
    fileName?: string;
    repositoryHint?: string;
  } | null>(null);

  const liveAnalysis = useMemo(
    () =>
      analyzeSource({
        code,
        language,
        scope,
        projectName,
        fileName,
        repositoryHint: repositoryHint || undefined,
      }),
    [code, fileName, language, projectName, repositoryHint, scope],
  );

  const canGenerate = code.trim().length >= 10 && !pending;

  async function refreshHistory() {
    const response = await fetch("/api/docs");
    if (!response.ok) return;
    const data = (await response.json()) as { history: DocsHistoryItem[] };
    setHistory(data.history);
  }

  async function runGenerate(payload: {
    code: string;
    language: DocLanguage;
    scope: DocScope;
    projectName?: string;
    fileName?: string;
    repositoryHint?: string;
  }) {
    setPending(true);
    setError(null);
    setSuccessMessage(null);
    setLastInput(payload);

    try {
      const response = await fetch("/api/generate/docs", {
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
            ? "Mock documentation generated and saved to history."
            : "Documentation generated and saved to history.",
        );
        await refreshHistory();
      }
    } catch {
      setError("Network error while generating documentation.");
    } finally {
      setPending(false);
    }
  }

  async function onSelectHistory(selectedJobId: string) {
    setPending(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const response = await fetch(`/api/docs?jobId=${selectedJobId}`);
      const data = (await response.json()) as DocsJobDetail & { error?: string };
      if (!response.ok) {
        setError(data.error ?? "Unable to load documentation job.");
        return;
      }
      if (data.result) {
        setResult(data.result);
        setMarkdown(data.markdown ?? data.result.markdown);
        setJobId(data.jobId);
        setModel(data.model);
        setProjectName(data.result.projectName);
        setScope(data.result.metrics.scope);
        setSuccessMessage("Previous documentation reopened.");
      } else if (data.markdown) {
        setMarkdown(data.markdown);
        setJobId(data.jobId);
        setModel(data.model);
        setResult(null);
        setSuccessMessage("Previous documentation markdown loaded.");
      } else {
        setError("This job has no saved documentation payload.");
      }
    } catch {
      setError("Network error while loading history.");
    } finally {
      setPending(false);
    }
  }

  async function onDelete(selectedJobId: string) {
    const response = await fetch(`/api/docs?jobId=${selectedJobId}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      setError("Unable to delete documentation job.");
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
    const response = await fetch("/api/docs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "duplicate", jobId: selectedJobId }),
    });
    if (!response.ok) {
      setError("Unable to duplicate documentation job.");
      return;
    }
    setSuccessMessage("Documentation job duplicated.");
    await refreshHistory();
  }

  async function onRegenerateFromHistory(selectedJobId: string) {
    const response = await fetch(`/api/docs?jobId=${selectedJobId}`);
    if (!response.ok) {
      setError("Unable to load job for regenerate.");
      return;
    }
    const data = (await response.json()) as DocsJobDetail;
    await runGenerate({
      code,
      language,
      scope: data.result?.metrics.scope ?? scope,
      projectName: data.result?.projectName ?? projectName,
      fileName,
      repositoryHint: repositoryHint || undefined,
    });
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="AI Documentation Generator"
        description="Turn source code, uploads, and repository context into searchable enterprise documentation with quality scoring and export workflows."
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(340px,0.85fr)]">
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Source input</CardTitle>
              <CardDescription>
                Paste code, upload files, or point at an imported GitHub repository hint
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="docs-language">Language</Label>
                  <Select
                    id="docs-language"
                    value={language}
                    disabled={pending}
                    onChange={(event) =>
                      setLanguage(event.target.value as DocLanguage)
                    }
                    aria-label="Documentation language"
                  >
                    {DOC_LANGUAGES.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="docs-scope">Documentation scope</Label>
                  <Select
                    id="docs-scope"
                    value={scope}
                    disabled={pending}
                    onChange={(event) => setScope(event.target.value as DocScope)}
                    aria-label="Documentation scope"
                  >
                    {DOC_SCOPES.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="docs-project">Project name</Label>
                  <input
                    id="docs-project"
                    value={projectName}
                    disabled={pending}
                    onChange={(event) => setProjectName(event.target.value)}
                    aria-label="Project name"
                    className="flex h-10 w-full rounded-md border border-border bg-elevated px-3 text-sm text-foreground outline-none transition focus:border-zinc-500 focus-visible:ring-2 focus-visible:ring-zinc-500 disabled:opacity-50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="docs-repo">GitHub repository (optional)</Label>
                  <input
                    id="docs-repo"
                    value={repositoryHint}
                    disabled={pending}
                    onChange={(event) => setRepositoryHint(event.target.value)}
                    placeholder="org/repo"
                    aria-label="Imported GitHub repository hint"
                    className="flex h-10 w-full rounded-md border border-border bg-elevated px-3 text-sm text-foreground outline-none transition focus:border-zinc-500 focus-visible:ring-2 focus-visible:ring-zinc-500 disabled:opacity-50"
                  />
                </div>
              </div>

              <FileDropzone
                disabled={pending}
                label="Drop source or schema files here"
                onFileLoaded={({ content, fileName: nextName }) => {
                  setCode(content);
                  setFileName(nextName);
                  const detected = detectLanguageFromFileName(nextName);
                  if (detected) setLanguage(detected as DocLanguage);
                  setProjectName(deriveDocsProjectName({
                    code: content,
                    language: detected ? (detected as DocLanguage) : language,
                    scope,
                    fileName: nextName,
                    projectName,
                  }));
                }}
              />

              <div className="space-y-2">
                <Label htmlFor="docs-code">Source code / schema</Label>
                <Textarea
                  id="docs-code"
                  value={code}
                  disabled={pending}
                  onChange={(event) => setCode(event.target.value)}
                  aria-label="Source code for documentation"
                  className="min-h-[240px] font-mono text-[13px] leading-relaxed"
                />
                <p className="text-[11px] text-muted-foreground">
                  Detected live · {liveAnalysis.language} ·{" "}
                  {liveAnalysis.functions.length} functions ·{" "}
                  {liveAnalysis.classes.length} classes ·{" "}
                  {liveAnalysis.endpoints.length} endpoints ·{" "}
                  {liveAnalysis.models.length} models
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
                    code,
                    language,
                    scope,
                    projectName: projectName || undefined,
                    fileName,
                    repositoryHint: repositoryHint || undefined,
                  })
                }
                aria-label="Generate documentation"
              >
                {pending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating…
                  </>
                ) : (
                  <>
                    <BookOpen className="h-4 w-4" />
                    Generate documentation
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {pending ? <DocsLoadingState /> : null}

          {!pending && result && jobId ? (
            <div className="space-y-5" aria-live="polite">
              <DocsQuickActions
                markdown={markdown}
                projectName={result.projectName}
                jobId={jobId}
                pending={pending}
                onRegenerate={() =>
                  runGenerate(
                    lastInput ?? {
                      code,
                      language,
                      scope,
                      projectName,
                      fileName,
                      repositoryHint: repositoryHint || undefined,
                    },
                  )
                }
              />
              <div className="grid gap-4 lg:grid-cols-2">
                <DocsQualityScore quality={result.quality} />
                <DocsMetadata result={result} model={model} jobId={jobId} />
              </div>
              <DocsDocumentViewer
                markdown={markdown}
                onChange={setMarkdown}
                sections={result.sections}
              />
            </div>
          ) : null}

          {!pending && !result ? (
            <Card>
              <CardContent className="flex min-h-[180px] flex-col items-center justify-center text-center">
                <BookOpen className="mb-3 h-5 w-5 text-muted-foreground" aria-hidden />
                <p className="text-sm font-medium text-foreground">
                  Ready to generate documentation
                </p>
                <p className="mt-1 max-w-md text-xs leading-relaxed text-muted-foreground">
                  Paste or upload source, optionally add a GitHub repo hint, then
                  generate searchable docs with scores, exports, and history.
                </p>
              </CardContent>
            </Card>
          ) : null}
        </div>

        <DocsHistory
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
