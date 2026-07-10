import { cn } from "@/shared/lib/cn";
import type { TextareaHTMLAttributes } from "react";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export function Textarea({ className, ...props }: TextareaProps) {
  return (
    <textarea
      className={cn(
        "flex min-h-[140px] w-full rounded-md border border-border bg-elevated px-3 py-2 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/60 focus:border-zinc-500 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
