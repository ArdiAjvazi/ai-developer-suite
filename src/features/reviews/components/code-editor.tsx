"use client";

import dynamic from "next/dynamic";
import { cn } from "@/shared/lib/cn";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[320px] items-center justify-center rounded-md border border-border bg-elevated text-xs text-muted-foreground">
      Loading editor…
    </div>
  ),
});

const LANGUAGE_MAP: Record<string, string> = {
  TypeScript: "typescript",
  JavaScript: "javascript",
  Python: "python",
  Rust: "rust",
  Go: "go",
  Java: "java",
  "C#": "csharp",
  PHP: "php",
  Ruby: "ruby",
  SQL: "sql",
};

type CodeEditorProps = {
  value: string;
  language: string;
  onChange: (value: string) => void;
  className?: string;
  readOnly?: boolean;
};

export function CodeEditor({
  value,
  language,
  onChange,
  className,
  readOnly = false,
}: CodeEditorProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-md border border-border bg-[#0d0d0f]",
        className,
      )}
    >
      <MonacoEditor
        height="360px"
        theme="vs-dark"
        language={LANGUAGE_MAP[language] ?? "typescript"}
        value={value}
        onChange={(next) => onChange(next ?? "")}
        options={{
          readOnly,
          minimap: { enabled: false },
          fontSize: 13,
          fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
          lineNumbers: "on",
          scrollBeyondLastLine: false,
          wordWrap: "on",
          automaticLayout: true,
          tabSize: 2,
          padding: { top: 12, bottom: 12 },
          renderLineHighlight: "line",
          overviewRulerLanes: 0,
        }}
      />
    </div>
  );
}
