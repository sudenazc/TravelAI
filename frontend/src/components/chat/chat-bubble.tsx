import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatBubbleProps {
  role: "ai" | "user";
  content: string;
  className?: string;
}

export function ChatBubble({ role, content, className }: ChatBubbleProps) {
  if (role === "user") {
    return (
      <div className={cn("flex justify-end", className)}>
        <div className="max-w-[85%] rounded-[20px_20px_0_20px] bg-sky-500 px-[18px] py-[14px] text-base leading-relaxed text-white">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex items-start gap-3", className)}>
      <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-sky-500">
        <Sparkles className="size-4 text-white" strokeWidth={1.75} />
      </div>
      <div className="max-w-[85%] rounded-[0_20px_20px_20px] border border-neutral-100 bg-white px-[18px] py-[14px] text-base leading-relaxed text-neutral-700 shadow-xs">
        {content}
      </div>
    </div>
  );
}
