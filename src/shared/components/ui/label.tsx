import { cn } from "@/shared/lib/cn";
import type { LabelHTMLAttributes } from "react";

type LabelProps = LabelHTMLAttributes<HTMLLabelElement>;

export function Label({ className, ...props }: LabelProps) {
  return (
    <label
      className={cn(
        "text-xs font-medium text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}
