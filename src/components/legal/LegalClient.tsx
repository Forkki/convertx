"use client";

import { useI18n } from "@/lib/i18n/provider";

export function LegalClient({ kind }: { kind: "privacy" | "terms" }) {
  const { t } = useI18n();
  const block = t.legal;
  const isPrivacy = kind === "privacy";
  const title = isPrivacy ? block.privacyTitle : block.termsTitle;
  const intro = isPrivacy ? block.privacyIntro : block.termsIntro;
  const items = isPrivacy ? block.privacyItems : block.termsItems;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <p className="text-xs font-semibold uppercase tracking-widest text-faint">{block.updated}</p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-content sm:text-4xl">{title}</h1>
      <p className="mt-3 text-pretty leading-relaxed text-muted">{intro}</p>

      <div className="mt-8 space-y-6">
        {items.map((item, i) => (
          <section key={item.heading} className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
            <h2 className="flex items-baseline gap-3 text-base font-bold text-content">
              <span className="font-mono text-sm font-bold text-primary">{String(i + 1).padStart(2, "0")}</span>
              {item.heading}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">{item.body}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
