"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  PenLine,
  X,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { TopNav } from "@/components/navigation";
import { http, ApiError } from "@/lib/http";

interface TripOption {
  id: string;
  destination: string;
  origin: string;
  created_at: string;
}

const SUGGESTED_TAGS = [
  "budget",
  "solo",
  "beach",
  "culture",
  "food",
  "adventure",
  "city",
  "nature",
  "weekend",
  "backpacking",
];

export default function NewExperiencePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefillTripId = searchParams.get("trip_id");

  const [trips, setTrips] = useState<TripOption[]>([]);
  const [tripsLoading, setTripsLoading] = useState(true);

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [city, setCity] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [selectedTripId, setSelectedTripId] = useState<string>(prefillTripId ?? "");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  const [previewing, setPreviewing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    http
      .get<TripOption[]>("/trips")
      .then(setTrips)
      .catch(() => setTrips([]))
      .finally(() => setTripsLoading(false));
  }, []);

  function addTag(raw: string) {
    const tag = raw.trim().toLowerCase();
    if (!tag || tags.includes(tag) || tags.length >= 8) return;
    setTags((prev) => [...prev, tag]);
    setTagInput("");
  }

  function removeTag(tag: string) {
    setTags((prev) => prev.filter((t) => t !== tag));
  }

  const isValid = title.trim().length >= 3 && body.trim().length >= 10;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid || submitting) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const payload = {
        title: title.trim(),
        body: body.trim(),
        city: city.trim() || null,
        cover_image_url: coverUrl.trim() || null,
        tags,
        trip_id: selectedTripId || null,
      };
      const created = await http.post<{ id: string }>("/experiences", payload);
      router.push(`/experiences/${created.id}`);
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 401) {
        router.push("/login?next=/experiences/new");
        return;
      }
      setSubmitError(err instanceof ApiError ? err.message : "Failed to publish.");
    } finally {
      setSubmitting(false);
    }
  }

  const bodyParagraphs = body.split(/\n\n+/).filter(Boolean);

  return (
    <div className="min-h-screen bg-neutral-50">
      <TopNav />

      <main className="mx-auto max-w-[760px] px-4 py-8 pb-24 lg:py-12">
        {/* Back */}
        <Link
          href="/experiences"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-neutral-500 transition-colors hover:text-sky-600"
        >
          <ArrowLeft className="size-4" strokeWidth={2} />
          Back to experiences
        </Link>

        {/* Page title */}
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-sky-600">
            Community
          </p>
          <h1 className="mt-1 font-display text-[28px] font-bold text-neutral-900">
            Share your experience
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Tell other student travellers about your adventure.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <FormSection label="Title" required>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. 3 Days in Kyoto on a €200 Budget"
              maxLength={200}
              className="w-full rounded-xl border border-neutral-200 bg-white px-4 h-11 text-sm text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-200 transition"
            />
            <p className="mt-1 text-right text-[11px] text-neutral-400">
              {title.length}/200
            </p>
          </FormSection>

          {/* City */}
          <FormSection label="City / Destination">
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g. Kyoto, Japan"
              className="w-full rounded-xl border border-neutral-200 bg-white px-4 h-11 text-sm text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-200 transition"
            />
          </FormSection>

          {/* Linked trip */}
          <FormSection label="Link to a trip (optional)">
            <select
              value={selectedTripId}
              onChange={(e) => setSelectedTripId(e.target.value)}
              className="w-full rounded-xl border border-neutral-200 bg-white px-4 h-11 text-sm text-neutral-800 focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-200 transition appearance-none"
            >
              <option value="">— None —</option>
              {tripsLoading ? (
                <option disabled>Loading trips…</option>
              ) : (
                trips.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.origin} → {t.destination}
                  </option>
                ))
              )}
            </select>
            <p className="mt-1 text-[11px] text-neutral-400">
              Linking a trip lets readers save your full itinerary.
            </p>
          </FormSection>

          {/* Cover image URL */}
          <FormSection label="Cover image URL (optional)">
            <input
              type="url"
              value={coverUrl}
              onChange={(e) => setCoverUrl(e.target.value)}
              placeholder="https://…"
              className="w-full rounded-xl border border-neutral-200 bg-white px-4 h-11 text-sm text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-200 transition"
            />
          </FormSection>

          {/* Tags */}
          <FormSection label="Tags">
            <div className="flex flex-wrap gap-1.5 mb-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-full bg-sky-100 border border-sky-300 px-2.5 py-0.5 text-xs font-semibold text-sky-700"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="ml-0.5 text-sky-500 hover:text-sky-800"
                  >
                    <X className="size-2.5" strokeWidth={2.5} />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag(tagInput);
                  }
                }}
                placeholder="Add a tag and press Enter"
                className="flex-1 rounded-xl border border-neutral-200 bg-white px-3 h-9 text-sm text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-200 transition"
              />
              <button
                type="button"
                onClick={() => addTag(tagInput)}
                className="inline-flex items-center justify-center rounded-lg bg-neutral-100 hover:bg-sky-100 text-neutral-600 hover:text-sky-600 size-9 transition-colors"
              >
                <Plus className="size-4" strokeWidth={2} />
              </button>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {SUGGESTED_TAGS.filter((t) => !tags.includes(t)).map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => addTag(tag)}
                  className="h-6 rounded-full border border-neutral-200 bg-white px-2.5 text-[11px] font-medium text-neutral-500 transition-colors hover:border-sky-300 hover:text-sky-700"
                >
                  +{tag}
                </button>
              ))}
            </div>
          </FormSection>

          {/* Body editor */}
          <FormSection label="Your story" required>
            <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden focus-within:border-sky-400 focus-within:ring-2 focus-within:ring-sky-200 transition">
              {/* Toolbar */}
              <div className="flex items-center justify-between border-b border-neutral-100 px-3 py-2">
                <span className="text-xs font-medium text-neutral-400">
                  Plain text · Double blank line = new paragraph
                </span>
                <button
                  type="button"
                  onClick={() => setPreviewing((v) => !v)}
                  className="inline-flex items-center gap-1.5 rounded-md px-2.5 h-7 text-xs font-semibold text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-sky-700"
                >
                  {previewing ? (
                    <>
                      <EyeOff className="size-3.5" strokeWidth={2} />
                      Edit
                    </>
                  ) : (
                    <>
                      <Eye className="size-3.5" strokeWidth={2} />
                      Preview
                    </>
                  )}
                </button>
              </div>

              {previewing ? (
                <div className="min-h-[240px] px-4 py-4 text-[15px] leading-relaxed text-neutral-700 space-y-4">
                  {bodyParagraphs.length > 0 ? (
                    bodyParagraphs.map((para, i) => (
                      <p key={i} className="whitespace-pre-wrap">
                        {para}
                      </p>
                    ))
                  ) : (
                    <p className="text-neutral-400 italic">Nothing to preview yet…</p>
                  )}
                </div>
              ) : (
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Tell your story here. Write freely — describe the places, the food, the people, the surprises…"
                  rows={12}
                  className="w-full resize-none px-4 py-4 text-sm text-neutral-800 placeholder:text-neutral-400 focus:outline-none bg-transparent"
                />
              )}
            </div>
            <p className="mt-1 text-right text-[11px] text-neutral-400">
              {body.length} chars · min. 10
            </p>
          </FormSection>

          {submitError && (
            <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
              {submitError}
            </div>
          )}

          {/* Submit */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={!isValid || submitting}
              className={cn(
                "inline-flex items-center gap-2 rounded-xl px-6 h-11 text-sm font-semibold text-white transition-all duration-200",
                isValid && !submitting
                  ? "bg-sky-500 hover:bg-sky-600 hover:scale-[1.02] active:scale-[0.98]"
                  : "bg-sky-300 cursor-not-allowed"
              )}
            >
              {submitting ? (
                <span className="size-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              ) : (
                <PenLine className="size-4" strokeWidth={2} />
              )}
              {submitting ? "Publishing…" : "Publish Experience"}
            </button>
            <Link
              href="/experiences"
              className="text-sm font-medium text-neutral-500 transition-colors hover:text-neutral-700"
            >
              Cancel
            </Link>
          </div>
        </form>
      </main>
    </div>
  );
}

function FormSection({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm">
      <label className="mb-2.5 block text-sm font-semibold text-neutral-700">
        {label}
        {required && <span className="ml-0.5 text-sky-500">*</span>}
      </label>
      {children}
    </div>
  );
}
