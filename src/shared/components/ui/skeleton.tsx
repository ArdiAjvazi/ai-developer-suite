import { cn } from "@/shared/lib/cn";

type SkeletonProps = {
  className?: string;
};

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-elevated/80",
        className,
      )}
      aria-hidden="true"
    />
  );
}
