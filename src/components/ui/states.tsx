import type { ReactNode } from "react";
import { Loader2, SearchX, CircleCheck, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./Button";

export function EmptyState({
  icon,
  title,
  desc,
  action,
  className,
}: {
  icon?: ReactNode;
  title: ReactNode;
  desc?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center px-6 py-14 text-center", className)}>
      <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-surface-2 text-muted">
        {icon ?? <SearchX className="size-6" aria-hidden />}
      </div>
      <p className="text-base font-semibold text-content">{title}</p>
      {desc && <p className="mt-1.5 max-w-sm text-sm text-muted">{desc}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function LoadingState({
  title,
  desc,
  className,
}: {
  title: ReactNode;
  desc?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center px-6 py-14 text-center", className)}>
      <Loader2 className="mb-4 size-7 animate-spin text-primary" aria-hidden />
      <p className="text-base font-semibold text-content">{title}</p>
      {desc && <p className="mt-1.5 max-w-sm text-sm text-muted">{desc}</p>}
    </div>
  );
}

export function SuccessState({
  title,
  desc,
  action,
  className,
}: {
  title: ReactNode;
  desc?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center px-6 py-14 text-center", className)}>
      <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-success-soft text-success">
        <CircleCheck className="size-7" aria-hidden />
      </div>
      <p className="text-base font-semibold text-content">{title}</p>
      {desc && <p className="mt-1.5 max-w-sm text-sm text-muted">{desc}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({
  title,
  desc,
  onRetry,
  action,
  className,
}: {
  title: ReactNode;
  desc?: ReactNode;
  onRetry?: () => void;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center px-6 py-14 text-center", className)}>
      <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-danger-soft text-danger">
        <TriangleAlert className="size-7" aria-hidden />
      </div>
      <p className="text-base font-semibold text-content">{title}</p>
      {desc && <p className="mt-1.5 max-w-sm text-sm text-muted">{desc}</p>}
      {(onRetry || action) && (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          {action}
          {onRetry && <Button variant="secondary" onClick={onRetry}>{/* label set by caller via action */}Retry</Button>}
        </div>
      )}
    </div>
  );
}
