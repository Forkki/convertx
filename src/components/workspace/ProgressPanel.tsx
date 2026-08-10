"use client";

import { Loader2, X } from "lucide-react";
import { useWorkspace, cancelConversion } from "@/lib/store/workspace-store";
import { useI18n } from "@/lib/i18n/provider";
import { ProgressBar, ProgressBarStyles } from "@/components/ui/ProgressBar";
import { Button } from "@/components/ui/Button";
import { formatBytes } from "@/lib/utils";

export function ProgressPanel() {
  const { t, fmt } = useI18n();
  const { progress, files } = useWorkspace();
  const { pct, label, file, fileIndex, fileCount, etaMs } = progress;
  const totalIn = files.reduce((s, f) => s + f.size, 0);

  return (
    <div className="mx-auto max-w-xl rounded-2xl border border-line bg-surface p-6 shadow-sm sm:p-8">
      <ProgressBarStyles />
      <div className="flex items-center gap-3">
        <div className="flex size-11 items-center justify-center rounded-2xl bg-primary-soft text-primary">
          <Loader2 className="size-5 animate-spin" aria-hidden />
        </div>
        <div className="min-w-0">
          <h3 className="text-base font-bold text-content">{t.progress.converting}</h3>
          <p className="truncate text-sm text-muted">
            {fileIndex >= 0 && fileCount > 0 ? fmt(t.progress.filesDone, { done: fileIndex + 1, total: fileCount }) : t.progress.preparing}
          </p>
        </div>
      </div>

      <div className="mt-6">
        <ProgressBar value={pct} ariaLabel={t.progress.overall} />
        <div className="mt-3 flex items-center justify-between gap-3 text-sm">
          <span className="truncate font-medium text-content">
            {label ?? t.progress.encoding}
            {file ? ` · ${file}` : ""}
          </span>
          <span className="shrink-0 font-semibold tabular-nums text-primary">{Math.round(pct)}%</span>
        </div>
        {etaMs !== undefined && etaMs > 0 && (
          <p className="mt-1 text-xs text-muted">{fmt(t.progress.eta, { time: formatEta(etaMs) })}</p>
        )}
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-line pt-4">
        <p className="text-xs text-faint">{formatBytes(totalIn)} {t.workspace.totalSize.replace("{size}", "").trim()}</p>
        <Button variant="ghost" size="sm" icon={<X className="size-4" />} onClick={cancelConversion}>
          {t.workspace.cancelAll}
        </Button>
      </div>
    </div>
  );
}

function formatEta(ms: number): string {
  const s = Math.max(1, Math.round(ms / 1000));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  return `${m}m ${s % 60}s`;
}
