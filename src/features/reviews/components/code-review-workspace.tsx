"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Loader2, ScanSearch } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Label } from "@/shared/components/ui/label";
import { Select } from "@/shared/components/ui/select";
import { PageHeader } from "@/shared/components/ui/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { CodeEditor } from "@/features/reviews/components/code-editor";
import { FileDropzone } from "@/shared/components/upload/file-dropzone";
import { ReviewResults } from "@/features/reviews/components/review-results";
import { ReviewHistory } from "@/features/reviews/components/review-history";
import { ReviewCharts } from "@/features/reviews/components/review-charts";
import { ReviewLoadingState } from "@/features/reviews/components/review-loading-state";
import {
  REVIEW_LANGUAGES,
  type ReviewLanguage,
} from "@/features/reviews/schemas/generate-review";
import type {
  CodeReviewResult,
  ReviewHistoryItem,
  ReviewIssue,
  ReviewJobDetail,
} from "@/features/reviews/types";

const SAMPLE_CODE = `export function checkout(cart: { price: number }[], user: any) {
  // TODO: validate inventory before charging
  let total = 0;
  for (const item in cart) {
    total += cart[item as any].price;
  }

  try {
    eval(user.couponScript);
  } catch (e) {}

  const API_KEY = "123";
  console.log("charging", user.password, API_KEY);
  document.body.innerHTML = "<h1>Paid " + total + "</h1>";
  return total;
}
`;

type ApiSuccess = {
  jobId: string;
  status: "SUCCEEDED";
  model: string;
  mock?: boolean;
  review: CodeReviewResult;
};

type ApiError = {
  error: string;
};

type CodeReviewWorkspaceProps = {
  initialHistory: ReviewHistoryItem[];
};

function inferLanguage(fileName: string): ReviewLanguage | null {
  const ext = fileName.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "ts":
    case "tsx":
      return "TypeScript";
    case "js":
    case "jsx":
      return "JavaScript";
    case "py":
      return "Python";
    case "rs":
      return "Rust";
    case "go":
      return "Go";
    case "java":
      return "Java";
    case "cs":
      return "C#";
    case "php":
      return "PHP";
    case "rb":
      return "Ruby";
    case "sql":
      return "SQL";
    default:
      return null;
  }
}

export function CodeReviewWorkspace({
  initialHistory,
}: CodeReviewWorkspaceProps) {
  const [code, setCode] = useState(SAMPLE_CODE);
  const [language, setLanguage] = useState<ReviewLanguage>("TypeScript");
  const [fileName, setFileName] = useState("checkout.ts");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [review, setReview] = useState<CodeReviewResult | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [model, setModel] = useState<string | null>(null);
  const [isMock, setIsMock] = useState(false);
  const [history, setHistory] =
    useState<ReviewHistoryItem[]>(initialHistory);

  const canReview = useMemo(
    () => code.trim().length >= 10 && !pending,
    [code, pending],
  );

  async function refreshHistory() {
    const response = await fetch("/api/reviews");
    if (!response.ok) return;
    const data = (await response.json()) as { history: ReviewHistoryItem[] };
    setHistory(data.history);
  }

  async function onReview() {
    setPending(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch("/api/generate/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language, fileName }),
      });

      const data = (await response.json()) as ApiSuccess | ApiError;

      if (!response.ok) {
        setError("error" in data ? data.error : "Review failed.");
        return;
      }

      if ("review" in data) {
        setReview(data.review);
        setJobId(data.jobId);
        setModel(data.model);
        setIsMock(Boolean(data.mock));
        setSuccessMessage(
          data.mock
            ? "Mock review completed and saved to history."
            : "AI review completed and saved to history.",
        );
        await refreshHistory();
      }
    } catch {
      setError("Network error while running code review.");
    } finally {
      setPending(false);
    }
  }

  async function onSelectHistory(selectedJobId: string) {
    setPending(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(`/api/reviews?jobId=${selectedJobId}`);
      const data = (await response.json()) as ReviewJobDetail & {
        error?: string;
      };

      if (!response.ok) {
        setError(data.error ?? "Unable to load review.");
        return;
      }

      if (data.review) {
        setReview(data.review);
        setJobId(data.jobId);
        setModel(data.model);
        setIsMock(Boolean(data.mock));
        setSuccessMessage("Previous review reopened.");
      } else {
        setError("This review has no saved result payload.");
      }
    } catch {
      setError("Network error while loading history.");
    } finally {
      setPending(false);
    }
  }

  async function onDeleteHistory(selectedJobId: string) {
    const response = await fetch(`/api/reviews?jobId=${selectedJobId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      setError("Unable to delete review.");
      return;
    }

    if (jobId === selectedJobId) {
      setReview(null);
      setJobId(null);
      setModel(null);
      setSuccessMessage(null);
    }

    await refreshHistory();
  }

  function applyIssueFix(issue: ReviewIssue) {
    if (!issue.beforeCode.trim()) {
      setCode((current) => `${current}\n\n${issue.afterCode}`);
      setSuccessMessage("AI fix appended to the editor.");
      return;
    }

    if (code.includes(issue.beforeCode)) {
      setCode((current) => current.replace(issue.beforeCode, issue.afterCode));
      setSuccessMessage(`Applied fix for ${issue.category}.`);
      return;
    }

    const firstLine = issue.beforeCode.split("\n")[0]?.trim();
    if (firstLine && code.includes(firstLine)) {
      setCode((current) => current.replace(firstLine, issue.afterCode));
      setSuccessMessage(`Applied partial fix for ${issue.category}.`);
      return;
    }

    setCode((current) => `${current}\n\n// AI fix (${issue.category})\n${issue.afterCode}`);
    setSuccessMessage(`AI fix for ${issue.category} appended to the editor.`);
  }

  function applyAllFixes() {
    if (!review) return;
    let next = code;
    for (const issue of review.issues) {
      if (issue.beforeCode && next.includes(issue.beforeCode)) {
        next = next.replace(issue.beforeCode, issue.afterCode);
      }
    }
    setCode(next);
    setSuccessMessage("Applied available AI fixes to the editor (mock).");
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="AI Code Review"
        description="Enterprise-grade analysis with scored findings, before/after diffs, history analytics, and exportable recommendations."
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(340px,0.85fr)]">
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Source input</CardTitle>
              <CardDescription>
                Monaco editor · language selector · drag & drop upload
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <Select
                    id="language"
                    value={language}
                    disabled={pending}
                    onChange={(event) =>
                      setLanguage(event.target.value as ReviewLanguage)
                    }
                    aria-label="Programming language"
                  >
                    {REVIEW_LANGUAGES.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fileName">File name</Label>
                  <input
                    id="fileName"
                    value={fileName}
                    disabled={pending}
                    onChange={(event) => setFileName(event.target.value)}
                    aria-label="Source file name"
                    className="flex h-10 w-full rounded-md border border-border bg-elevated px-3 text-sm text-foreground outline-none transition focus:border-zinc-500 focus-visible:ring-2 focus-visible:ring-zinc-500 disabled:opacity-50"
                  />
                </div>
              </div>

              <FileDropzone
                disabled={pending}
                onFileLoaded={({ content, fileName: nextName }) => {
                  setCode(content);
                  setFileName(nextName);
                  const inferred = inferLanguage(nextName);
                  if (inferred) setLanguage(inferred);
                }}
              />

              <CodeEditor
                value={code}
                language={language}
                onChange={setCode}
              />

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
                onClick={onReview}
                disabled={!canReview}
                className="w-full sm:w-auto"
                aria-label="Run AI code review"
              >
                {pending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Analyzing…
                  </>
                ) : (
                  <>
                    <ScanSearch className="h-4 w-4" />
                    Review code
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {pending && !review ? <ReviewLoadingState /> : null}

          {pending && review ? <ReviewLoadingState /> : null}

          {!pending && review && jobId ? (
            <ReviewResults
              review={review}
              reviewId={jobId}
              model={model}
              mock={isMock}
              onApplyAllFixes={applyAllFixes}
              onApplyIssueFix={applyIssueFix}
            />
          ) : null}

          {!pending && !review ? (
            <Card>
              <CardContent className="flex min-h-[200px] flex-col items-center justify-center text-center">
                <ScanSearch className="mb-3 h-5 w-5 text-muted-foreground" aria-hidden />
                <p className="text-sm font-medium text-foreground">
                  Ready for your first review
                </p>
                <p className="mt-1 max-w-md text-xs leading-relaxed text-muted-foreground">
                  Paste or upload source code, then run analysis to unlock scored
                  summaries, category progress, diffs, exports, and history charts.
                </p>
              </CardContent>
            </Card>
          ) : null}
        </div>

        <div className="space-y-5">
          <ReviewHistory
            items={history}
            activeJobId={jobId}
            onSelect={onSelectHistory}
            onDelete={onDeleteHistory}
          />
          <ReviewCharts history={history} />
        </div>
      </div>
    </div>
  );
}
