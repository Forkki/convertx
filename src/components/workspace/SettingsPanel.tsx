"use client";

import { useMemo } from "react";
import { Settings2 } from "lucide-react";
import { useWorkspace, resolveToolId, updateSettings } from "@/lib/store/workspace-store";
import { useI18n } from "@/lib/i18n/provider";
import { RadioCard, Segmented, Select } from "@/components/ui/Select";
import { Slider } from "@/components/ui/Slider";
import { Switch } from "@/components/ui/Switch";
import { Accordion } from "@/components/ui/Accordion";
import { isLossyTarget } from "@/lib/client/formats";

type Op = "image" | "pdf-image" | "image-pdf" | "pdf-text" | "text-pdf" | "media" | "media-extract-audio" | "media-to-gif" | "ocr" | "none";

const OP_BY_TOOL: Record<string, Op> = {
  "image-convert": "image",
  "images-to-pdf": "image-pdf",
  "pdf-to-jpg": "pdf-image",
  "pdf-to-text": "pdf-text",
  "txt-to-pdf": "text-pdf",
  "audio-convert": "media",
  "video-convert": "media",
  "video-to-mp3": "media-extract-audio",
  "video-to-wav": "media-extract-audio",
  "mp4-to-gif": "media-to-gif",
  "image-to-text": "ocr",
};

function TextField({
  label,
  value,
  onChange,
  placeholder,
  hint,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
  type?: string;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="block text-sm font-medium text-content">{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full rounded-xl border border-line bg-surface px-3.5 text-[15px] font-medium text-content transition-colors hover:border-line-strong focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-primary/50"
      />
      {hint && <span className="block text-xs text-muted">{hint}</span>}
    </label>
  );
}

function NumberField({
  label,
  value,
  onChange,
  min = 0,
  max = 10000,
  suffix,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  suffix?: string;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="flex items-center justify-between text-sm font-medium text-content">
        {label}
        {suffix && <span className="text-xs text-faint">{suffix}</span>}
      </span>
      <input
        type="number"
        value={Number.isFinite(value) ? value : ""}
        min={min}
        max={max}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-11 w-full rounded-xl border border-line bg-surface px-3.5 text-[15px] font-medium text-content transition-colors hover:border-line-strong focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-primary/50"
      />
    </label>
  );
}

export function SettingsPanel() {
  const { t } = useI18n();
  const { files, target, settings } = useWorkspace();
  const toolId = resolveToolId(files, target);
  const op: Op = OP_BY_TOOL[toolId] ?? "none";

  const qualityRelevant = useMemo(() => op === "image" || op === "pdf-image" || op === "media", [op]);
  const lossy = isLossyTarget(target);
  const advancedCount = advancedControlsCount(op, target);

  if (!files.length) return null;

  return (
    <div className="rounded-2xl border border-line bg-surface shadow-sm">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <h3 className="flex items-center gap-2 text-sm font-bold text-content">
          <Settings2 className="size-4 text-muted" aria-hidden />
          {t.common.settings}
        </h3>
        {advancedCount > 0 && (
          <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[11px] font-semibold text-muted">
            {advancedCount}
          </span>
        )}
      </div>

      <div className="space-y-4 p-4">
        {qualityRelevant && (
          <div className="space-y-2">
            <span className="block text-sm font-medium text-content">{t.workspace.quality}</span>
            <div className="grid gap-2">
              {(["standard", "high", "max"] as const).map((q) => (
                <RadioCard
                  key={q}
                  value={q}
                  selected={settings.quality ?? "high"}
                  onChange={(v) => updateSettings({ quality: v })}
                  title={t.workspace.qualityPresets[q].name}
                  desc={t.workspace.qualityPresets[q].desc}
                />
              ))}
            </div>
          </div>
        )}

        {op === "image" && (
          <Accordion title={t.workspace.advanced} badge={<span className="rounded bg-surface-2 px-1.5 py-0.5 text-[10px] text-muted">optional</span>}>
            <div className="space-y-4 pt-2">
              {lossy && (
                <Slider
                  label={t.workspace.imageQuality}
                  value={settings.imageQuality ?? 90}
                  onChange={(v) => updateSettings({ imageQuality: v })}
                  min={30}
                  max={100}
                  suffix="%"
                />
              )}
              <div className="grid grid-cols-2 gap-3">
                <NumberField
                  label={t.workspace.width}
                  value={settings.width ?? 0}
                  onChange={(v) => updateSettings({ width: v || undefined })}
                  suffix="px"
                />
                <NumberField
                  label={t.workspace.height}
                  value={settings.height ?? 0}
                  onChange={(v) => updateSettings({ height: v || undefined })}
                  suffix="px"
                />
              </div>
              <Select
                label={t.workspace.fit}
                value={settings.fit ?? "inside"}
                onChange={(v) => updateSettings({ fit: v as typeof settings.fit })}
                options={Object.entries(t.workspace.fits).map(([k, v]) => ({ value: k, label: v }))}
              />
              <Segmented
                label={t.workspace.colorMode}
                value={settings.colorMode ?? "rgb"}
                onChange={(v) => updateSettings({ colorMode: v as typeof settings.colorMode })}
                options={Object.entries(t.workspace.colorModes).map(([k, v]) => ({ value: k as "rgb" | "grayscale" | "bw", label: v }))}
              />
              {lossy && (
                <Switch
                  label={t.workspace.metadata}
                  checked={!!settings.keepMetadata}
                  onChange={(v) => updateSettings({ keepMetadata: v })}
                />
              )}
              {target === "png" && (
                <Select
                  label={t.workspace.compression}
                  value={settings.compression ?? "medium"}
                  onChange={(v) => updateSettings({ compression: v as typeof settings.compression })}
                  options={Object.entries(t.workspace.compressionLevels).map(([k, v]) => ({ value: k, label: v }))}
                />
              )}
            </div>
          </Accordion>
        )}

        {op === "pdf-image" && (
          <Accordion title={t.workspace.advanced}>
            <div className="space-y-4 pt-2">
              <Select
                label={t.workspace.dpi}
                value={String(settings.dpi ?? 150)}
                onChange={(v) => updateSettings({ dpi: Number(v) })}
                options={["96", "150", "200", "300", "400", "600"].map((d) => ({ value: d, label: `${d} DPI` }))}
              />
              <TextField
                label={t.workspace.pageRange}
                value={settings.pageRange ?? ""}
                onChange={(v) => updateSettings({ pageRange: v })}
                placeholder="1-5, 8, 10-20"
                hint={t.workspace.pageRangeHint}
              />
              <Segmented
                label={t.workspace.colorMode}
                value={settings.colorMode ?? "rgb"}
                onChange={(v) => updateSettings({ colorMode: v as typeof settings.colorMode })}
                options={Object.entries(t.workspace.colorModes).map(([k, v]) => ({ value: k as "rgb" | "grayscale" | "bw", label: v }))}
              />
              {target === "png" && (
                <Select
                  label={t.workspace.compression}
                  value={settings.compression ?? "medium"}
                  onChange={(v) => updateSettings({ compression: v as typeof settings.compression })}
                  options={Object.entries(t.workspace.compressionLevels).map(([k, v]) => ({ value: k, label: v }))}
                />
              )}
            </div>
          </Accordion>
        )}

        {op === "image-pdf" && (
          <Accordion title={t.workspace.advanced}>
            <div className="space-y-4 pt-2">
              <Select
                label={t.workspace.pageSize}
                value={settings.pageSize ?? "Original"}
                onChange={(v) => updateSettings({ pageSize: v as typeof settings.pageSize })}
                options={Object.entries(t.workspace.pageSizes).map(([k, v]) => ({ value: k, label: v }))}
              />
              <Segmented
                label={t.workspace.orientation}
                value={settings.orientation ?? "auto"}
                onChange={(v) => updateSettings({ orientation: v as typeof settings.orientation })}
                options={Object.entries(t.workspace.orientations).map(([k, v]) => ({ value: k as "portrait" | "landscape" | "auto", label: v }))}
              />
              <Slider
                label={t.workspace.margin}
                value={settings.margin ?? 0}
                onChange={(v) => updateSettings({ margin: v })}
                min={0}
                max={60}
                suffix="mm"
              />
            </div>
          </Accordion>
        )}

        {op === "media" && (target === "gif" || target === "mp4" || target === "mov" || target === "webm" || target === "avi" || target === "mkv") && (
          <Accordion title={t.workspace.advanced}>
            <div className="space-y-4 pt-2">
              <Select
                label={t.workspace.resolutionVideo}
                value={settings.resolution ?? "1280x720"}
                onChange={(v) => updateSettings({ resolution: v })}
                options={["1920x1080", "1280x720", "854x480", "640x360", "426x240"].map((r) => ({ value: r, label: r }))}
              />
              <Slider
                label={t.workspace.fps}
                value={settings.fps ?? 30}
                onChange={(v) => updateSettings({ fps: v })}
                min={15}
                max={60}
                suffix="fps"
              />
              <Select
                label={t.workspace.audioBitrate}
                value={settings.audioBitrate ?? "192k"}
                onChange={(v) => updateSettings({ audioBitrate: v })}
                options={["128k", "192k", "256k", "320k"].map((b) => ({ value: b, label: b }))}
              />
              <Switch
                label={t.workspace.metadata}
                checked={!!settings.keepMetadata}
                onChange={(v) => updateSettings({ keepMetadata: v })}
              />
            </div>
          </Accordion>
        )}

        {(op === "media" || op === "media-extract-audio") && (target === "mp3" || target === "wav" || target === "flac" || target === "aac" || target === "ogg" || target === "m4a") && (
          <Accordion title={t.workspace.advanced}>
            <div className="space-y-4 pt-2">
              <Select
                label={t.workspace.audioBitrate}
                value={settings.audioBitrate ?? "192k"}
                onChange={(v) => updateSettings({ audioBitrate: v })}
                options={["128k", "192k", "256k", "320k"].map((b) => ({ value: b, label: b }))}
              />
              <Select
                label={t.workspace.bitrate}
                value={String(settings.sampleRate ?? 44100)}
                onChange={(v) => updateSettings({ sampleRate: Number(v) })}
                options={["22050", "44100", "48000"].map((r) => ({ value: r, label: `${Number(r) / 1000} kHz` }))}
              />
              <Select
                label="Channels"
                value={String(settings.channels ?? 2)}
                onChange={(v) => updateSettings({ channels: Number(v) })}
                options={[
                  { value: "1", label: "Mono (1)" },
                  { value: "2", label: "Stereo (2)" },
                ]}
              />
              <Switch
                label={t.workspace.metadata}
                checked={!!settings.keepMetadata}
                onChange={(v) => updateSettings({ keepMetadata: v })}
              />
            </div>
          </Accordion>
        )}

        {op === "ocr" && (
          <Accordion title={t.workspace.advanced}>
            <div className="space-y-4 pt-2">
              <Select
                label={t.ocr.langLabel}
                value={settings.ocrLang ?? "eng"}
                onChange={(v) => updateSettings({ ocrLang: v })}
                options={[
                  { value: "eng", label: "English" },
                  { value: "tha", label: "ไทย (Thai)" },
                ]}
              />
              <p className="text-xs text-muted">{t.ocr.firstRunNote}</p>
            </div>
          </Accordion>
        )}
      </div>
    </div>
  );
}

function advancedControlsCount(op: Op, target: string): number {
  switch (op) {
    case "image":
      return 1 + (isLossyTarget(target) ? 2 : 1);
    case "pdf-image":
    case "image-pdf":
    case "media":
      return 3;
    case "media-extract-audio":
    case "ocr":
      return 2;
    default:
      return 0;
  }
}
