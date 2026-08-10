"use client";

import { Languages } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";

export function LangToggle({ className }: { className?: string }) {
  const { lang, setLang } = useI18n();
  const next = lang === "th" ? "en" : "th";
  return (
    <button
      type="button"
      onClick={() => setLang(next)}
      aria-label={`Switch language to ${next === "th" ? "Thai" : "English"}`}
      title={next === "th" ? "เปลี่ยนเป็นภาษาไทย" : "Switch to English"}
      className={cn(
        "inline-flex size-10 items-center justify-center gap-1 rounded-xl border border-line bg-surface text-muted transition-colors hover:bg-surface-2 hover:text-content",
        className
      )}
    >
      <Languages className="size-4.5" />
      <span className="text-xs font-bold uppercase tracking-wide">{lang}</span>
    </button>
  );
}
