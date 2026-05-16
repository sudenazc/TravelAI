"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import {
  X,
  CalendarDays,
  Clock,
  MapPin,
  Ticket,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { EventResponse } from "@/types/tickets";

type ModalState = "confirm" | "loading" | "success";

interface BuyTicketModalProps {
  event: EventResponse | null;
  state: ModalState;
  onConfirm: () => void;
  onClose: () => void;
}

export function BuyTicketModal({
  event,
  state,
  onConfirm,
  onClose,
}: BuyTicketModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!event) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && state !== "loading") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [event, state, onClose]);

  if (!event) return null;

  const formattedPrice = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(event.price_usd);

  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
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

        {state === "success" ? (
          <div className="flex flex-col items-center gap-4 px-8 py-12 text-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle2 className="size-8 text-emerald-500" strokeWidth={1.75} />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold text-neutral-900">
                Ticket Confirmed!
              </h2>
              <p className="mt-1 text-sm text-neutral-500">
                Your ticket has been added to your wallet.
              </p>
            </div>
            <p className="max-w-xs text-sm font-medium text-neutral-700">
              {event.title}
            </p>
            <Button variant="primary" size="md" onClick={onClose} className="mt-2 w-full">
              View in Wallet
            </Button>
          </div>
        ) : (
          <>
            <div className="relative aspect-[16/7] overflow-hidden">
              <Image
                src={event.image_url}
                alt={event.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 448px"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[rgba(15,23,42,0.7)] to-transparent" />
              <div className="absolute bottom-4 left-5 right-5">
                <p className="font-display text-lg font-bold text-white leading-snug line-clamp-2">
                  {event.title}
                </p>
              </div>
            </div>

            <div className="px-5 py-5">
              <div className="flex flex-col gap-2 text-sm text-neutral-600 mb-5">
                <div className="flex items-center gap-2">
                  <CalendarDays className="size-4 shrink-0 text-neutral-400" strokeWidth={1.75} />
                  <span>{event.date}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="size-4 shrink-0 text-neutral-400" strokeWidth={1.75} />
                  <span>{event.time}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="size-4 shrink-0 text-neutral-400" strokeWidth={1.75} />
                  <span>{event.location}</span>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-sky-50 px-4 py-3 mb-5">
                <div className="flex items-center gap-2 text-sm font-medium text-neutral-700">
                  <Ticket className="size-4 text-sky-500" strokeWidth={1.75} />
                  <span>1 ticket</span>
                </div>
                <span className="font-display text-xl font-bold text-sky-600">
                  {formattedPrice}
                </span>
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
                  {state === "loading" ? "Processing…" : "Confirm Purchase"}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
