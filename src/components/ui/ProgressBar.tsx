import { cn } from "@/lib/utils";

export function ProgressBar({
  value,
  className,
  indeterminate,
  ariaLabel,
}: {
  value?: number;
  className?: string;
  indeterminate?: boolean;
  ariaLabel?: string;
}) {
  const pct = Math.min(100, Math.max(0, value ?? 0));
  return (
    <div
      role="progressbar"
      aria-valuenow={indeterminate ? undefined : Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={ariaLabel}
      className={cn(
        "relative h-2 w-full overflow-hidden rounded-full bg-surface-3 dark:bg-surface-2",
        className
      )}
    >
      <div
        className={cn(
          "absolute inset-y-0 left-0 rounded-full bg-primary transition-[width] duration-200 ease-out",
          indeterminate && "indeterminate-bar"
        )}
        style={indeterminate ? undefined : { width: `${pct}%` }}
      />
    </div>
  );
}

const indeterminateCss = `
@keyframes indeterminate-sweep {
  0% { width: 18%; left: -18%; }
  100% { width: 40%; left: 100%; }
}
.indeterminate-bar {
  animation: indeterminate-sweep 1.1s ease-in-out infinite;
}
`;

export function ProgressBarStyles() {
  return <style dangerouslySetInnerHTML={{ __html: indeterminateCss }} />;
}
