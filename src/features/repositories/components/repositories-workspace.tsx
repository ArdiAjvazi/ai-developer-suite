"use client";

import { useMemo, useState, useTransition } from "react";
import { CheckCircle2, FolderGit2, Loader2, Upload } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { PageHeader } from "@/shared/components/ui/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { cn } from "@/shared/lib/cn";
import { parseGitHubUrl } from "@/features/repositories/lib/parse-github-url";
import { RepoHealthScore } from "@/features/repositories/components/repo-health-score";
import { RepoStackCard } from "@/features/repositories/components/repo-stack-card";
import { RepoStatsCards } from "@/features/repositories/components/repo-stats-cards";
import { RepoFolderTree } from "@/features/repositories/components/repo-folder-tree";
import { RepoDependencies } from "@/features/repositories/components/repo-dependencies";
import { RepoMetadata } from "@/features/repositories/components/repo-metadata";
import { RepoQuickActions } from "@/features/repositories/components/repo-quick-actions";
import { RepoHistory } from "@/features/repositories/components/repo-history";
import { RepoLoadingState } from "@/features/repositories/components/repo-loading-state";
import type {
  RepositoryHistoryItem,
  RepositoryRecord,
} from "@/features/repositories/types";

type RepositoriesWorkspaceProps = {
  initialHistory: RepositoryHistoryItem[];
  initialRepository?: RepositoryRecord | null;
};

export function RepositoriesWorkspace({
  initialHistory,
  initialRepository = null,
}: RepositoriesWorkspaceProps) {
  const [url, setUrl] = useState(
    initialRepository?.htmlUrl ?? "https://github.com/vercel/next.js",
  );
  const [history, setHistory] = useState(initialHistory);
  const [repository, setRepository] = useState<RepositoryRecord | null>(
    initialRepository,
  );
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [zipNotice, setZipNotice] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [importing, setImporting] = useState(false);

  const urlHint = useMemo(() => {
    const parsed = parseGitHubUrl(url);
    if (!url.trim()) return "Paste a public GitHub repository URL.";
    if (!parsed) return "Invalid URL format. Example: https://github.com/vercel/next.js";
    return `Ready to import ${parsed.fullName}`;
  }, [url]);

  function upsertHistory(repo: RepositoryRecord) {
    const item: RepositoryHistoryItem = {
      id: repo.id,
      fullName: repo.fullName,
      name: repo.name,
      owner: repo.owner,
      createdAt: repo.createdAt,
      primaryLanguage: repo.primaryLanguage,
      framework: repo.analysis?.stack.framework ?? null,
      status: repo.status,
      healthScore: repo.analysis?.health.overall ?? null,
      mock: repo.mock,
    };
    setHistory((prev) => [item, ...prev.filter((h) => h.id !== item.id)]);
  }

  async function importUrl(targetUrl: string) {
    setError(null);
    setSuccessMessage(null);
    setZipNotice(null);

    const parsed = parseGitHubUrl(targetUrl);
    if (!parsed) {
      setError(
        "Invalid GitHub repository URL. Example: https://github.com/vercel/next.js",
      );
      return;
    }

    setImporting(true);
    try {
      const res = await fetch("/api/repositories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: targetUrl }),
      });
      const data = (await res.json()) as {
        repository?: RepositoryRecord;
        error?: string;
      };

      if (!res.ok || !data.repository) {
        setError(data.error ?? "Failed to import repository.");
        return;
      }

      setRepository(data.repository);
      upsertHistory(data.repository);
      setSuccessMessage(
        data.repository.mock
          ? `Imported ${data.repository.fullName} with mock analysis (GitHub API unavailable).`
          : `Successfully imported ${data.repository.fullName}.`,
      );
    } catch {
      setError("Network failure while importing the repository.");
    } finally {
      setImporting(false);
    }
  }

  async function loadRepository(id: string) {
    setError(null);
    setImporting(true);
    try {
      const res = await fetch(`/api/repositories?id=${encodeURIComponent(id)}`);
      const data = (await res.json()) as {
        repository?: RepositoryRecord;
        error?: string;
      };
      if (!res.ok || !data.repository) {
        setError(data.error ?? "Repository not found.");
        return;
      }
      setRepository(data.repository);
      setUrl(data.repository.htmlUrl);
      setSuccessMessage(`Loaded ${data.repository.fullName}.`);
    } catch {
      setError("Network failure while loading repository details.");
    } finally {
      setImporting(false);
    }
  }

  async function refreshRepository() {
    if (!repository) return;
    setImporting(true);
    setError(null);
    try {
      const res = await fetch("/api/repositories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "refresh", id: repository.id }),
      });
      const data = (await res.json()) as {
        repository?: RepositoryRecord;
        error?: string;
      };
      if (!res.ok || !data.repository) {
        setError(data.error ?? "Failed to refresh repository.");
        return;
      }
      setRepository(data.repository);
      upsertHistory(data.repository);
      setSuccessMessage(`Refreshed ${data.repository.fullName}.`);
    } catch {
      setError("Network failure while refreshing repository.");
    } finally {
      setImporting(false);
    }
  }

  async function deleteRepository(id: string) {
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/repositories?id=${encodeURIComponent(id)}`, {
          method: "DELETE",
        });
        if (!res.ok) {
          const data = (await res.json()) as { error?: string };
          setError(data.error ?? "Failed to delete repository.");
          return;
        }
        setHistory((prev) => prev.filter((h) => h.id !== id));
        if (repository?.id === id) {
          setRepository(null);
          setSuccessMessage("Repository deleted.");
        } else {
          setSuccessMessage("Repository removed from history.");
        }
      } catch {
        setError("Network failure while deleting repository.");
      }
    });
  }

  const busy = importing || pending;
  const analysis = repository?.analysis ?? null;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Repository Import & Analysis"
        description="Import a public GitHub repository, inspect stack and health, then launch Code Review, Documentation, README, or PDF Reports."
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderGit2 className="h-4 w-4" aria-hidden />
                Import methods
              </CardTitle>
              <CardDescription>
                Paste a GitHub URL or upload a ZIP project (coming soon)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="github-url">GitHub repository URL</Label>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input
                    id="github-url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://github.com/vercel/next.js"
                    aria-invalid={Boolean(error && !parseGitHubUrl(url))}
                    aria-describedby="github-url-hint"
                    disabled={busy}
                  />
                  <Button
                    type="button"
                    onClick={() => void importUrl(url)}
                    disabled={busy}
                    className="sm:shrink-0"
                    aria-label="Import GitHub repository"
                  >
                    {busy ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <FolderGit2 className="h-4 w-4" />
                    )}
                    Import
                  </Button>
                </div>
                <p
                  id="github-url-hint"
                  className={cn(
                    "text-xs",
                    parseGitHubUrl(url)
                      ? "text-muted-foreground"
                      : "text-amber-300",
                  )}
                >
                  {urlHint}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Upload ZIP project</Label>
                <label
                  className={cn(
                    "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-8 text-center transition",
                    "border-border bg-elevated/20 hover:border-zinc-600",
                  )}
                >
                  <Upload className="h-5 w-5 text-muted-foreground" aria-hidden />
                  <span className="text-sm text-foreground">
                    Drop a .zip project here
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Placeholder — ZIP import backend is not implemented yet
                  </span>
                  <input
                    type="file"
                    accept=".zip,application/zip"
                    className="sr-only"
                    aria-label="Upload ZIP project placeholder"
                    onChange={() =>
                      setZipNotice(
                        "ZIP project upload is coming soon. Use a GitHub URL for now.",
                      )
                    }
                  />
                </label>
                {zipNotice ? (
                  <p className="text-xs text-amber-300" role="status">
                    {zipNotice}
                  </p>
                ) : null}
              </div>

              {error ? (
                <div
                  className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200"
                  role="alert"
                >
                  {error}
                </div>
              ) : null}
              {successMessage ? (
                <div
                  className="flex items-start gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200"
                  role="status"
                >
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                  <span>{successMessage}</span>
                </div>
              ) : null}
            </CardContent>
          </Card>

          {busy && !analysis ? <RepoLoadingState /> : null}

          {!busy && !repository ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
                <FolderGit2 className="h-8 w-8 text-muted-foreground" aria-hidden />
                <p className="text-sm font-medium text-foreground">
                  No repository selected
                </p>
                <p className="max-w-md text-sm text-muted-foreground">
                  Import a public GitHub repository to open the analysis center —
                  metadata, stack detection, health score, folder tree, and quick
                  actions.
                </p>
              </CardContent>
            </Card>
          ) : null}

          {repository && analysis ? (
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="space-y-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold tracking-tight text-foreground">
                      {repository.fullName}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {repository.description ?? "No description"}
                    </p>
                  </div>
                  {repository.mock ? (
                    <span className="rounded-md border border-amber-500/40 bg-amber-500/10 px-2 py-1 text-[11px] uppercase tracking-wider text-amber-200">
                      Mock mode
                    </span>
                  ) : null}
                </div>
                <RepoQuickActions
                  repository={repository}
                  pending={busy}
                  onRefresh={() => void refreshRepository()}
                  onDelete={() => void deleteRepository(repository.id)}
                />
              </div>

              <RepoStatsCards statistics={analysis.statistics} />

              <div className="grid gap-4 lg:grid-cols-2">
                <RepoHealthScore health={analysis.health} />
                <RepoStackCard stack={analysis.stack} />
              </div>

              <RepoMetadata repository={repository} />
              <RepoFolderTree tree={analysis.tree} />
              <RepoDependencies dependencies={analysis.dependencies} />

              {analysis.statistics.languagesUsed ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Languages used</CardTitle>
                    <CardDescription>Byte distribution from repository analysis</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="grid gap-2 sm:grid-cols-2">
                      {Object.entries(analysis.statistics.languagesUsed)
                        .sort((a, b) => b[1] - a[1])
                        .map(([lang, bytes]) => (
                          <li
                            key={lang}
                            className="flex items-center justify-between rounded-lg border border-border bg-elevated/40 px-3 py-2 text-sm"
                          >
                            <span className="font-medium text-foreground">{lang}</span>
                            <span className="text-muted-foreground">
                              {bytes.toLocaleString()} bytes
                            </span>
                          </li>
                        ))}
                    </ul>
                  </CardContent>
                </Card>
              ) : null}
            </div>
          ) : null}

          {busy && repository ? <RepoLoadingState /> : null}
        </div>

        <div className="space-y-4 xl:sticky xl:top-6 xl:self-start">
          <RepoHistory
            history={history}
            selectedId={repository?.id ?? null}
            pending={busy}
            onSelect={(id) => void loadRepository(id)}
            onDelete={(id) => void deleteRepository(id)}
            onReimport={(item) =>
              void importUrl(`https://github.com/${item.fullName}`)
            }
          />
        </div>
      </div>
    </div>
  );
}
