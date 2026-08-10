"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Search, Sparkles } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import type { SerializedTool } from "@/app/tools/page";

const CATEGORY_KEYS = ["Popular", "PDF", "Images", "Documents", "Audio", "Video", "Compression", "Utilities"];

export function ToolsClient({ tools, initialCategory }: { tools: SerializedTool[]; initialCategory: string | null }) {
  const { t, fmt } = useI18n();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(() => {
    if (!initialCategory) return null;
    const idx = CATEGORY_KEYS.indexOf(initialCategory);
    return idx >= 0 ? CATEGORY_KEYS[idx] : null;
  });

  const localizedCategories = t.tools.categories;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tools.filter((tool) => {
      if (category && tool.category !== category) return false;
      if (!q) return true;
      return tool.slug.replace(/-/g, " ").includes(q) || tool.from.toLowerCase().includes(q) || tool.to.toLowerCase().includes(q);
    });
  }, [tools, query, category]);

  const countByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    for (const c of CATEGORY_KEYS) map[c] = tools.filter((x) => x.category === c).length;
    return map;
  }, [tools]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-extrabold tracking-tight text-content sm:text-4xl">{t.tools.title}</h1>
        <p className="mt-2 text-pretty text-muted">{t.tools.subtitle}</p>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-2.5">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-faint" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.tools.searchPlaceholder}
            aria-label={t.tools.searchPlaceholder}
            className="h-11 w-full rounded-xl border border-line bg-surface pl-10 pr-4 text-[15px] font-medium text-content transition-colors hover:border-line-strong focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-primary/50"
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          <Chip active={category === null} onClick={() => setCategory(null)}>
            {t.tools.categories[0]} <Count>{tools.length}</Count>
          </Chip>
          {CATEGORY_KEYS.slice(1).map((key, i) => (
            <Chip key={key} active={category === key} onClick={() => setCategory(category === key ? null : key)}>
              {localizedCategories[i + 1]} <Count>{countByCategory[key] ?? 0}</Count>
            </Chip>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="mt-14 flex flex-col items-center gap-2 text-center">
          <Sparkles className="size-8 text-faint" aria-hidden />
          <p className="font-semibold text-content">{t.tools.noTools}</p>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((tool) => (
            <button
              key={tool.slug}
              type="button"
              onClick={() => router.push(`/?tool=${tool.slug}`)}
              className="group flex flex-col rounded-2xl border border-line bg-surface p-4 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="flex flex-wrap items-center gap-1.5">
                  <span className="rounded-lg bg-surface-2 px-2 py-1 text-xs font-bold text-content">{tool.from}</span>
                  <ArrowRight className="size-3.5 text-primary transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />
                  <span className="rounded-lg bg-primary-soft px-2 py-1 text-xs font-bold text-primary-dark dark:text-primary">{tool.to}</span>
                </span>
                {!tool.available && (
                  <Badge tone="neutral" className="shrink-0">
                    {t.common.comingSoon}
                  </Badge>
                )}
              </div>
              <p className="mt-3 flex-1 text-[13px] leading-snug text-muted">
                {fmt(t.toolsDesc[tool.descKey as keyof typeof t.toolsDesc], { from: tool.from, to: tool.to })}
              </p>
              <span className={cn("mt-4 inline-flex items-center gap-1 text-sm font-semibold", tool.available ? "text-primary" : "text-faint")}>
                {tool.available ? t.tools.useTool : t.common.comingSoon}
                {tool.available && <ArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-semibold transition-colors",
        active
          ? "border-primary bg-primary-soft text-primary-dark dark:text-primary"
          : "border-line bg-surface text-muted hover:border-line-strong hover:text-content"
      )}
    >
      {children}
    </button>
  );
}

function Count({ children }: { children: React.ReactNode }) {
  return <span className="text-xs font-bold opacity-70">{children}</span>;
}
