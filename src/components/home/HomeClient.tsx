"use client";

import { useEffect, useMemo } from "react";
import { ShieldCheck, Zap, Sparkles, ArrowRight } from "lucide-react";
import { useWorkspace, resetWorkspace, setTool } from "@/lib/store/workspace-store";
import { useI18n } from "@/lib/i18n/provider";
import { UploadZone } from "@/components/upload/UploadZone";
import { Workspace } from "@/components/workspace/Workspace";
import { Button } from "@/components/ui/Button";

const DEFAULT_TARGET: Record<string, string> = {
  "jpg-to-png": "png",
  "png-to-jpg": "jpg",
  "jpg-to-webp": "webp",
  "webp-to-jpg": "jpg",
  "png-to-webp": "webp",
  "webp-to-png": "png",
  "heic-to-jpg": "jpg",
  "svg-to-png": "png",
  "tiff-to-jpg": "jpg",
  "pdf-to-jpg": "jpg",
  "pdf-to-png": "png",
  "pdf-to-webp": "webp",
  "jpg-to-pdf": "pdf",
  "png-to-pdf": "pdf",
  "images-to-pdf": "pdf",
  "pdf-to-text": "txt",
  "txt-to-pdf": "pdf",
  "wav-to-mp3": "mp3",
  "mp3-to-wav": "wav",
  "mp3-to-flac": "flac",
  "m4a-to-mp3": "mp3",
  "video-to-mp3": "mp3",
  "video-to-wav": "wav",
  "mov-to-mp4": "mp4",
  "webm-to-mp4": "mp4",
  "avi-to-mp4": "mp4",
  "mp4-to-webm": "webm",
  "mp4-to-gif": "gif",
  "pdf-merge": "pdf",
  "pdf-split": "pdf",
  "pdf-compress": "pdf",
  "pdf-rotate": "pdf",
  "pdf-encrypt": "pdf",
  "pdf-decrypt": "pdf",
  "image-compress": "jpg",
  "video-compress": "mp4",
  "image-to-text": "txt",
};

export function HomeClient() {
  const { t } = useI18n();
  const { stage } = useWorkspace();

  useEffect(() => {
    const qs = new URLSearchParams(window.location.search);
    const tool = qs.get("tool");
    if (!tool) return;
    const target = DEFAULT_TARGET[tool] ?? "";
    resetWorkspace();
    setTool(tool, target);
    qs.delete("tool");
    const url = qs.toString() ? `?${qs.toString()}` : window.location.pathname;
    window.history.replaceState(null, "", url);
    if (document.getElementById("upload")) {
      document.getElementById("upload")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  const trust = useMemo(() => t.hero.badge.split("·").map((s) => s.trim()).filter(Boolean), [t]);

  if (stage !== "idle") {
    return <Workspace />;
  }

  return (
    <>
      <section id="upload" className="relative overflow-hidden scroll-mt-16">
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-hero-glow" />
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-dots opacity-50 [mask-image:radial-gradient(48rem_28rem_at_50%_0%,black,transparent)]" />

        <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-14 sm:px-6 sm:pt-20">
          <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-8">
            <div className="lg:col-span-5">
              <h1 className="text-balance text-4xl font-extrabold leading-[1.08] tracking-tight text-content sm:text-5xl">
                {t.hero.title.replace(t.hero.titleHighlight, "")}
                <span className="whitespace-nowrap text-primary">{t.hero.titleHighlight}</span>
              </h1>
              <p className="mt-4 max-w-md text-pretty text-base leading-relaxed text-muted sm:text-lg">
                {t.hero.subtitle}
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-2.5">
                <Button
                  size="lg"
                  icon={<ArrowRight className="size-4" />}
                  onClick={() => document.getElementById("hero-upload")?.querySelector('[role="button"]')?.dispatchEvent(new MouseEvent("click", { bubbles: true }))}
                >
                  {t.hero.chooseFiles}
                </Button>
                <Button variant="secondary" size="lg" href="/tools">
                  {t.home.allInOneCta}
                </Button>
              </div>

              <div className="mt-7 flex flex-wrap gap-2">
                {trust.map((label, i) => (
                  <span key={label} className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface/70 px-3 py-1.5 text-xs font-semibold text-muted backdrop-blur">
                    {i === 0 ? <Sparkles className="size-3.5 text-primary" aria-hidden /> : i === 1 ? <ShieldCheck className="size-3.5 text-success" aria-hidden /> : <Zap className="size-3.5 text-warning" aria-hidden />}
                    {label}
                  </span>
                ))}
              </div>
            </div>

            <div className="lg:col-span-7">
              <UploadZone id="hero-upload" />
              <p className="mt-3 text-center text-[13px] text-faint">{t.hero.supported}</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
