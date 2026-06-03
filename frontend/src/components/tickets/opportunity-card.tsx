"use client";

import { useEffect, useState } from "react";
import {
  MapPin,
  CalendarDays,
  Zap,
  Tag,
  Building2,
  Clock,
} from "lucide-react";
import { Badge } from "@/components/ui";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { OpportunityCategory, OpportunityResponse } from "@/types/tickets";

interface OpportunityCardProps {
  opportunity: OpportunityResponse;
  onClaim: (id: string) => void;
  className?: string;
}

const categoryBadgeVariants: Record<
  OpportunityCategory,
  "primary" | "success" | "warning" | "neutral" | "error" | "dark"
> = {
  Museum: "primary",
  Concert: "success",
  Art: "warning",
  Hotel: "neutral",
  Workshop: "warning",
  Festival: "success",
  Networking: "primary",
};

function useCountdown(expiresAt: string | null): string | null {
  const [timeLeft, setTimeLeft] = useState<string | null>(null);

  useEffect(() => {
    if (!expiresAt) return;

    const update = () => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft("Expired");
        return;
      }
      const h = Math.floor(diff / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      const s = Math.floor((diff % 60_000) / 1000);
      if (h > 0) {
        setTimeLeft(`${h}h ${m}m left`);
      } else if (m > 0) {
        setTimeLeft(`${m}m ${s}s left`);
      } else {
        setTimeLeft(`${s}s left`);
      }
    };

    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  return timeLeft;
}

export function OpportunityCard({
  opportunity,
  onClaim,
  className,
}: OpportunityCardProps) {
  const countdown = useCountdown(
    opportunity.is_last_minute ? opportunity.expires_at : null
  );

  const priceDisplay = opportunity.is_free
    ? "Free"
    : opportunity.offer_price !== null && opportunity.offer_price !== undefined
    ? new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }).format(opportunity.offer_price)
    : null;

  const originalPriceDisplay =
    !opportunity.is_free &&
    opportunity.original_price !== null &&
    opportunity.original_price !== undefined
      ? new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
          maximumFractionDigits: 0,
        }).format(opportunity.original_price)
      : null;

  const eventDateLabel = opportunity.event_date
    ? new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(new Date(opportunity.event_date))
    : null;

  return (
    <article
      className={cn(
        "group flex flex-col overflow-hidden rounded-xl border border-neutral-100",
        "bg-white shadow-sm transition-all duration-200",
        "hover:-translate-y-1 hover:shadow-md",
        opportunity.is_last_minute && "border-amber-200",
        className
      )}
    >
      {/* Card header */}
      <div
        className={cn(
          "relative flex items-start justify-between gap-2 px-4 pt-4 pb-3",
          opportunity.is_last_minute && "bg-amber-50"
        )}
      >
        <Badge variant={categoryBadgeVariants[opportunity.category]}>
          {opportunity.category}
        </Badge>

        {opportunity.is_last_minute && countdown && (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700 shrink-0">
            <Zap className="size-3" strokeWidth={2} />
            {countdown}
          </span>
        )}
      </div>

      {/* Card body */}
      <div className="flex flex-1 flex-col gap-3 px-4 pb-4">
        <h3 className="font-display text-base font-semibold text-neutral-900 line-clamp-2 leading-snug">
          {opportunity.title}
        </h3>

        {opportunity.description && (
          <p className="text-xs text-neutral-500 line-clamp-2">
            {opportunity.description}
          </p>
        )}

        <div className="flex flex-col gap-1.5 text-sm text-neutral-500">
          <div className="flex items-center gap-1.5">
            <MapPin className="size-3.5 shrink-0" strokeWidth={1.75} />
            <span className="line-clamp-1">{opportunity.city}</span>
          </div>
          {opportunity.provider_name && (
            <div className="flex items-center gap-1.5">
              <Building2 className="size-3.5 shrink-0" strokeWidth={1.75} />
              <span className="line-clamp-1">{opportunity.provider_name}</span>
            </div>
          )}
          {eventDateLabel && (
            <div className="flex items-center gap-1.5">
              <CalendarDays className="size-3.5 shrink-0" strokeWidth={1.75} />
              <span>{eventDateLabel}</span>
            </div>
          )}
          {!opportunity.is_last_minute && opportunity.expires_at && (
            <div className="flex items-center gap-1.5 text-neutral-400">
              <Clock className="size-3.5 shrink-0" strokeWidth={1.75} />
              <span>
                Expires{" "}
                {new Intl.DateTimeFormat("en-US", {
                  month: "short",
                  day: "numeric",
                }).format(new Date(opportunity.expires_at))}
              </span>
            </div>
          )}
        </div>

        {/* Price + CTA */}
        <div className="mt-auto flex items-center justify-between pt-3 border-t border-neutral-100">
          <div className="flex flex-col">
            {originalPriceDisplay && (
              <span className="text-xs text-neutral-400 line-through">
                {originalPriceDisplay}
              </span>
            )}
            <div className="flex items-center gap-1.5">
              <Tag className="size-3.5 text-emerald-500 shrink-0" strokeWidth={2} />
              <span
                className={cn(
                  "font-display text-lg font-bold",
                  opportunity.is_free ? "text-emerald-600" : "text-sky-600"
                )}
              >
                {priceDisplay}
              </span>
            </div>
          </div>

          <Button
            size="sm"
            variant="primary"
            onClick={() => onClaim(opportunity.id)}
            aria-label={`Claim ${opportunity.title}`}
          >
            Claim
          </Button>
        </div>
      </div>
    </article>
  );
}
