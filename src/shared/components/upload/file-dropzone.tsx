"use client";

import { useCallback, useState } from "react";
import { Upload } from "lucide-react";
import { cn } from "@/shared/lib/cn";

type FileDropzoneProps = {
  onFileLoaded: (payload: { content: string; fileName: string }) => void;
  disabled?: boolean;
  accept?: string;
  label?: string;
};

const DEFAULT_ACCEPTED =
  ".ts,.tsx,.js,.jsx,.py,.rs,.go,.java,.cs,.php,.rb,.sql,.prisma,.txt,.md";

export function FileDropzone({
  onFileLoaded,
  disabled,
  accept = DEFAULT_ACCEPTED,
  label = "Drop a source file here",
}: FileDropzoneProps) {
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const readFile = useCallback(
    async (file: File) => {
      if (file.size > 512_000) {
        setError("File is too large (max 512KB for V1).");
        return;
      }

      const content = await file.text();
      setError(null);
      onFileLoaded({ content, fileName: file.name });
    },
    [onFileLoaded],
  );

  return (
    <div className="space-y-2">
      <label
        onDragEnter={(event) => {
          event.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={(event) => {
          event.preventDefault();
          setDragging(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          if (disabled) return;
          const file = event.dataTransfer.files?.[0];
          if (file) void readFile(file);
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-6 text-center transition",
          dragging
            ? "border-zinc-400 bg-elevated"
            : "border-border bg-elevated/40 hover:border-zinc-600 hover:bg-elevated/70",
          disabled && "pointer-events-none opacity-50",
        )}
      >
        <Upload className="h-4 w-4 text-muted-foreground" aria-hidden />
        <div>
          <p className="text-sm font-medium text-foreground">{label}</p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            or click to browse · {accept}
          </p>
        </div>
        <input
          type="file"
          accept={accept}
          className="hidden"
          disabled={disabled}
          aria-label={label}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void readFile(file);
            event.target.value = "";
          }}
        />
      </label>
      {error ? (
        <p className="text-xs text-red-300" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
