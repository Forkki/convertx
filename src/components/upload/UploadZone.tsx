"use client";

import { useCallback, useRef, useState, useEffect } from "react";
import { Upload, FolderOpen, Loader2, Files } from "lucide-react";
import { addFiles, useWorkspace } from "@/lib/store/workspace-store";
import { useI18n } from "@/lib/i18n/provider";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import { cn, formatBytes } from "@/lib/utils";
import { MAX_FILES_PER_JOB, MAX_TOTAL_SIZE, MAX_FILE_SIZE } from "@/lib/engine/safety";

function readDirectoryEntry(entry: FileSystemEntry): Promise<File[]> {
  return new Promise((resolve) => {
    if (entry.isFile) {
      (entry as FileSystemFileEntry).file(
        (f) => resolve([f]),
        () => resolve([])
      );
      return;
    }
    if (entry.isDirectory) {
      const reader = (entry as FileSystemDirectoryEntry).createReader();
      const all: File[] = [];
      const readBatch = () => {
        reader.readEntries(
          async (entries) => {
            if (!entries.length) return resolve(all);
            for (const en of entries) {
              all.push(...(await readDirectoryEntry(en)));
            }
            readBatch();
          },
          () => resolve(all)
        );
      };
      readBatch();
      return;
    }
    resolve([]);
  });
}

function pickFilesFromItems(items: DataTransferItemList): Promise<File[]> {
  const entries: FileSystemEntry[] = [];
  for (const item of Array.from(items)) {
    const entry = item.webkitGetAsEntry?.();
    if (entry) entries.push(entry);
  }
  if (!entries.length) {
    return Promise.resolve(Array.from(items).map((i) => i.getAsFile()).filter(Boolean) as File[]);
  }
  return Promise.all(entries.map(readDirectoryEntry)).then((nested) => nested.flat());
}

export function UploadZone({ id, className, compact }: { id?: string; className?: string; compact?: boolean }) {
  const { t } = useI18n();
  const { push } = useToast();
  const { busyAnalyzing } = useWorkspace();
  const inputRef = useRef<HTMLInputElement>(null);
  const folderRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const dragDepth = useRef(0);

  const acceptFiles = useCallback(
    (files: File[]) => {
      if (!files.length) return;
      if (files.length > MAX_FILES_PER_JOB) {
        push({ type: "error", title: "Too many files", desc: `Maximum ${MAX_FILES_PER_JOB} files per job.` });
        return;
      }
      let total = 0;
      const tooBig = files.find((f) => f.size > MAX_FILE_SIZE);
      if (tooBig) {
        push({ type: "error", title: "File too large", desc: `${tooBig.name} exceeds the 250 MB limit.` });
        return;
      }
      for (const f of files) total += f.size;
      if (total > MAX_TOTAL_SIZE) {
        push({ type: "error", title: "Batch too large", desc: `Combined size exceeds ${formatBytes(MAX_TOTAL_SIZE)}.` });
        return;
      }
      void addFiles(files);
    },
    [push]
  );

  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const files = Array.from(e.clipboardData?.files ?? []).filter((f) => f.type.startsWith("image/"));
      if (files.length) acceptFiles(files);
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [acceptFiles]);

  const onDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      dragDepth.current = 0;
      setDragging(false);
      const files = await pickFilesFromItems(e.dataTransfer.items);
      acceptFiles(files);
    },
    [acceptFiles]
  );

  return (
    <div id={id} className={cn("relative scroll-mt-24", className)}>
      <div
        role="button"
        tabIndex={0}
        aria-label={t.hero.dropHere}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragEnter={(e) => {
          e.preventDefault();
          dragDepth.current += 1;
          setDragging(true);
        }}
        onDragOver={(e) => e.preventDefault()}
        onDragLeave={(e) => {
          e.preventDefault();
          dragDepth.current -= 1;
          if (dragDepth.current <= 0) setDragging(false);
        }}
        onDrop={onDrop}
        className={cn(
          "group relative flex w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed bg-surface px-6 py-10 text-center transition-all duration-200 sm:py-14",
          dragging
            ? "scale-[1.01] border-primary bg-primary-soft/50 shadow-lg"
            : "border-line-strong bg-surface hover:border-primary/50 hover:shadow-md",
          busyAnalyzing && "pointer-events-none"
        )}
      >
        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200",
            dragging && "opacity-100"
          )}
        >
          <div className="absolute inset-0 bg-hero-glow" />
          <div className="absolute inset-0 bg-dots opacity-40" />
        </div>

        <div className="relative flex flex-col items-center">
          <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary-soft text-primary transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:scale-105">
            {busyAnalyzing ? (
              <Loader2 className="size-6 animate-spin" aria-hidden />
            ) : dragging ? (
              <Files className="size-6" aria-hidden />
            ) : (
              <Upload className="size-6" aria-hidden />
            )}
          </div>

          <p className="text-lg font-bold text-content">
            {busyAnalyzing ? t.progress.uploading : dragging ? t.hero.dropHere : t.hero.orChoose}
          </p>
          <p className="mt-1 text-sm text-muted">
            {t.hero.folders}
          </p>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
            <Button
              type="button"
              size={compact ? "sm" : "md"}
              icon={<Upload className="size-4" />}
              onClick={(e) => {
                e.stopPropagation();
                inputRef.current?.click();
              }}
            >
              {t.hero.chooseFiles}
            </Button>
            <Button
              type="button"
              variant="secondary"
              size={compact ? "sm" : "md"}
              icon={<FolderOpen className="size-4" />}
              onClick={(e) => {
                e.stopPropagation();
                folderRef.current?.click();
              }}
            >
              {t.hero.chooseFolder}
            </Button>
          </div>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => {
          acceptFiles(Array.from(e.target.files ?? []));
          e.target.value = "";
        }}
      />
      <input
        ref={folderRef}
        type="file"
        multiple
        className="sr-only"
        tabIndex={-1}
        {...({ webkitdirectory: "", directory: "" } as object)}
        onChange={(e) => {
          acceptFiles(Array.from(e.target.files ?? []));
          e.target.value = "";
        }}
      />
    </div>
  );
}
