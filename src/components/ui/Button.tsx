"use client";

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "success" | "link";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-xl font-semibold select-none transition-all duration-150 disabled:pointer-events-none disabled:opacity-55 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/60 active:scale-[0.98]";

const variants: Record<Variant, string> = {
  primary:
    "bg-primary text-white shadow-sm hover:bg-primary-hover hover:shadow-md dark:bg-primary dark:hover:bg-primary-hover",
  secondary:
    "bg-surface text-content border border-line hover:border-line-strong hover:bg-surface-2 shadow-sm",
  ghost: "text-content hover:bg-surface-2",
  danger: "bg-danger text-white shadow-sm hover:brightness-110",
  success: "bg-success text-white shadow-sm hover:brightness-110",
  link: "text-primary hover:text-primary-dark underline-offset-4 hover:underline p-0 h-auto",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3.5 text-sm",
  md: "h-11 px-5 text-[15px]",
  lg: "h-[52px] px-6 text-base",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  href?: string;
  icon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading, href, icon, children, disabled, ...props }, ref) => {
    const classes = cn(base, variants[variant], sizes[size], className);

    const content = (
      <>
        {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : icon}
        {children}
      </>
    );

    if (href) {
      return (
        <Link
          href={href}
          className={cn(classes, disabled && "pointer-events-none opacity-55")}
          aria-disabled={disabled}
          onClick={disabled ? (e) => e.preventDefault() : undefined}
        >
          {content}
        </Link>
      );
    }

    return (
      <button ref={ref} className={classes} disabled={disabled || loading} {...props}>
        {content}
      </button>
    );
  }
);

Button.displayName = "Button";
