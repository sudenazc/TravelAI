"use client";

import { User, Clock, MapPin } from "lucide-react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";

export interface LocalHelper {
  id: string;
  full_name: string | null;
  helper_region: string;
  helper_bio: string | null;
  helper_availability: string | null;
}

interface LocalHelperCardProps {
  helper: LocalHelper;
  onConnect: (helper: LocalHelper) => void;
  className?: string;
}

export function LocalHelperCard({ helper, onConnect, className }: LocalHelperCardProps) {
  const name = helper.full_name ?? "Local Student Guide";
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div
      className={cn(
        "flex items-start gap-4 rounded-2xl border border-sky-200 bg-sky-50 p-4",
        "shadow-[var(--shadow-sm)] transition-shadow hover:shadow-[var(--shadow-md)]",
        className
      )}
    >
      {/* Avatar */}
      <div
        className="flex size-12 shrink-0 items-center justify-center rounded-full bg-sky-200 font-display text-base font-bold text-sky-700"
        aria-hidden="true"
      >
        {initials || <User className="size-5 text-sky-600" strokeWidth={1.75} />}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-sky-200 px-2 py-0.5 text-[11px] font-semibold text-sky-700">
            <User className="size-3" strokeWidth={2} />
            Local Guide
          </span>
        </div>
        <p className="font-display text-sm font-semibold text-neutral-800 leading-snug">
          {name}
        </p>
        {helper.helper_bio && (
          <p className="text-xs text-neutral-500 line-clamp-2 leading-relaxed">
            {helper.helper_bio}
          </p>
        )}
        <div className="flex flex-wrap gap-x-3 gap-y-1 pt-0.5">
          {helper.helper_region && (
            <span className="flex items-center gap-1 text-[11px] text-neutral-400">
              <MapPin className="size-3" strokeWidth={1.75} />
              {helper.helper_region}
            </span>
          )}
          {helper.helper_availability && (
            <span className="flex items-center gap-1 text-[11px] text-neutral-400">
              <Clock className="size-3" strokeWidth={1.75} />
              {helper.helper_availability}
            </span>
          )}
        </div>
      </div>

      {/* CTA */}
      <Button
        variant="primary"
        size="sm"
        onClick={() => onConnect(helper)}
        className="shrink-0 self-center"
      >
        Connect
      </Button>
    </div>
  );
}
