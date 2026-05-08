"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "cta";
type ButtonSize = "sm" | "md" | "lg" | "xl";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-sky-500 text-white font-semibold hover:bg-sky-600 active:bg-sky-700 hover:shadow-brand disabled:bg-neutral-300 disabled:text-neutral-500",
  secondary:
    "bg-white border border-neutral-200 text-neutral-700 font-semibold hover:border-sky-300 hover:text-sky-600 disabled:opacity-50",
  ghost:
    "bg-transparent text-sky-600 font-semibold hover:bg-sky-50 disabled:opacity-50",
  cta: "text-white font-bold [background:var(--gradient-cta)] shadow-brand hover:opacity-90",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-8 px-[14px] text-[13px] rounded-md",
  md: "h-10 px-5 text-sm rounded-md",
  lg: "h-12 px-6 text-base rounded-md",
  xl: "h-14 px-8 text-lg rounded-full",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      isLoading = false,
      className,
      disabled,
      children,
      ...props
    },
    ref
  ) => (
    <button
      ref={ref}
      disabled={disabled || isLoading}
      className={cn(
        "inline-flex items-center justify-center gap-2 transition-all duration-normal",
        "hover:scale-[1.02] active:scale-[0.98]",
        "focus-visible:outline-2 focus-visible:outline-sky-500 focus-visible:outline-offset-2",
        "disabled:cursor-not-allowed disabled:transform-none",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {isLoading ? (
        <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : null}
      {children}
    </button>
  )
);

Button.displayName = "Button";

export { Button, type ButtonProps, type ButtonVariant, type ButtonSize };
