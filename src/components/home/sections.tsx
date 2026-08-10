"use client";

import { Check, Download, Upload, Wand2, ShieldCheck, Lock, FileSearch, FileCheck2, Gauge } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import { useWorkspace } from "@/lib/store/workspace-store";
import { Accordion } from "@/components/ui/Accordion";
import { Button } from "@/components/ui/Button";
import { PopularTools } from "./PopularTools";

export function MarketingSections() {
  const { stage } = useWorkspace();
  if (stage !== "idle") return null;
  return (
    <>
      <PopularTools />
      <AllInOne />
      <QualitySection />
      <HowItWorks />
      <FormatsSection />
      <SecuritySection />
      <FaqSection />
      <CtaSection />
    </>
  );
}

export function AllInOne() {
  const { t } = useI18n();
  return (
    <section className="border-y border-line bg-surface/60">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-2">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-content sm:text-3xl">{t.home.allInOne}</h2>
          <p className="mt-3 max-w-md text-pretty leading-relaxed text-muted">{t.home.allInOneSub}</p>
          <Button className="mt-6" href="/tools">
            {t.home.allInOneCta}
          </Button>
        </div>
        <WorkspaceDemo />
      </div>
    </section>
  );
}

function WorkspaceDemo() {
  const { t } = useI18n();
  return (
    <div className="relative">
      <div aria-hidden className="absolute -inset-6 rounded-3xl bg-hero-glow" />
      <div className="relative rounded-2xl border border-line bg-surface p-4 shadow-lg">
        <div className="mb-3 flex items-center gap-1.5 border-b border-line pb-3">
          <span className="size-2.5 rounded-full bg-danger/70" />
          <span className="size-2.5 rounded-full bg-warning/70" />
          <span className="size-2.5 rounded-full bg-success/70" />
          <span className="ml-2 text-xs font-semibold text-faint">{t.workspace.title}</span>
        </div>

        <div className="space-y-2">
          {[
            { name: "photo-sunset.png", meta: "2.4 MB · 2400 × 1600 px", tone: "bg-primary-soft text-primary" },
            { name: "notes.pdf", meta: "8 pages", tone: "bg-danger-soft text-danger" },
            { name: "track.wav", meta: "0:42 · 8.6 MB", tone: "bg-success-soft text-success" },
          ].map((f, i) => (
            <div key={f.name} className="flex items-center gap-3 rounded-xl border border-line bg-surface-2/50 p-2.5">
              <div className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${f.tone}`}>
                <FileCheck2 className="size-4" aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-content">{f.name}</p>
                <p className="text-xs text-muted">{f.meta}</p>
              </div>
              <span className="rounded-md bg-primary px-2 py-1 text-[11px] font-bold text-white">
                {i === 0 ? "→ PNG" : i === 1 ? "→ JPG" : "→ MP3"}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-xl bg-surface-2/70 p-3">
          <div className="flex items-center justify-between text-xs font-semibold text-content">
            <span>{t.progress.converting}</span>
            <span className="tabular-nums text-primary">100%</span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-surface-3">
            <div className="h-full w-full rounded-full bg-primary" />
          </div>
        </div>

        <div className="mt-3 flex items-center justify-center gap-1.5 rounded-xl bg-success-soft py-2.5 text-sm font-semibold text-success">
          <Check className="size-4" aria-hidden />
          {t.result.success}
        </div>
      </div>
    </div>
  );
}

export function QualitySection() {
  const { t } = useI18n();
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
      <div className="grid items-start gap-10 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <h2 className="text-2xl font-extrabold tracking-tight text-content sm:text-3xl">{t.home.qualityTitle}</h2>
          <p className="mt-3 max-w-md text-pretty leading-relaxed text-muted">{t.home.qualitySub}</p>
        </div>
        <ul className="grid gap-4 sm:grid-cols-2 lg:col-span-7">
          {t.home.qualityPoints.map((point) => (
            <li key={point} className="flex items-start gap-3 rounded-xl border border-line bg-surface p-4 shadow-sm">
              <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-success-soft text-success">
                <Check className="size-3.5" aria-hidden />
              </span>
              <span className="text-sm font-medium leading-relaxed text-content">{point}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function HowItWorks() {
  const { t } = useI18n();
  const icons = [Upload, Wand2, Download];
  return (
    <section className="border-y border-line bg-surface/60">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <h2 className="text-center text-2xl font-extrabold tracking-tight text-content sm:text-3xl">{t.home.howTitle}</h2>
        <p className="mx-auto mt-1.5 max-w-md text-center text-muted">{t.home.howSub}</p>

        <div className="relative mt-12 grid gap-8 sm:grid-cols-3">
          <div aria-hidden className="absolute left-0 right-0 top-7 hidden h-px bg-line sm:block" />
          {t.home.howSteps.map((step, i) => {
            const Icon = icons[i] ?? Upload;
            return (
              <div key={step.title} className="relative flex flex-col items-center text-center">
                <div className="relative z-10 flex size-14 items-center justify-center rounded-2xl border border-line bg-surface text-primary shadow-sm">
                  <Icon className="size-6" aria-hidden />
                </div>
                <span className="mt-3 text-xs font-bold uppercase tracking-widest text-faint">{i + 1}</span>
                <h3 className="mt-1 text-base font-bold text-content">{step.title}</h3>
                <p className="mt-1.5 max-w-xs text-sm leading-relaxed text-muted">{step.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

const FORMAT_CHIPS: Record<string, string[]> = {
  images: ["JPG", "PNG", "WEBP", "AVIF", "GIF", "TIFF", "HEIC", "SVG"],
  pdf: ["PDF → JPG", "PDF → PNG", "PDF → TXT", "Merge", "Split", "Compress", "Rotate", "Delete pages"],
  docs: ["TXT → PDF", "CSV → PDF", "MD → PDF"],
  media: ["MP3", "WAV", "FLAC", "M4A", "MP4", "MOV", "WEBM", "AVI", "MKV"],
  text: ["Image → TXT", "PDF → TXT", "OCR"],
};

export function FormatsSection() {
  const { t } = useI18n();
  const labels = {
    images: t.home.formatsImages,
    pdf: t.home.formatsPdf,
    docs: t.home.formatsDocs,
    media: t.home.formatsMedia,
    text: t.home.formatsText,
  };
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
      <h2 className="text-2xl font-extrabold tracking-tight text-content sm:text-3xl">{t.home.formatsTitle}</h2>
      <p className="mt-1.5 max-w-xl text-muted">{t.home.formatsSub}</p>

      <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
        {Object.keys(FORMAT_CHIPS).map((key) => (
          <div key={key} className="rounded-2xl border border-line bg-surface p-4 shadow-sm transition-colors hover:border-primary/40">
            <h3 className="text-sm font-bold text-content">{labels[key as keyof typeof labels]}</h3>
            <ul className="mt-3 space-y-1.5">
              {FORMAT_CHIPS[key].map((chip) => (
                <li key={chip} className="rounded-lg bg-surface-2 px-2.5 py-1 text-xs font-semibold text-muted">
                  {chip}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

export function SecuritySection() {
  const { t } = useI18n();
  const icons = [Lock, FileSearch, ShieldCheck, Gauge];
  return (
    <section className="bg-[#0B0F19]">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <h2 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">{t.home.securityTitle}</h2>
        <p className="mt-1.5 text-[#9ca3af]">{t.home.securitySub}</p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {t.home.securityPoints.map((point, i) => {
            const Icon = icons[i] ?? ShieldCheck;
            return (
              <div key={point.title} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-primary/20 text-[#a5b4fc]">
                  <Icon className="size-5" aria-hidden />
                </div>
                <h3 className="text-sm font-bold text-white">{point.title}</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-[#9ca3af]">{point.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function FaqSection() {
  const { t } = useI18n();
  return (
    <section id="faq" className="mx-auto max-w-3xl scroll-mt-20 px-4 py-16 sm:px-6 sm:py-20">
      <h2 className="text-center text-2xl font-extrabold tracking-tight text-content sm:text-3xl">{t.home.faqTitle}</h2>
      <p className="mx-auto mt-1.5 max-w-md text-center text-muted">{t.home.faqSub}</p>

      <div className="mt-8 space-y-3">
        {t.home.faqItems.map((item) => (
          <Accordion key={item.q} title={item.q}>
            <p className="text-sm leading-relaxed text-muted">{item.a}</p>
          </Accordion>
        ))}
      </div>
    </section>
  );
}

export function CtaSection() {
  const { t } = useI18n();
  return (
    <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
      <div className="relative overflow-hidden rounded-3xl border border-line bg-surface px-6 py-14 text-center shadow-md">
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-hero-glow" />
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-dots opacity-40 [mask-image:radial-gradient(40rem_20rem_at_50%_120%,black,transparent)]" />
        <div className="relative">
          <h2 className="text-2xl font-extrabold tracking-tight text-content sm:text-3xl">{t.home.ctaTitle}</h2>
          <p className="mx-auto mt-2 max-w-md text-pretty text-muted">{t.home.ctaSub}</p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
            <Button
              size="lg"
              onClick={() => {
                document.getElementById("upload")?.scrollIntoView({ behavior: "smooth" });
                setTimeout(() => {
                  document.getElementById("hero-upload")?.querySelector('[role="button"]')?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
                }, 350);
              }}
            >
              {t.home.ctaButton}
            </Button>
            <Button variant="secondary" size="lg" href="/tools">
              {t.home.ctaSecondary}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
