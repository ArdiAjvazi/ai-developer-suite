"use client";

import { useMemo, useState } from "react";
import { Check, Copy, Loader2, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/shared/components/ui/button";
import { Label } from "@/shared/components/ui/label";
import { Select } from "@/shared/components/ui/select";
import { Textarea } from "@/shared/components/ui/textarea";
import { PageHeader } from "@/shared/components/ui/page-header";
import {
  TECH_STACKS,
  type GenerateReadmeInput,
} from "@/features/readme/schemas/generate-readme";

type ApiSuccess = {
  jobId: string;
  status: "SUCCEEDED";
  markdown: string;
  model: string;
  mock?: boolean;
};

type ApiError = {
  error: string;
  status?: "FAILED";
};

export function ReadmeGenerator() {
  const [description, setDescription] = useState("");
  const [stack, setStack] =
    useState<GenerateReadmeInput["stack"]>("Next.js");
  const [markdown, setMarkdown] = useState("");
  const [model, setModel] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [isMock, setIsMock] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [copied, setCopied] = useState(false);

  const canGenerate = useMemo(
    () => description.trim().length >= 20 && !pending,
    [description, pending],
  );

  async function onGenerate() {
    setPending(true);
    setError(null);
    setCopied(false);

    try {
      const response = await fetch("/api/generate/readme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description, stack }),
      });

      const data = (await response.json()) as ApiSuccess | ApiError;

      if (!response.ok) {
        setError("error" in data ? data.error : "Generation failed.");
        return;
      }

      if ("markdown" in data) {
        setMarkdown(data.markdown);
        setModel(data.model);
        setJobId(data.jobId);
        setIsMock(Boolean(data.mock));
      }
    } catch {
      setError("Network error while generating README.");
    } finally {
      setPending(false);
    }
  }

  async function onCopy() {
    if (!markdown) return;
    await navigator.clipboard.writeText(markdown);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="README Generator"
        description="Paste project context, pick a stack, and generate a polished GitHub-ready README."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-5 rounded-xl border border-border bg-surface p-5">
          <div className="space-y-2">
            <Label htmlFor="stack">Technology stack</Label>
            <Select
              id="stack"
              value={stack}
              onChange={(event) =>
                setStack(event.target.value as GenerateReadmeInput["stack"])
              }
              disabled={pending}
            >
              {TECH_STACKS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Project description / source</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              disabled={pending}
              placeholder="Describe the product, key features, install steps, scripts, and any code snippets that should inform the README…"
              className="min-h-[280px] font-mono text-[13px] leading-relaxed"
            />
            <p className="text-[11px] text-muted-foreground">
              {description.trim().length}/20,000 · minimum 20 characters
            </p>
          </div>

          {error ? (
            <p className="rounded-md border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-300">
              {error}
            </p>
          ) : null}

          <Button
            type="button"
            onClick={onGenerate}
            disabled={!canGenerate}
            className="w-full sm:w-auto"
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
        </section>

        <section className="flex min-h-[420px] flex-col rounded-xl border border-border bg-surface">
          <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
            <div>
              <p className="text-sm font-medium text-foreground">Preview</p>
              <p className="text-[11px] text-muted-foreground">
                {model
                  ? `${isMock ? "Mock mode · " : ""}${model}${jobId ? ` · Job ${jobId.slice(0, 8)}` : ""}`
                  : "Generated Markdown appears here"}
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onCopy}
              disabled={!markdown}
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  Copy
                </>
              )}
            </Button>
          </div>

          <div className="flex-1 overflow-auto p-5">
            {markdown ? (
              <article className="readme-preview space-y-4 text-sm leading-relaxed text-zinc-300">
                <ReactMarkdown
                  components={{
                    h1: ({ children }) => (
                      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                        {children}
                      </h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="mt-6 border-b border-border pb-2 text-lg font-semibold text-foreground">
                        {children}
                      </h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="mt-4 text-base font-medium text-foreground">
                        {children}
                      </h3>
                    ),
                    p: ({ children }) => <p className="text-zinc-300">{children}</p>,
                    ul: ({ children }) => (
                      <ul className="list-disc space-y-1 pl-5 text-zinc-300">
                        {children}
                      </ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="list-decimal space-y-1 pl-5 text-zinc-300">
                        {children}
                      </ol>
                    ),
                    code: ({ children, className }) => {
                      const isBlock = Boolean(className);
                      if (isBlock) {
                        return (
                          <code className="block overflow-x-auto rounded-md border border-border bg-elevated p-3 font-mono text-[12px] text-zinc-200">
                            {children}
                          </code>
                        );
                      }
                      return (
                        <code className="rounded bg-elevated px-1.5 py-0.5 font-mono text-[12px] text-zinc-200">
                          {children}
                        </code>
                      );
                    },
                    pre: ({ children }) => (
                      <pre className="overflow-x-auto rounded-md border border-border bg-elevated p-0">
                        {children}
                      </pre>
                    ),
                    a: ({ href, children }) => (
                      <a
                        href={href}
                        className="text-zinc-100 underline underline-offset-2"
                        target="_blank"
                        rel="noreferrer"
                      >
                        {children}
                      </a>
                    ),
                  }}
                >
                  {markdown}
                </ReactMarkdown>
              </article>
            ) : (
              <div className="flex h-full min-h-[320px] flex-col items-center justify-center text-center">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-elevated">
                  <Sparkles className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground">
                  No README yet
                </p>
                <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                  Generate from the form to preview Markdown here with one-click
                  copy.
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
