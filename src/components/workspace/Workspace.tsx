"use client";

import { ArrowLeft, Play } from "lucide-react";
import { useWorkspace, resetWorkspace, startConversion } from "@/lib/store/workspace-store";
import { useI18n } from "@/lib/i18n/provider";
import { FileList } from "./FileList";
import { FormatPicker } from "./FormatPicker";
import { SettingsPanel } from "./SettingsPanel";
import { ProgressPanel } from "./ProgressPanel";
import { ResultScreen } from "./ResultScreen";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/states";

export function Workspace() {
  const { t, fmt } = useI18n();
  const { stage, files, target, busyAnalyzing, error } = useWorkspace();

  const errorMap: Record<string, { title: string; desc: string }> = {
    chooseTarget: { title: t.workspace.chooseTarget, desc: t.errors.genericDesc },
    unsupported: { title: t.errors.unsupported, desc: t.errors.unsupportedDesc },
    corrupt: { title: t.errors.corrupt, desc: t.errors.corruptDesc },
    fileTooBig: { title: t.errors.fileTooBig, desc: t.errors.fileTooBigDesc },
    memory: { title: t.errors.memory, desc: t.errors.memoryDesc },
    timeout: { title: t.errors.timeout, desc: t.errors.timeoutDesc },
    noEngine: { title: t.errors.noEngine, desc: t.errors.noEngineDesc },
    ocrNetwork: { title: t.errors.ocrNetwork, desc: t.errors.ocrNetworkDesc },
    network: { title: t.errors.network, desc: t.errors.networkDesc },
    server: { title: t.errors.server, desc: t.errors.serverDesc },
    convertFailed: { title: t.errors.convertFailed, desc: t.errors.convertFailedDesc },
    generic: { title: t.errors.generic, desc: t.errors.genericDesc },
  };

  if (stage === "converting") {
    return (
      <section className="py-10">
        <h1 className="sr-only">{t.progress.converting}</h1>
        <ProgressPanel />
      </section>
    );
  }

  if (stage === "done") {
    return (
      <section className="py-10">
        <h1 className="sr-only">{t.result.successTitle}</h1>
        <ResultScreen />
      </section>
    );
  }

  if (stage === "error") {
    const info = errorMap[error?.code ?? "generic"] ?? errorMap.generic;
    return (
      <section className="py-10">
        <h1 className="sr-only">{info.title}</h1>
        <div className="mx-auto max-w-xl rounded-2xl border border-line bg-surface shadow-sm">
          <ErrorState
            title={info.title}
            desc={info.desc}
            action={
              <div className="flex flex-wrap items-center justify-center gap-2">
                <Button onClick={resetWorkspace} icon={<ArrowLeft className="size-4" />}>
                  {t.result.convertAnother}
                </Button>
                <Button variant="secondary" onClick={() => void startConversion()} icon={<Play className="size-4" />}>
                  {t.common.tryAgain}
                </Button>
              </div>
            }
          />
        </div>
      </section>
    );
  }

  // ready / idle with files
  return (
    <section className="py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-extrabold text-content sm:text-2xl">{t.workspace.title}</h1>
            <p className="mt-0.5 text-sm text-muted">
              {files.length === 1 ? t.workspace.singleFileLabel : fmt(t.workspace.multiFileLabel, { n: files.length })}
            </p>
          </div>
          <Button variant="ghost" size="sm" href="/" icon={<ArrowLeft className="size-4" />}>
            {t.workspace.backToHome}
          </Button>
        </div>

        <div className="grid gap-5 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <FileList />
          </div>
          <div className="space-y-5 lg:col-span-3">
            <div className="grid gap-5 sm:grid-cols-2">
              <FormatPicker />
              <SettingsPanel />
            </div>
            <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-surface p-4 shadow-sm">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-content">
                  {files.length === 1 ? t.workspace.singleFileLabel : fmt(t.workspace.multiFileLabel, { n: files.length })}
                </p>
                <p className="text-xs text-muted">
                  {target ? `→ ${target.toUpperCase()}` : t.workspace.chooseTarget}
                </p>
              </div>
              <Button
                size="lg"
                icon={<Play className="size-4" />}
                disabled={busyAnalyzing || !target || !files.length}
                onClick={() => void startConversion()}
              >
                {files.length > 1 ? fmt(t.workspace.startBatch, { n: files.length }) : t.workspace.start}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
