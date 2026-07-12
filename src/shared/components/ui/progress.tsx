import { cn } from "@/shared/lib/cn";

type ProgressBarProps = {
  value: number;
  className?: string;
  indicatorClassName?: string;
  label?: string;
};

export function ProgressBar({
  value,
  className,
  indicatorClassName,
  label,
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <div
      className={cn("w-full", className)}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label ?? "Progress"}
    >
      <div className="h-2 overflow-hidden rounded-full bg-elevated">
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-700 ease-out",
            indicatorClassName ?? "bg-foreground",
          )}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
