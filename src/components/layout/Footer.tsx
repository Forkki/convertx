"use client";

import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import { Logo } from "./Logo";

export function Footer() {
  const { t } = useI18n();

  const cols = [
    {
      title: "Product",
      links: [
        { label: t.nav.convert, href: "/" },
        { label: t.nav.allTools, href: "/tools" },
        { label: t.nav.pdf, href: "/pdf" },
        { label: t.nav.history, href: "/history" },
      ],
    },
    {
      title: "Tools",
      links: [
        { label: t.nav.images, href: "/tools?category=Images" },
        { label: t.nav.docs, href: "/tools?category=Documents" },
        { label: "Audio", href: "/tools?category=Audio" },
        { label: "Video", href: "/tools?category=Video" },
      ],
    },
    {
      title: "Company",
      links: [
        { label: t.common.faq, href: "/#faq" },
        { label: t.common.privacy, href: "/privacy" },
        { label: t.common.terms, href: "/terms" },
      ],
    },
  ];

  return (
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-5">
          <div className="col-span-2">
            <Logo />
            <p className="mt-3 max-w-xs text-sm text-muted">{t.tagline}</p>
          </div>
          {cols.map((col) => (
            <div key={col.title}>
              <h4 className="text-sm font-bold text-content">{col.title}</h4>
              <ul className="mt-3 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="inline-block py-1.5 text-sm text-muted transition-colors hover:text-content">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-line pt-6 sm:flex-row sm:items-center">
          <p className="text-[13px] text-faint">© {new Date().getFullYear()} ConvertX — {t.tagline}</p>
          <p className="flex items-center gap-1.5 text-[13px] text-faint">
            <ShieldCheck className="size-4 text-success" aria-hidden />
            {t.hero.secure}
          </p>
        </div>
      </div>
    </footer>
  );
}
