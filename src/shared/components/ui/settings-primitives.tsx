"use client";

import { cn } from "@/shared/lib/cn";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type TabsProps = {
  value: string;
  onValueChange: (value: string) => void;
  items: Array<{ value: string; label: string }>;
  className?: string;
};

export function Tabs({ value, onValueChange, items, className }: TabsProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap gap-1 rounded-xl border border-border bg-elevated/40 p-1",
        className,
      )}
      role="tablist"
      aria-label="Settings sections"
    >
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={active}
            className={cn(
              "rounded-lg px-3 py-2 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500",
              active
                ? "bg-surface text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
            onClick={() => onValueChange(item.value)}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

type SwitchProps = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
  label?: string;
};

export function Switch({
  checked,
  onCheckedChange,
  disabled,
  id,
  label,
}: SwitchProps) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 disabled:opacity-50",
        checked ? "border-zinc-400 bg-foreground" : "border-border bg-elevated",
      )}
    >
      <span
        className={cn(
          "inline-block h-4 w-4 transform rounded-full bg-background transition",
          checked ? "translate-x-6" : "translate-x-1",
        )}
      />
    </button>
  );
}

type SliderProps = {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onValueChange: (value: number) => void;
  disabled?: boolean;
  id?: string;
  label?: string;
};

export function Slider({
  value,
  min = 0,
  max = 100,
  step = 1,
  onValueChange,
  disabled,
  id,
  label,
}: SliderProps) {
  return (
    <input
      id={id}
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      disabled={disabled}
      aria-label={label}
      onChange={(event) => onValueChange(Number(event.target.value))}
      className="h-2 w-full cursor-pointer appearance-none rounded-full bg-elevated accent-foreground disabled:opacity-50"
    />
  );
}

type BadgeProps = {
  children: ReactNode;
  tone?: "default" | "success" | "warning" | "danger";
  className?: string;
};

export function Badge({ children, tone = "default", className }: BadgeProps) {
  const tones = {
    default: "border-border bg-elevated text-muted-foreground",
    success: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
    warning: "border-amber-500/40 bg-amber-500/10 text-amber-200",
    danger: "border-red-500/40 bg-red-500/10 text-red-300",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Separator({ className }: { className?: string }) {
  return <div className={cn("h-px w-full bg-border", className)} role="separator" />;
}

type AlertProps = {
  tone?: "info" | "success" | "error";
  children: ReactNode;
  className?: string;
};

export function Alert({ tone = "info", children, className }: AlertProps) {
  const tones = {
    info: "border-border bg-elevated/50 text-muted-foreground",
    success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
    error: "border-red-500/40 bg-red-500/10 text-red-200",
  };
  return (
    <div
      role="alert"
      className={cn("rounded-lg border px-3 py-2 text-sm", tones[tone], className)}
    >
      {children}
    </div>
  );
}

type DialogProps = {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
};

export function Dialog({ open, title, description, onClose, children }: DialogProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/60"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        className="relative z-10 w-full max-w-md rounded-xl border border-border bg-surface p-5 shadow-xl"
      >
        <h2 id="dialog-title" className="text-base font-semibold text-foreground">
          {title}
        </h2>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}

type ToastTone = "success" | "error" | "info";

export function ToastBanner({
  message,
  tone,
  onDismiss,
}: {
  message: string;
  tone: ToastTone;
  onDismiss: () => void;
}) {
  return (
    <div
      className={cn(
        "fixed bottom-4 right-4 z-50 flex max-w-sm items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-lg",
        tone === "success" && "border-emerald-500/40 bg-emerald-500/15 text-emerald-100",
        tone === "error" && "border-red-500/40 bg-red-500/15 text-red-100",
        tone === "info" && "border-border bg-surface text-foreground",
      )}
      role="status"
    >
      <span className="flex-1">{message}</span>
      <button
        type="button"
        className="text-xs text-muted-foreground hover:text-foreground"
        onClick={onDismiss}
        aria-label="Dismiss"
      >
        Close
      </button>
    </div>
  );
}

export function IconButton({
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-elevated text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500",
        className,
      )}
      {...props}
    />
  );
}
