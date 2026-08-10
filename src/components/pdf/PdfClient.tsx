"use client";

import { useRouter } from "next/navigation";
import { ArrowRight, FileText, Layers, Scissors, RotateCw, FileDown, FileUp, Lock, LockOpen } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export interface SerializedPdfTool {
  slug: string;
  from: string;
  to: string;
  available: boolean;
}

const ICON_BY_SLUG: Record<string, React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>> = {
  "pdf-merge": Layers,
  "pdf-split": Scissors,
  "pdf-extract-pages": FileDown,
  "pdf-delete-pages": FileDown,
  "pdf-reorder-pages": Layers,
  "pdf-rotate": RotateCw,
  "pdf-compress": FileDown,
  "pdf-to-text": FileText,
  "pdf-to-jpg": FileUp,
  "pdf-to-png": FileUp,
  "pdf-to-webp": FileUp,
  "jpg-to-pdf": FileUp,
  "images-to-pdf": FileUp,
  "pdf-encrypt": Lock,
  "pdf-decrypt": LockOpen,
};

const OP_LABEL: Record<string, { en: string; th: string }> = {
  "pdf-merge": { en: "Merge PDFs", th: "รวม PDF" },
  "pdf-split": { en: "Split pages", th: "แยกหน้า" },
  "pdf-extract-pages": { en: "Extract pages", th: "ดึงหน้าที่ต้องการ" },
  "pdf-delete-pages": { en: "Delete pages", th: "ลบหน้า" },
  "pdf-reorder-pages": { en: "Reorder pages", th: "เรียงลำดับหน้า" },
  "pdf-rotate": { en: "Rotate", th: "หมุนหน้า" },
  "pdf-compress": { en: "Compress", th: "บีบอัด" },
  "pdf-to-text": { en: "PDF → Text", th: "PDF → ข้อความ" },
  "pdf-to-jpg": { en: "PDF → JPG", th: "PDF → JPG" },
  "pdf-to-png": { en: "PDF → PNG", th: "PDF → PNG" },
  "pdf-to-webp": { en: "PDF → WebP", th: "PDF → WebP" },
  "jpg-to-pdf": { en: "JPG → PDF", th: "JPG → PDF" },
  "images-to-pdf": { en: "Images → PDF", th: "รูปภาพ → PDF" },
  "pdf-encrypt": { en: "Encrypt", th: "เข้ารหัส" },
  "pdf-decrypt": { en: "Decrypt", th: "ถอดรหัส" },
};

export function PdfClient({ tools }: { tools: SerializedPdfTool[] }) {
  const { t, lang } = useI18n();
  const router = useRouter();

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="max-w-2xl">
        <Badge tone="primary" className="mb-3">
          PDF
        </Badge>
        <h1 className="text-3xl font-extrabold tracking-tight text-content sm:text-4xl">{t.pdfTools.title}</h1>
        <p className="mt-2 text-pretty text-muted">{t.pdfTools.subtitle}</p>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {tools.map((tool) => {
          const Icon = ICON_BY_SLUG[tool.slug] ?? FileText;
          const op = OP_LABEL[tool.slug];
          return (
            <button
              key={tool.slug}
              type="button"
              onClick={() => router.push(`/?tool=${tool.slug}`)}
              disabled={!tool.available}
              className="group flex items-center gap-3 rounded-2xl border border-line bg-surface p-4 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md disabled:pointer-events-none disabled:opacity-55"
            >
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                <Icon className="size-5" aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-content">{op ? (lang === "th" ? op.th : op.en) : `${tool.from.toUpperCase()} → ${tool.to.toUpperCase()}`}</p>
                <p className="text-xs text-muted">{tool.from.toUpperCase()} → {tool.to.toUpperCase()}</p>
              </div>
              {tool.available ? (
                <ArrowRight className="size-4 shrink-0 text-primary transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />
              ) : (
                <Badge tone="neutral" className="shrink-0">
                  {t.common.comingSoon}
                </Badge>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-12 flex flex-col items-start justify-between gap-4 rounded-2xl border border-line bg-surface p-6 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-lg font-bold text-content">{t.home.ctaTitle}</h2>
          <p className="mt-1 text-sm text-muted">{t.home.ctaSub}</p>
        </div>
        <Button
          size="lg"
          icon={<FileUp className="size-4" />}
          onClick={() => router.push("/#upload")}
        >
          {t.home.ctaButton}
        </Button>
      </div>
    </div>
  );
}
