"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

export function Switch({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}) {
  const id = useId();
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <label htmlFor={id} className="block text-sm font-medium text-content cursor-pointer">
          {label}
        </label>
        {description && <p className="mt-0.5 text-xs text-muted">{description}</p>}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/60",
          checked ? "bg-primary" : "bg-surface-3"
        )}
      >
        <span
          className={cn(
            "inline-block size-4 transform rounded-full bg-white shadow transition-transform duration-200",
            checked ? "translate-x-6" : "translate-x-1"
          )}
        />
      </button>
    </div>
  );
}
