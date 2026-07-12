import { cn } from "@/shared/lib/cn";
import type { ReviewSeverity } from "@/features/reviews/schemas/generate-review";

const severityStyles: Record<ReviewSeverity, string> = {
  High: "border-red-500/30 bg-red-500/10 text-red-300",
  Medium: "border-amber-500/30 bg-amber-500/10 text-amber-200",
  Low: "border-zinc-500/30 bg-zinc-500/10 text-zinc-300",
};

type SeverityBadgeProps = {
  severity: ReviewSeverity;
  className?: string;
};

export function SeverityBadge({ severity, className }: SeverityBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
        severityStyles[severity],
        className,
      )}
    >
      {severity}
    </span>
  );
}
