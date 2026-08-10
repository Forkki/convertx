"use client";

import { useMemo } from "react";
import { ArrowRight, TriangleAlert } from "lucide-react";
import { useWorkspace, resolveToolId, setTarget } from "@/lib/store/workspace-store";
import { useI18n } from "@/lib/i18n/provider";
import { Select } from "@/components/ui/Select";
import { cn } from "@/lib/utils";
import {
  suggestedTargets,
  allTargetsFor,
  extCategory,
  extLabel,
  isLossyTarget,
} from "@/lib/client/formats";

export function FormatPicker() {
  const { t } = useI18n();
  const { files, target } = useWorkspace();
  const first = files[0];

  const category = useMemo(() => {
    const ext = first?.meta?.ext ?? first?.name.split(".").pop() ?? "";
    return extCategory(ext);
  }, [first]);

  const allSameExt = useMemo(() => {
    const ext = first?.meta?.ext ?? "";
    return ext ? files.every((f) => (f.meta?.ext ?? "") === ext) : true;
  }, [files, first]);

  const currentExt = first?.meta?.ext ?? "";
  const suggested = allSameExt ? suggestedTargets(currentExt) : [];
  const allTargets = allTargetsFor(category, currentExt);
  const toolId = resolveToolId(files, target);
  const lossy = isLossyTarget(target);

  if (!files.length) return null;

  return (
    <div className="rounded-2xl border border-line bg-surface shadow-sm">
      <div className="border-b border-line px-4 py-3">
        <h3 className="text-sm font-bold text-content">{t.workspace.convertTo}</h3>
        <p className="text-xs text-muted">{t.workspace.suggestedFor}</p>
      </div>

      <div className="space-y-4 p-4">
        {suggested.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {suggested.map((ext) => (
              <button
                key={ext}
                type="button"
                onClick={() => setTarget(ext)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-semibold transition-all duration-150",
                  target === ext
                    ? "border-primary bg-primary text-white shadow-sm"
                    : "border-line bg-surface-2 text-content hover:border-primary/50 hover:bg-primary-soft"
                )}
              >
                {extLabel(ext)}
              </button>
            ))}
          </div>
        )}

        {allTargets.length > 0 && (
          <Select
            label={t.workspace.suggestedFor}
            value={target}
            onChange={setTarget}
            placeholder="—"
            options={allTargets.map((ext) => ({ value: ext, label: extLabel(ext) }))}
          />
        )}

        {!allTargets.length && (
          <p className="flex items-center gap-2 rounded-lg bg-warning-soft px-3 py-2.5 text-sm font-medium text-warning">
            <TriangleAlert className="size-4 shrink-0" aria-hidden />
            {t.common.comingSoon} — {t.toolsDesc.comingSoon}
          </p>
        )}

        {lossy && target && (
          <p className="flex items-start gap-2 rounded-lg bg-warning-soft px-3 py-2.5 text-[13px] leading-snug text-warning">
            <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
            {t.workspace.lossyNotice}
          </p>
        )}

        {target && (
          <div className="flex items-center justify-center gap-2 text-xs font-semibold text-muted">
            <span className="rounded-md bg-surface-2 px-2 py-1 uppercase">{extLabel(currentExt)}</span>
            <ArrowRight className="size-3.5 text-primary" aria-hidden />
            <span className="rounded-md bg-primary text-white px-2 py-1 uppercase">{extLabel(target)}</span>
            <span className="ml-1 text-[11px] font-medium normal-case text-faint">{toolId}</span>
          </div>
        )}
      </div>
    </div>
  );
}
