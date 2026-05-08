"use client";

import { forwardRef, type InputHTMLAttributes } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

interface SearchInputProps extends InputHTMLAttributes<HTMLInputElement> {
  onSearch?: (value: string) => void;
}

const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ onSearch, className, ...props }, ref) => (
    <div
      className={cn(
        "relative flex items-center gap-2 rounded-full border-2 border-sky-200",
        "bg-white shadow-sm px-4",
        "h-14 md:h-16",
        className
      )}
    >
      <Search className="size-5 shrink-0 text-neutral-400" strokeWidth={1.75} />
      <input
        ref={ref}
        className={cn(
          "flex-1 bg-transparent py-0 text-base text-neutral-800 outline-none",
          "placeholder:text-neutral-400"
        )}
        {...props}
      />
      <Button
        variant="primary"
        size="md"
        className="shrink-0 rounded-full"
        onClick={() => {
          const input = ref && "current" in ref ? ref.current : null;
          onSearch?.(input?.value ?? "");
        }}
      >
        Plan trip
      </Button>
    </div>
  )
);

SearchInput.displayName = "SearchInput";

export { SearchInput };
