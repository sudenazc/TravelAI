"use client";

import { useState, useRef, useEffect, type KeyboardEvent } from "react";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading?: boolean;
  placeholder?: string;
  className?: string;
}

export function ChatInput({
  onSend,
  isLoading = false,
  placeholder = "Ask anything about your trip...",
  className,
}: ChatInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
  }, [value]);

  const handleSend = () => {
    if (!value.trim() || isLoading) return;
    onSend(value.trim());
    setValue("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      className={cn(
        "flex items-end gap-2 rounded-2xl border-2 border-sky-200 bg-white p-3 shadow-sm transition-all duration-200 focus-within:border-sky-500 focus-within:shadow-md",
        className
      )}
    >
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={1}
        disabled={isLoading}
        className="flex-1 resize-none bg-transparent text-sm leading-relaxed text-neutral-800 placeholder:text-neutral-400 focus:outline-none disabled:opacity-60"
        style={{ minHeight: "24px" }}
      />
      <button
        onClick={handleSend}
        disabled={!value.trim() || isLoading}
        className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-sky-500 text-white transition-all duration-200 hover:bg-sky-600 hover:shadow-brand active:scale-95 disabled:bg-neutral-200 disabled:text-neutral-400 disabled:shadow-none"
      >
        {isLoading ? (
          <span className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
        ) : (
          <Send className="size-4" strokeWidth={2} />
        )}
      </button>
    </div>
  );
}
