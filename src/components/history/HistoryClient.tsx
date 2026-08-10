"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, FileArchive, Search, Trash2, Clock } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import {
  HISTORY_UPDATED_EVENT,
  listHistory,
  clearHistory,
  deleteHistory,
  downloadOutput,
  downloadZipRecord,
  type HistoryRecord,
} from "@/lib/store/history-store";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { cn, formatBytes, formatDuration } from "@/lib/utils";

const CATEGORY_KEYS = ["All", "PDF", "Images", "Documents", "Audio", "Video"];

export function HistoryClient() {
  const { t } = useI18n();
  const [records, setRecords] = useState<HistoryRecord[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const [confirmClear, setConfirmClear] = useState(false);

  const refresh = useCallback(() => {
    listHistory()
      .then((r) => {
        setRecords(r);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  useEffect(() => {
    refresh();
    window.addEventListener(HISTORY_UPDATED_EVENT, refresh);
    return () => window.removeEventListener(HISTORY_UPDATED_EVENT, refresh);
  }, [refresh]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return records
      .filter((r) => (filter === "All" ? true : r.category === filter.toLowerCase()))
      .filter((r) => !q || r.sourceName.toLowerCase().includes(q) || r.target.toLowerCase().includes(q));
  }, [records, query, filter]);

  const localizedFilters = t.history.filters;

  if (!loaded) {
    return <div className="mx-auto max-w-6xl px-4 py-20 text-center text-muted sm:px-6">…</div>;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-content sm:text-4xl">{t.history.title}</h1>
          <p className="mt-2 text-muted">{t.history.subtitle}</p>
        </div>
        {records.length > 0 && (
          <Button
            variant="danger"
            size="sm"
            icon={<Trash2 className="size-4" />}
            onClick={() => {
              if (!confirmClear) return setConfirmClear(true);
              void clearHistory().then(() => {
                setRecords([]);
                setConfirmClear(false);
              });
            }}
            onBlur={() => setTimeout(() => setConfirmClear(false), 2000)}
          >
            {confirmClear ? t.common.confirm : t.history.clearAll}
          </Button>
        )}
      </div>

      {records.length === 0 ? (
        <div className="mt-16 flex flex-col items-center gap-2 text-center">
          <Clock className="size-10 text-faint" aria-hidden />
          <p className="font-bold text-content">{t.history.empty}</p>
          <p className="text-sm text-muted">{t.history.emptyDesc}</p>
        </div>
      ) : (
        <>
          <div className="mt-6 flex flex-wrap items-center gap-2.5">
            <div className="relative w-full sm:max-w-xs">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-faint" aria-hidden />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t.history.searchPlaceholder}
                aria-label={t.history.searchPlaceholder}
                className="h-11 w-full rounded-xl border border-line bg-surface pl-10 pr-4 text-[15px] font-medium text-content transition-colors hover:border-line-strong focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-primary/50"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORY_KEYS.map((key, i) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFilter(key)}
                  aria-pressed={filter === key}
                  className={cn(
                    "rounded-xl border px-3 py-2 text-sm font-semibold transition-colors",
                    filter === key
                      ? "border-primary bg-primary-soft text-primary-dark dark:text-primary"
                      : "border-line bg-surface text-muted hover:border-line-strong hover:text-content"
                  )}
                >
                  {localizedFilters[i]}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {filtered.map((record) => (
              <div key={record.id} className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-bold text-content">{record.sourceName}</p>
                      <Badge tone={record.status === "done" ? "success" : "danger"}>
                        {record.status === "done" ? t.history.statusDone : t.history.statusFailed}
                      </Badge>
                    </div>
                    <p className="mt-0.5 text-xs text-muted">
                      {record.fromLabel} → {record.toLabel} · {formatBytes(record.sourceSize)} ·{" "}
                      {new Date(record.date).toLocaleString()} · {formatDuration(record.durationMs)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="hidden text-xs font-semibold text-muted sm:inline">
                      {record.outputs.length} {t.history.outputs}
                    </span>
                    {record.zip && (
                      <Button variant="secondary" size="sm" icon={<FileArchive className="size-4" />} onClick={() => downloadZipRecord(record)}>
                        {t.common.downloadZip}
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" icon={<Download className="size-4" />} onClick={() => downloadOutput(record, record.outputs[0])}>
                      {t.history.downloadAgain}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={t.common.delete}
                      className="text-faint hover:bg-danger-soft hover:text-danger"
                      onClick={() => void deleteHistory(record.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>

                {record.outputs.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5 border-t border-line pt-3">
                    {record.outputs.map((o) => (
                      <button
                        key={o.name}
                        type="button"
                        onClick={() => downloadOutput(record, o)}
                        className="group flex items-center gap-1.5 rounded-lg bg-surface-2 px-2.5 py-1.5 text-xs font-semibold text-muted transition-colors hover:bg-primary-soft hover:text-primary-dark dark:hover:text-primary"
                      >
                        <span className="max-w-[180px] truncate">{o.name}</span>
                        <Download className="size-3.5 opacity-60 transition-opacity group-hover:opacity-100" aria-hidden />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {filtered.length === 0 && (
              <p className="py-12 text-center text-muted">{t.common.noResults}</p>
            )}
          </div>
        </>
      )}

      {records.length > 0 && (
        <p className="mt-6 text-center text-xs text-faint">{t.history.savedOnDevice}</p>
      )}
    </div>
  );
}
