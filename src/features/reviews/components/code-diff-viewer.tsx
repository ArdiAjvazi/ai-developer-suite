"use client";

import { cn } from "@/shared/lib/cn";

type CodeDiffViewerProps = {
  beforeCode: string;
  afterCode: string;
  className?: string;
};

export function CodeDiffViewer({
  beforeCode,
  afterCode,
  className,
}: CodeDiffViewerProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border border-border bg-[#0d0d0f]",
        className,
      )}
      aria-label="Before and after code diff"
    >
      <div className="grid border-b border-border text-[11px] font-medium uppercase tracking-wider text-muted-foreground sm:grid-cols-2">
        <div className="border-b border-border px-3 py-2 sm:border-b-0 sm:border-r">
          Before
        </div>
        <div className="px-3 py-2">After</div>
      </div>
      <div className="grid sm:grid-cols-2">
        <pre className="overflow-x-auto border-b border-border p-3 font-mono text-[12px] leading-relaxed text-red-200/90 sm:border-b-0 sm:border-r sm:border-border">
          {beforeCode.split("\n").map((line, index) => (
            <div key={`before-${index}`} className="flex gap-2">
              <span className="select-none text-red-400/70">-</span>
              <span>{line || " "}</span>
            </div>
          ))}
        </pre>
        <pre className="overflow-x-auto p-3 font-mono text-[12px] leading-relaxed text-emerald-200/90">
          {afterCode.split("\n").map((line, index) => (
            <div key={`after-${index}`} className="flex gap-2">
              <span className="select-none text-emerald-400/70">+</span>
              <span>{line || " "}</span>
            </div>
          ))}
        </pre>
      </div>
    </div>
  );
}
