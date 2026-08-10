"use client";

import { useId, type ReactNode, type SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Option {
  value: string;
  label: string;
  hint?: string;
  disabled?: boolean;
}

export function Select({
  options,
  value,
  onChange,
  placeholder,
  label,
  className,
  disabled,
  groups,
  ...props
}: {
  options?: Option[];
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  label?: string;
  groups?: { label: string; options: Option[] }[];
  className?: string;
} & Omit<SelectHTMLAttributes<HTMLSelectElement>, "onChange" | "value">) {
  const id = useId();
  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-content">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={id}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            "h-11 w-full cursor-pointer appearance-none rounded-xl border border-line bg-surface px-3.5 pr-10 text-[15px] font-medium text-content transition-colors hover:border-line-strong focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-primary/50 disabled:cursor-not-allowed disabled:opacity-55",
            !value && "text-muted"
          )}
          {...props}
        >
          {placeholder && <option value="" disabled>{placeholder}</option>}
          {groups
            ? groups.map((g) => (
                <optgroup key={g.label} label={g.label}>
                  {g.options.map((o) => (
                    <option key={o.value} value={o.value} disabled={o.disabled}>
                      {o.label}
                      {o.hint ? ` — ${o.hint}` : ""}
                    </option>
                  ))}
                </optgroup>
              ))
            : options?.map((o) => (
                <option key={o.value} value={o.value} disabled={o.disabled}>
                  {o.label}
                  {o.hint ? ` — ${o.hint}` : ""}
                </option>
              ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted"
          aria-hidden
        />
      </div>
    </div>
  );
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
  className,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: ReactNode; disabled?: boolean }[];
  label?: string;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {label && <span className="block text-sm font-medium text-content">{label}</span>}
      <div role="radiogroup" aria-label={label} className="grid grid-flow-col auto-cols-fr rounded-xl bg-surface-2 p-1">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={value === o.value}
            disabled={o.disabled}
            onClick={() => onChange(o.value)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-semibold transition-all duration-150 disabled:opacity-40",
              value === o.value
                ? "bg-surface text-content shadow-sm"
                : "text-muted hover:text-content"
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function RadioCard<T extends string>({
  value,
  selected,
  onChange,
  title,
  desc,
}: {
  value: T;
  selected: T;
  onChange: (v: T) => void;
  title: ReactNode;
  desc?: ReactNode;
}) {
  const checked = value === selected;
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      onClick={() => onChange(value)}
      className={cn(
        "w-full rounded-xl border-2 p-3 text-left transition-all duration-150",
        checked
          ? "border-primary bg-primary-soft/50 dark:bg-primary-soft/40"
          : "border-line bg-surface hover:border-line-strong"
      )}
    >
      <span className="block text-sm font-semibold text-content">{title}</span>
      {desc && <span className="mt-0.5 block text-xs text-muted">{desc}</span>}
    </button>
  );
}
