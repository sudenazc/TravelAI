import { Sparkles } from "lucide-react";

export function TypingIndicator() {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-sky-500">
        <Sparkles className="size-4 text-white" strokeWidth={1.75} />
      </div>
      <div className="rounded-[0_20px_20px_20px] border border-neutral-100 bg-white px-[18px] py-[14px] shadow-xs">
        <div className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-sky-300 animate-bounce [animation-delay:0ms]" />
          <span className="size-2 rounded-full bg-sky-400 animate-bounce [animation-delay:150ms]" />
          <span className="size-2 rounded-full bg-sky-500 animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
}
