import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Tone = "neutral" | "primary" | "success" | "warning" | "danger";

const tones: Record<Tone, string> = {
  neutral: "bg-surface-2 text-muted border border-line",
  primary: "bg-primary-soft text-primary-dark dark:text-primary",
  success: "bg-success-soft text-success dark:text-[#4ade80]",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger dark:text-[#fca5a5]",
};

export function Badge({
  children,
  tone = "neutral",
  className,
  dot,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
  dot?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap",
        tones[tone],
        className
      )}
    >
      {dot && <span className="size-1.5 rounded-full bg-current" aria-hidden />}
      {children}
    </span>
  );
}
