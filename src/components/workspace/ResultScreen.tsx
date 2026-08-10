"use client";

import { Check, Download, FileArchive, History, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  useWorkspace,
  resetWorkspace,
  downloadOutput,
  downloadAllOutputs,
  downloadZipOutput,
} from "@/lib/store/workspace-store";
import { useI18n } from "@/lib/i18n/provider";
import { Button } from "@/components/ui/Button";
import { formatBytes, formatDuration } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";

export function ResultScreen() {
  const { t, fmt } = useI18n();
  const router = useRouter();
  const { result } = useWorkspace();
  if (!result) return null;

  return (
    <div className="mx-auto max-w-3xl">
      <AnimatePresence mode="wait">
        <motion.div
          key={result.jobId}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: "easeOut" }}
          className="overflow-hidden rounded-2xl border border-line bg-surface shadow-md"
        >
          <div className="relative overflow-hidden border-b border-line bg-hero-glow px-6 py-8 text-center">
            <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-success-soft text-success">
              <Check className="size-7" aria-hidden />
            </div>
            <h3 className="text-xl font-extrabold text-content sm:text-2xl">{t.result.successTitle}</h3>
            <p className="mt-1 text-sm text-muted">{fmt(t.result.allDone, { n: result.count })}</p>

            <div className="mx-auto mt-6 grid max-w-md grid-cols-3 gap-3">
              <Stat label={t.result.original} value={formatBytes(result.sourceTotal)} />
              <Stat label={t.result.output} value={formatBytes(result.outputTotal)} accent />
              <Stat label={t.result.duration} value={formatDuration(result.durationMs)} />
            </div>
          </div>

          <div className="p-5 sm:p-6">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-sm font-bold text-content">{t.result.output}</h4>
              <span className="text-xs font-semibold uppercase tracking-wide text-muted">
                {result.sourceExt.toUpperCase()} → {result.target.toUpperCase()}
              </span>
            </div>

            <ul className="max-h-[340px] space-y-2 overflow-y-auto scrollbar-thin">
              {result.outputs.map((o) => (
                <li
                  key={o.name}
                  className="group flex items-center gap-3 rounded-xl border border-line bg-surface-2/50 p-2.5 transition-colors hover:border-line-strong"
                >
                  <div className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-line bg-surface">
                    {o.preview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={o.preview} alt="" className="size-full object-cover" />
                    ) : (
                      <span className="px-1 text-[10px] font-bold uppercase text-muted">
                        {o.name.split(".").pop()}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-content">{o.name}</p>
                    <p className="text-xs text-muted">{formatBytes(o.size)}</p>
                  </div>
                  <Button variant="ghost" size="sm" icon={<Download className="size-4" />} onClick={() => downloadOutput(o)}>
                    {t.common.download}
                  </Button>
                </li>
              ))}
            </ul>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5 border-t border-line pt-5">
              {result.outputs.length > 1 && (
                <Button variant="secondary" icon={<Download className="size-4" />} onClick={downloadAllOutputs}>
                  {t.result.downloadAll}
                </Button>
              )}
              {result.zip && (
                <Button variant="secondary" icon={<FileArchive className="size-4" />} onClick={downloadZipOutput}>
                  {t.result.downloadZip}
                </Button>
              )}
              <Button
                variant="ghost"
                icon={<History className="size-4" />}
                onClick={() => router.push("/history")}
              >
                {t.result.viewHistory}
              </Button>
              <Button icon={<Plus className="size-4" />} onClick={resetWorkspace}>
                {t.result.convertAnother}
              </Button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-xl border border-line bg-surface px-3 py-2.5">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-faint">{label}</p>
      <p className={`mt-0.5 text-sm font-bold tabular-nums ${accent ? "text-primary" : "text-content"}`}>{value}</p>
    </div>
  );
}
