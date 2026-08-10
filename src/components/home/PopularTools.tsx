"use client";

import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";

interface FeaturedTool {
  slug: string;
  from: string[];
  to: string[];
  descKey: keyof import("@/lib/i18n/dictionaries").Dict["toolsDesc"];
}

const FEATURED: FeaturedTool[] = [
  { slug: "jpg-to-png", from: ["JPG"], to: ["PNG"], descKey: "image" },
  { slug: "png-to-jpg", from: ["PNG"], to: ["JPG"], descKey: "image" },
  { slug: "pdf-to-jpg", from: ["PDF"], to: ["JPG"], descKey: "pdfOut" },
  { slug: "images-to-pdf", from: ["PNG", "JPG", "WEBP"], to: ["PDF"], descKey: "toPdf" },
  { slug: "wav-to-mp3", from: ["WAV"], to: ["MP3"], descKey: "audio" },
  { slug: "mov-to-mp4", from: ["MOV"], to: ["MP4"], descKey: "video" },
  { slug: "video-to-mp3", from: ["MP4", "MKV", "MOV"], to: ["MP3"], descKey: "videoToAudio" },
  { slug: "image-compress", from: ["PNG", "JPG", "WEBP"], to: ["Smaller"], descKey: "compress" },
];

export function PopularTools() {
  const { t, fmt } = useI18n();
  const router = useRouter();

  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-content sm:text-3xl">{t.home.popular}</h2>
          <p className="mt-1.5 text-muted">{t.home.popularSub}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {FEATURED.map((tool) => (
          <button
            key={tool.slug}
            type="button"
            onClick={() => router.push(`/?tool=${tool.slug}`)}
            className="group flex flex-col items-start justify-between gap-6 rounded-2xl border border-line bg-surface p-4 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
          >
            <div className="w-full">
              <div className="flex flex-wrap items-center gap-1.5">
                {tool.from.map((f, i) => (
                  <span key={f} className="flex items-center gap-1.5">
                    <span className="rounded-lg bg-surface-2 px-2 py-1 text-xs font-bold text-content">{f}</span>
                    {i < tool.from.length - 1 && <span className="text-faint">/</span>}
                  </span>
                ))}
                <ArrowRight className="size-4 text-primary transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />
                {tool.to.map((to) => (
                  <span key={to} className="rounded-lg bg-primary-soft px-2 py-1 text-xs font-bold text-primary-dark dark:text-primary">
                    {to}
                  </span>
                ))}
              </div>
              <p className="mt-3 text-[13px] leading-snug text-muted">
                {fmt(t.toolsDesc[tool.descKey], { from: tool.from.join("/"), to: tool.to.join("/") })}
              </p>
            </div>
            <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
              {t.tools.useTool}
              <ArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
