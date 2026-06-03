"use client";

import { useEffect, useRef, useState } from "react";
import { X, User, MapPin, Clock, MessageSquare, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";
import { http } from "@/lib/http";
import type { LocalHelper } from "./local-helper-card";

type ModalState = "idle" | "loading" | "success" | "error";

interface HelperModalProps {
  helper: LocalHelper | null;
  tripId?: string | null;
  onClose: () => void;
}

export function HelperModal({ helper, tripId, onClose }: HelperModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [message, setMessage] = useState("");
  const [state, setState] = useState<ModalState>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!helper) return;
    setState("idle");
    setMessage("");
    setErrorMsg("");
  }, [helper]);

  useEffect(() => {
    if (!helper) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && state !== "loading") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [helper, state, onClose]);

  if (!helper) return null;

  const name = helper.full_name ?? "Local Student Guide";
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const handleBook = async () => {
    setState("loading");
    setErrorMsg("");
    try {
      await http.post(`/locals/book/${helper.id}`, {
        trip_id: tripId ?? null,
        message: message.trim() || null,
      });
      setState("success");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setErrorMsg(msg);
      setState("error");
    }
  };

  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="helper-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === overlayRef.current && state !== "loading") onClose();
      }}
    >
      <div className="absolute inset-0 bg-neutral-900/50 backdrop-blur-sm" />

      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-[var(--shadow-xl)]">
        {state !== "loading" && (
          <button
            onClick={onClose}
            aria-label="Close"
            className={cn(
              "absolute right-4 top-4 z-10 flex size-8 items-center justify-center rounded-full",
              "text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700",
              "transition-colors focus-visible:outline-2 focus-visible:outline-sky-500"
            )}
          >
            <X className="size-4" strokeWidth={2} />
          </button>
        )}

        {state === "success" ? (
          <div className="flex flex-col items-center gap-4 px-8 py-12 text-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-[var(--success-100)]">
              <CheckCircle2 className="size-8 text-[var(--success-600)]" strokeWidth={1.75} />
            </div>
            <div>
              <h2
                id="helper-modal-title"
                className="font-display text-xl font-bold text-neutral-900"
              >
                Booking Sent!
              </h2>
              <p className="mt-1 text-sm text-neutral-500">
                Your request has been sent to <strong>{name}</strong>. You&apos;ll be notified once
                they respond.
              </p>
            </div>
            <Button variant="primary" size="md" onClick={onClose} className="mt-2 w-full">
              Done
            </Button>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="[background:var(--gradient-subtle)] px-5 py-6">
              <div className="flex items-center gap-4">
                <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-sky-200 font-display text-lg font-bold text-sky-700">
                  {initials || <User className="size-6 text-sky-600" strokeWidth={1.75} />}
                </div>
                <div className="min-w-0">
                  <h2
                    id="helper-modal-title"
                    className="font-display text-lg font-bold text-neutral-900 leading-snug"
                  >
                    {name}
                  </h2>
                  <span className="inline-flex items-center gap-1 rounded-full bg-sky-200 px-2 py-0.5 text-[11px] font-semibold text-sky-700">
                    <User className="size-3" strokeWidth={2} />
                    Local Guide
                  </span>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="px-5 py-5 space-y-4">
              {/* Bio */}
              {helper.helper_bio && (
                <p className="text-sm text-neutral-600 leading-relaxed">{helper.helper_bio}</p>
              )}

              {/* Meta */}
              <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-neutral-500">
                {helper.helper_region && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="size-4 text-neutral-400" strokeWidth={1.75} />
                    {helper.helper_region}
                  </span>
                )}
                {helper.helper_availability && (
                  <span className="flex items-center gap-1.5">
                    <Clock className="size-4 text-neutral-400" strokeWidth={1.75} />
                    {helper.helper_availability}
                  </span>
                )}
              </div>

              {/* Message */}
              <div className="space-y-1.5">
                <label
                  htmlFor="booking-message"
                  className="flex items-center gap-1.5 text-xs font-semibold text-neutral-700"
                >
                  <MessageSquare className="size-3.5" strokeWidth={1.75} />
                  Message (optional)
                </label>
                <textarea
                  id="booking-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  disabled={state === "loading"}
                  placeholder="Hey! I'm visiting your city next week and would love a local guide…"
                  rows={3}
                  className={cn(
                    "w-full resize-none rounded-xl border border-neutral-200 bg-neutral-50 px-3.5 py-2.5",
                    "text-sm text-neutral-800 placeholder:text-neutral-400",
                    "transition-colors focus:border-sky-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-300/30",
                    "disabled:opacity-60"
                  )}
                />
              </div>

              {/* Error */}
              {state === "error" && errorMsg && (
                <p className="rounded-xl bg-[var(--error-100)] px-3.5 py-2.5 text-xs font-medium text-[var(--error-600)]">
                  {errorMsg}
                </p>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-1">
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
                  onClick={handleBook}
                  disabled={state === "loading"}
                  className="flex-1"
                >
                  {state === "loading" ? (
                    <>
                      <Loader2 className="size-4 animate-spin" strokeWidth={2} />
                      Sending…
                    </>
                  ) : (
                    "Send Request"
                  )}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
