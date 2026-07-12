"use client";

import { useMemo, useState } from "react";
import {
  CheckCircle2,
  FileDown,
  Loader2,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Select } from "@/shared/components/ui/select";
import { PageHeader } from "@/shared/components/ui/page-header";
import { ProgressBar } from "@/shared/components/ui/progress";
import { Skeleton } from "@/shared/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { cn } from "@/shared/lib/cn";
import { downloadPdfReport } from "@/features/reports/lib/download-pdf-report";
import type { ReportHistoryItem, ReportSourceType } from "@/features/reports/types";
import type { ReviewHistoryItem } from "@/features/reviews/types";
import type { DocsHistoryItem } from "@/features/documentation/types";
import type { RepositoryHistoryItem } from "@/features/repositories/types";

type ReportsWorkspaceProps = {
  initialHistory: ReportHistoryItem[];
  reviews: ReviewHistoryItem[];
  docs: DocsHistoryItem[];
  repositories: RepositoryHistoryItem[];
  initialSourceType?: ReportSourceType;
  initialSourceId?: string;
};

const STAGES = [
  "Collecting analysis data…",
  "Compiling charts & health scores…",
  "Laying out cover page…",
  "Rendering PDF pages…",
  "Finalizing download…",
] as const;

export function ReportsWorkspace({
  initialHistory,
  reviews,
  docs,
  repositories,
  initialSourceType = "REVIEW",
  initialSourceId = "",
}: ReportsWorkspaceProps) {
  const [history, setHistory] = useState(initialHistory);
  const [sourceType, setSourceType] = useState<ReportSourceType>(
    initialSourceType,
  );
  const [sourceId, setSourceId] = useState(initialSourceId);
  const [query, setQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | ReportSourceType>("all");
  const [pending, setPending] = useState(false);
  const [stageIndex, setStageIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const sources = useMemo(() => {
    if (sourceType === "REVIEW") {
      return reviews.map((item) => ({
        id: item.id,
        label: `${item.fileName} · ${item.language} · ${item.score ?? "—"}/100`,
      }));
    }
    if (sourceType === "DOCS") {
      return docs.map((item) => ({
        id: item.id,
        label: `${item.projectName} · ${item.language} · ${item.score ?? "—"}/100`,
      }));
    }
    return repositories.map((item) => ({
      id: item.id,
      label: `${item.fullName} · ${item.framework ?? item.primaryLanguage ?? "—"} · ${item.healthScore ?? "—"}/100`,
    }));
  }, [sourceType, reviews, docs, repositories]);

  const filteredHistory = useMemo(() => {
    const q = query.trim().toLowerCase();
    return history.filter((item) => {
      if (filterType !== "all" && item.sourceType !== filterType) return false;
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.projectName.toLowerCase().includes(q) ||
        item.sourceType.toLowerCase().includes(q)
      );
    });
  }, [history, query, filterType]);

  async function runGenerate(target?: {
    sourceType: ReportSourceType;
    sourceId: string;
  }) {
    const nextType = target?.sourceType ?? sourceType;
    const nextId = target?.sourceId ?? sourceId;
    if (!nextId) {
      setError("Select a source analysis to export.");
      return;
    }

    setError(null);
    setSuccess(null);
    setPending(true);
    setStageIndex(0);

    const timer = window.setInterval(() => {
      setStageIndex((prev) => Math.min(prev + 1, STAGES.length - 1));
    }, 700);

    try {
      const result = await downloadPdfReport({
        sourceType: nextType,
        sourceId: nextId,
      });

      setSuccess(`Downloaded ${result.filename}`);
      const refresh = await fetch("/api/reports");
      if (refresh.ok) {
        const data = (await refresh.json()) as { history: ReportHistoryItem[] };
        setHistory(data.history);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "PDF generation failed.");
    } finally {
      window.clearInterval(timer);
      setPending(false);
      setStageIndex(0);
    }
  }

  async function removeReport(id: string) {
    setError(null);
    try {
      const res = await fetch(`/api/reports?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setError(data.error ?? "Failed to delete report.");
        return;
      }
      setHistory((prev) => prev.filter((item) => item.id !== id));
      setSuccess("Report removed from history.");
    } catch {
      setError("Network failure while deleting report.");
    }
  }

  const emptySources = sources.length === 0;
  const progress = pending
    ? Math.round(((stageIndex + 1) / STAGES.length) * 100)
    : 0;

  return (
    <div className="space-y-8">
      <PageHeader
        title="PDF Reports"
        description="Export branded analysis PDFs from Code Reviews, Documentation, and Repository imports — cover page, health scores, and detailed breakdowns."
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileDown className="h-4 w-4" aria-hidden />
                Generate report
              </CardTitle>
              <CardDescription>
                Choose a completed analysis source and download a professional PDF
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="report-source-type">Source type</Label>
                  <Select
                    id="report-source-type"
                    value={sourceType}
                    disabled={pending}
                    onChange={(event) => {
                      const next = event.target.value as ReportSourceType;
                      setSourceType(next);
                      setSourceId("");
                    }}
                    aria-label="Report source type"
                  >
                    <option value="REVIEW">AI Code Review</option>
                    <option value="DOCS">AI Documentation</option>
                    <option value="REPOSITORY">Repository Analysis</option>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="report-source-id">Source artifact</Label>
                  <Select
                    id="report-source-id"
                    value={sourceId}
                    disabled={pending || emptySources}
                    onChange={(event) => setSourceId(event.target.value)}
                    aria-label="Source artifact"
                  >
                    <option value="">
                      {emptySources ? "No sources available" : "Select…"}
                    </option>
                    {sources.map((source) => (
                      <option key={source.id} value={source.id}>
                        {source.label}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              {emptySources ? (
                <p className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                  No {sourceType.toLowerCase()} artifacts yet. Generate one in its
                  module, then return here to export a PDF.
                </p>
              ) : null}

              <Button
                type="button"
                onClick={() => void runGenerate()}
                disabled={pending || !sourceId}
                aria-label="Generate PDF report"
              >
                {pending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileDown className="h-4 w-4" />
                )}
                {pending ? "Generating report PDF…" : "Download PDF"}
              </Button>

              {pending ? (
                <div className="space-y-3 rounded-lg border border-border bg-elevated/40 p-4">
                  <p className="text-sm font-medium text-foreground">
                    {STAGES[stageIndex]}
                  </p>
                  <ProgressBar value={progress} label="PDF generation progress" />
                  <div className="grid gap-2 sm:grid-cols-3">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                </div>
              ) : null}

              {error ? (
                <div
                  className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200"
                  role="alert"
                >
                  {error}
                </div>
              ) : null}
              {success ? (
                <div
                  className="flex items-start gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200"
                  role="status"
                >
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                  <span>{success}</span>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Report structure</CardTitle>
              <CardDescription>
                Every CodePilot PDF includes these sections
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="grid gap-2 sm:grid-cols-2">
                {[
                  "Executive cover page with branding",
                  "Project metrics & health scores",
                  "Executive summary",
                  "Module-specific detailed breakdown",
                  "Page numbers & generation timestamp",
                  "Dark premium dashboard styling",
                ].map((item) => (
                  <li
                    key={item}
                    className="rounded-lg border border-border bg-elevated/40 px-3 py-2 text-sm text-foreground"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        <Card className="xl:sticky xl:top-6 xl:self-start">
          <CardHeader>
            <CardTitle>Export history</CardTitle>
            <CardDescription>Recently generated PDF reports</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-2">
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search reports…"
                aria-label="Search report history"
              />
              <Select
                value={filterType}
                onChange={(event) =>
                  setFilterType(event.target.value as "all" | ReportSourceType)
                }
                aria-label="Filter report history by type"
              >
                <option value="all">All types</option>
                <option value="REVIEW">Code Review</option>
                <option value="DOCS">Documentation</option>
                <option value="REPOSITORY">Repository</option>
              </Select>
            </div>

            {history.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
                No PDF exports yet. Generate your first report to populate history.
              </p>
            ) : filteredHistory.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                No reports match your filters.
              </p>
            ) : (
              <ul className="max-h-[520px] space-y-2 overflow-y-auto" role="list">
                {filteredHistory.slice(0, 40).map((item) => (
                  <li
                    key={item.id}
                    className={cn(
                      "rounded-lg border border-border bg-elevated/30 px-3 py-3",
                    )}
                  >
                    <p className="text-sm font-semibold text-foreground">
                      {item.title}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {item.projectName} · {item.sourceType} ·{" "}
                      {new Date(item.createdAt).toLocaleString()}
                      {item.overallScore != null
                        ? ` · ${item.overallScore}/100`
                        : ""}
                      {item.mock ? " · mock" : ""}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={pending}
                        onClick={() =>
                          void runGenerate({
                            sourceType: item.sourceType,
                            sourceId: item.sourceId,
                          })
                        }
                        aria-label={`Regenerate PDF for ${item.projectName}`}
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        Re-export
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        disabled={pending}
                        onClick={() => void removeReport(item.id)}
                        aria-label={`Delete report ${item.projectName}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
