"use client";

import { useRef } from "react";
import { X, ArrowUp, ArrowDown, Plus, FileText, Image as ImageIcon, Music, Film, FileType2 } from "lucide-react";
import { removeFile, reorderFiles, formatMeta, useWorkspace, addFiles } from "@/lib/store/workspace-store";
import { useI18n } from "@/lib/i18n/provider";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { cn, formatBytes } from "@/lib/utils";

function CategoryIcon({ category, className }: { category?: string; className?: string }) {
  const cls = cn("size-5", className);
  if (category === "image") return <ImageIcon className={cls} aria-hidden />;
  if (category === "audio") return <Music className={cls} aria-hidden />;
  if (category === "video") return <Film className={cls} aria-hidden />;
  if (category === "text") return <FileType2 className={cls} aria-hidden />;
  return <FileText className={cls} aria-hidden />;
}

export function FileList() {
  const { t, fmt } = useI18n();
  const { files, busyAnalyzing } = useWorkspace();
  const inputRef = useRef<HTMLInputElement>(null);
  const multi = files.length > 1;

  return (
    <div className="rounded-2xl border border-line bg-surface shadow-sm">
      <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-3">
        <div>
          <h3 className="text-sm font-bold text-content">{t.workspace.source}</h3>
          <p className="text-xs text-muted">
            {fmt(t.workspace.multiFileLabel, { n: files.length })} · {fmt(t.workspace.totalSize, { size: formatBytes(files.reduce((s, f) => s + f.size, 0)) })}
          </p>
        </div>
        {multi && <span className="text-[11px] font-semibold uppercase tracking-wide text-faint">{t.common.reorder}</span>}
      </div>

      <ul className="max-h-[420px] divide-y divide-line overflow-y-auto scrollbar-thin">
        {files.map((f, i) => {
          const ext = f.meta?.ext ?? f.name.split(".").pop()?.toLowerCase() ?? "";
          const preview = f.meta?.preview ?? f.previewUrl;
          return (
            <li key={f.id} className="group flex items-center gap-3 px-4 py-3">
              <div className="relative size-11 shrink-0 overflow-hidden rounded-lg border border-line bg-surface-2">
                {preview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={preview} alt="" className="size-full object-cover" />
                ) : (
                  <div className="flex size-full flex-col items-center justify-center text-muted">
                    <CategoryIcon category={f.meta?.category} className="size-4" />
                    <span className="mt-0.5 text-[9px] font-bold uppercase">{ext}</span>
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-content">{f.name}</p>
                <p className="truncate text-xs text-muted">
                  {formatBytes(f.size)}
                  {f.meta ? ` · ${formatMeta(f.meta)}` : ""}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-1">
                {f.status === "failed" ? (
                  <Badge tone="danger">{t.workspace.detectError}</Badge>
                ) : (
                  <>
                    {multi && (
                      <div className="flex flex-col">
                        <button
                          type="button"
                          aria-label="Move up"
                          onClick={() => reorderFiles(i, i - 1)}
                          disabled={i === 0}
                          className="rounded p-0.5 text-faint transition-colors hover:text-content disabled:opacity-30"
                        >
                          <ArrowUp className="size-3.5" aria-hidden />
                        </button>
                        <button
                          type="button"
                          aria-label="Move down"
                          onClick={() => reorderFiles(i, i + 1)}
                          disabled={i === files.length - 1}
                          className="rounded p-0.5 text-faint transition-colors hover:text-content disabled:opacity-30"
                        >
                          <ArrowDown className="size-3.5" aria-hidden />
                        </button>
                      </div>
                    )}
                    <Badge
                      tone={
                        f.status === "done" ? "success" : f.status === "converting" ? "primary" : f.status === "pending" ? "warning" : "neutral"
                      }
                      dot={f.status !== "analyzed"}
                      className="hidden sm:inline-flex"
                    >
                      {f.status === "converting"
                        ? t.progress.converting
                        : f.status === "done"
                          ? t.result.successTitle
                          : f.status === "pending"
                            ? t.progress.uploading
                            : t.common.ready}
                    </Badge>
                    <button
                      type="button"
                      aria-label={t.common.remove}
                      onClick={() => removeFile(f.id)}
                      disabled={busyAnalyzing}
                      className="ml-1 rounded-lg p-1.5 text-faint transition-colors hover:bg-danger-soft hover:text-danger disabled:opacity-40"
                    >
                      <X className="size-4" aria-hidden />
                    </button>
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <div className="border-t border-line p-3">
        <Button variant="secondary" size="sm" className="w-full" icon={<Plus className="size-4" />} onClick={() => inputRef.current?.click()}>
          {t.common.addFiles}
        </Button>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="sr-only"
          onChange={(e) => {
            void addFiles(Array.from(e.target.files ?? []));
            e.target.value = "";
          }}
        />
      </div>
    </div>
  );
}
