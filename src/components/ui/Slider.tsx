"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

export function Slider({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  suffix = "%",
  label,
  className,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  label?: string;
  className?: string;
}) {
  const id = useId();
  const pct = ((value - min) / (max - min)) * 100;

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <div className="flex items-center justify-between gap-4">
          <label htmlFor={id} className="text-sm font-medium text-content">
            {label}
          </label>
          <span className="rounded-md bg-surface-2 px-2 py-0.5 text-sm font-semibold tabular-nums text-content">
            {value}
            {suffix}
          </span>
        </div>
      )}
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={cn(
          "h-1.5 w-full cursor-pointer appearance-none rounded-full",
          "bg-gradient-to-r from-primary to-primary",
          "range-track-fill"
        )}
        style={{
          background: `linear-gradient(to right, var(--primary) ${pct}%, var(--surface-3) ${pct}%)`,
        }}
        aria-label={label}
      />
    </div>
  );
}
