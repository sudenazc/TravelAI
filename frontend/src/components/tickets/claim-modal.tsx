"use client";

import { useEffect, useRef } from "react";
import {
  X,
  MapPin,
  CalendarDays,
  Building2,
  CheckCircle2,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { ClaimedOpportunityResponse, OpportunityResponse } from "@/types/tickets";

type ModalState = "confirm" | "loading" | "success";

interface ClaimModalProps {
  opportunity: OpportunityResponse | null;
  state: ModalState;
  claimedData: ClaimedOpportunityResponse | null;
  onConfirm: () => void;
  onClose: () => void;
}

function QrCodeDisplay({ code }: { code: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="rounded-xl border-2 border-dashed border-sky-200 bg-sky-50 px-6 py-5 text-center">
        <p className="font-mono text-xs text-neutral-400 uppercase tracking-widest mb-1">
          Claim Code
        </p>
        <p className="font-mono text-xl font-bold tracking-widest text-sky-700 break-all">
          {code}
        </p>
      </div>
      <p className="text-xs text-neutral-400 text-center">
        Show this code to the provider to redeem your offer.
      </p>
    </div>
  );
}

export function ClaimModal({
  opportunity,
  state,
  claimedData,
  onConfirm,
  onClose,
}: ClaimModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!opportunity) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && state !== "loading") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [opportunity, state, onClose]);

  if (!opportunity) return null;

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
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="claim-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === overlayRef.current && state !== "loading") onClose();
      }}
    >
      <div className="absolute inset-0 bg-neutral-900/50 backdrop-blur-sm" />

      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl">
        {state !== "success" && (
          <button
            onClick={onClose}
            disabled={state === "loading"}
            aria-label="Close"
            className={cn(
              "absolute right-4 top-4 z-10 flex size-8 items-center justify-center rounded-full",
              "text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700",
              "transition-colors focus-visible:outline-2 focus-visible:outline-sky-500",
              "disabled:pointer-events-none"
            )}
          >
            <X className="size-4" strokeWidth={2} />
          </button>
        )}

        {state === "success" && claimedData ? (
          <div className="flex flex-col gap-5 px-6 py-8">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="flex size-16 items-center justify-center rounded-full bg-emerald-100">
                <CheckCircle2 className="size-8 text-emerald-500" strokeWidth={1.75} />
              </div>
              <div>
                <h2
                  id="claim-modal-title"
                  className="font-display text-xl font-bold text-neutral-900"
                >
                  Opportunity Claimed!
                </h2>
                <p className="mt-1 text-sm text-neutral-500">
                  Your claim code has been saved to your wallet.
                </p>
              </div>
              <p className="text-sm font-medium text-neutral-700 max-w-xs">
                {claimedData.title}
              </p>
            </div>

            {claimedData.claim_code && (
              <QrCodeDisplay code={claimedData.claim_code} />
            )}

            <Button variant="primary" size="md" onClick={onClose} className="w-full">
              View in Wallet
            </Button>
          </div>
        ) : (
          <div className="px-5 py-6">
            <h2
              id="claim-modal-title"
              className="font-display text-lg font-bold text-neutral-900 mb-4 pr-8"
            >
              {opportunity.title}
            </h2>

            <div className="flex flex-col gap-2 text-sm text-neutral-600 mb-5">
              <div className="flex items-center gap-2">
                <MapPin className="size-4 shrink-0 text-neutral-400" strokeWidth={1.75} />
                <span>{opportunity.city}</span>
              </div>
              {opportunity.provider_name && (
                <div className="flex items-center gap-2">
                  <Building2 className="size-4 shrink-0 text-neutral-400" strokeWidth={1.75} />
                  <span>{opportunity.provider_name}</span>
                </div>
              )}
              {eventDateLabel && (
                <div className="flex items-center gap-2">
                  <CalendarDays className="size-4 shrink-0 text-neutral-400" strokeWidth={1.75} />
                  <span>{eventDateLabel}</span>
                </div>
              )}
            </div>

            {opportunity.description && (
              <p className="text-sm text-neutral-500 mb-5 leading-relaxed">
                {opportunity.description}
              </p>
            )}

            <div className="flex items-center justify-between rounded-xl bg-sky-50 px-4 py-3 mb-5">
              <div className="flex items-center gap-2 text-sm font-medium text-neutral-700">
                <Tag className="size-4 text-sky-500" strokeWidth={1.75} />
                <span>Your price</span>
              </div>
              <div className="flex items-center gap-2">
                {originalPriceDisplay && (
                  <span className="text-sm text-neutral-400 line-through">
                    {originalPriceDisplay}
                  </span>
                )}
                <span
                  className={cn(
                    "font-display text-xl font-bold",
                    opportunity.is_free ? "text-emerald-600" : "text-sky-600"
                  )}
                >
                  {priceDisplay}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="secondary"
                size="md"
                onClick={onClose}
                disabled={state === "loading"}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={onConfirm}
                isLoading={state === "loading"}
                disabled={state === "loading"}
                className="flex-1"
              >
                {state === "loading" ? "Claiming…" : "Claim Now"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
