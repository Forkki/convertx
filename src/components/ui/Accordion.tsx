"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function Accordion({
  title,
  children,
  defaultOpen = false,
  badge,
}: {
  title: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  badge?: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = `acc-${title?.toString().slice(0, 16)}`;

  return (
    <div className="rounded-xl border border-line bg-surface overflow-hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors hover:bg-surface-2"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-content">
          {title}
          {badge}
        </span>
        <ChevronDown
          className={cn("size-4 shrink-0 text-muted transition-transform duration-200", open && "rotate-180")}
          aria-hidden
        />
      </button>
      <div
        id={panelId}
        className={cn(
          "grid transition-[grid-template-rows] duration-200",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
      >
        <div className="overflow-hidden">
          <div className="px-4 pb-4">{children}</div>
        </div>
      </div>
    </div>
  );
}
