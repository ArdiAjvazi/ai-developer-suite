import { cn } from "@/shared/lib/cn";
import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "secondary" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
};

const variants = {
  default:
    "bg-foreground text-background hover:opacity-90 disabled:opacity-60",
  secondary:
    "bg-elevated text-foreground border border-border hover:bg-zinc-800",
  outline:
    "border border-border bg-transparent text-foreground hover:bg-elevated",
  ghost: "bg-transparent text-muted-foreground hover:bg-elevated hover:text-foreground",
};

const sizes = {
  default: "h-10 px-4 text-sm",
  sm: "h-8 px-3 text-xs",
  lg: "h-11 px-5 text-sm",
  icon: "h-9 w-9",
};

export function Button({
  className,
  variant = "default",
  size = "default",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors disabled:pointer-events-none",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
}
