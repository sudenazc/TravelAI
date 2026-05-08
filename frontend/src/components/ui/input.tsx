"use client";

import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type InputState = "default" | "error" | "success";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  state?: InputState;
  leftIcon?: ReactNode;
  rightSlot?: ReactNode;
}

const stateStyles: Record<InputState, string> = {
  default:
    "border-neutral-200 focus:border-sky-500 focus:ring-3 focus:ring-sky-200",
  error:
    "border-error-600 focus:border-error-600 focus:ring-3 focus:ring-error-100",
  success: "border-success-600 focus:border-success-600",
};

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      hint,
      state = "default",
      leftIcon,
      rightSlot,
      id,
      className,
      ...props
    },
    ref
  ) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-neutral-700"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <span className="pointer-events-none absolute left-4 text-neutral-400">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              "h-11 w-full rounded-md border bg-white px-4 text-base text-neutral-800",
              "placeholder:text-neutral-400 outline-none transition-all duration-normal",
              "disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-400",
              stateStyles[state],
              leftIcon && "pl-11",
              rightSlot && "pr-16",
              className
            )}
            {...props}
          />
          {rightSlot && (
            <span className="absolute right-2">{rightSlot}</span>
          )}
        </div>
        {hint && (
          <p
            className={cn(
              "text-sm",
              state === "error" ? "text-error-600" : "text-neutral-500"
            )}
          >
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input, type InputProps, type InputState };
