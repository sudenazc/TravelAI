"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  DollarSign,
  Plane,
  AlertCircle,
  Share2,
  Plus,
  Tag,
  Ticket,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { TopNav } from "@/components/navigation";
import { http } from "@/lib/http";
import { LocalHelperCard, HelperModal } from "@/components/locals";
import type { LocalHelper } from "@/components/locals";
import { ClaimModal } from "@/components/tickets/claim-modal";
import type {
  ClaimedOpportunityResponse,
  OpportunityResponse,
} from "@/types/tickets";

// ── Types ─────────────────────────────────────────────────────────────────────

type ActivityType = "hotel" | "food" | "transport" | "activity" | "local_activity";

interface ActivityItem {
  time: string;
  name: string;
  type: ActivityType;
  description: string;
  cost_est: number;
  location?: string | null;
}

interface ItineraryDay {
  day: number;
  title: string;
  activities: ActivityItem[];
}

interface ItineraryData {
  destination: string;
  origin: string;
  duration_days: number;
  total_budget_est: number;
  currency: string;
  visa_info: string;
  accommodation_summary: string;
  transport_tips: string;
  days: ItineraryDay[];
}

interface TripResponse {
  id: string;
  destination: string;
  origin: string;
  duration_days: number | null;
  total_budget_est: number | null;
  itinerary_data: ItineraryData;
  created_at: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const ACTIVITY_ICON: Record<ActivityType, string> = {
  hotel: "🏨",
  food: "🍜",
  transport: "🚄",
  activity: "📍",
  local_activity: "🎓",
};

const ACTIVITY_COLOR: Record<ActivityType, string> = {
  hotel: "bg-amber-50 ring-amber-200 text-amber-600",
  food: "bg-orange-50 ring-orange-200 text-orange-600",
  transport: "bg-blue-50 ring-blue-200 text-blue-600",
  activity: "bg-sky-50 ring-sky-200 text-sky-600",
  local_activity: "bg-violet-50 ring-violet-200 text-violet-600",
};

// ── Sub-components ─────────────────────────────────────────────────────────────

function InfoCard({
  icon,
  label,
  text,
}: {
  icon: string;
  label: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-xs">
      <div className="mb-2 flex items-center gap-2">
        <span className="text-lg">{icon}</span>
        <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">
          {label}
        </p>
      </div>
      <p className="text-sm leading-relaxed text-neutral-700">{text}</p>
    </div>
  );
}

function BudgetBreakdown({ days }: { days: ItineraryDay[] }) {
  const byType = days.flatMap((d) => d.activities).reduce<Record<string, number>>(
    (acc, a) => {
      const key = a.type.replace("_", " ");
      acc[key] = (acc[key] ?? 0) + a.cost_est;
      return acc;
    },
    {}
  );

  const total = Object.values(byType).reduce((s, v) => s + v, 0);
  if (total === 0) return null;

  const icons: Record<string, string> = {
    hotel: "🏨",
    food: "🍜",
    transport: "🚄",
    activity: "📍",
    "local activity": "🎓",
  };

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-xs">
      <div className="mb-4 flex items-center gap-2">
        <span className="text-lg">💰</span>
        <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">
          Budget breakdown
        </p>
      </div>
      <ul className="space-y-2.5">
        {Object.entries(byType).map(([type, cost]) => (
          <li key={type} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm">{icons[type] ?? "📍"}</span>
              <span className="text-sm capitalize text-neutral-600">{type}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-1.5 w-24 overflow-hidden rounded-full bg-neutral-100">
                <div
                  className="h-full rounded-full bg-sky-400"
                  style={{ width: `${Math.round((cost / total) * 100)}%` }}
                />
              </div>
              <span className="w-14 text-right text-sm font-semibold text-sky-600">
                ~${cost.toLocaleString()}
              </span>
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex justify-between border-t border-neutral-100 pt-3">
        <span className="text-sm font-semibold text-neutral-700">Total estimated</span>
        <span className="font-display text-base font-bold text-sky-600">
          ~${total.toLocaleString()}
        </span>
      </div>
    </div>
  );
}

/** Parse helper metadata embedded in a local_activity slot by _inject_local_helpers.
 *  Only slots whose location field has the "helper_id:<uuid>" prefix are treated as helpers;
 *  AI-generated local_activity entries with a real address are rendered as plain activity cards.
 */
function parseHelperFromActivity(activity: ActivityItem): LocalHelper | null {
  if (activity.type !== "local_activity") return null;

  const rawId = activity.location ?? "";
  if (!rawId.startsWith("helper_id:")) return null;
  const helperId = rawId.slice("helper_id:".length).trim();
  if (!helperId) return null;

  const rawName = activity.name.replace(/^Meet Local Guide\s*[—-]\s*/i, "").trim();
  const [bioPart, availPart] = activity.description.split(" | Availability: ");

  return {
    id: helperId,
    full_name: rawName || null,
    helper_region: "",
    helper_bio: bioPart?.trim() || null,
    helper_availability: availPart?.trim() || null,
  };
}

function ActivityCard({
  activity,
  tripId,
  onConnectHelper,
}: {
  activity: ActivityItem;
  tripId: string;
  onConnectHelper: (helper: LocalHelper) => void;
}) {
  const helper = parseHelperFromActivity(activity);

  if (helper) {
    return (
      <div className="flex gap-4">
        <div className="relative z-10 mt-1 flex size-9 shrink-0 items-center justify-center rounded-full text-base shadow-xs ring-2 bg-violet-50 ring-violet-200 text-violet-600">
          🎓
        </div>
        <div className="flex-1">
          <LocalHelperCard helper={helper} onConnect={onConnectHelper} />
          <p className="mt-1 ml-1 font-mono text-xs text-neutral-400">{activity.time}</p>
        </div>
      </div>
    );
  }

  const color = ACTIVITY_COLOR[activity.type] ?? "bg-neutral-50 ring-neutral-200 text-neutral-600";
  return (
    <div className="flex gap-4">
      <div
        className={cn(
          "relative z-10 mt-1 flex size-9 shrink-0 items-center justify-center rounded-full text-base shadow-xs ring-2",
          color
        )}
      >
        {ACTIVITY_ICON[activity.type] ?? "📍"}
      </div>
      <div className="flex-1 rounded-xl border border-neutral-100 bg-white p-4 shadow-xs transition-shadow duration-200 hover:shadow-md">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold text-neutral-800">{activity.name}</p>
          <span className="shrink-0 font-mono text-xs text-neutral-400">{activity.time}</span>
        </div>
        {activity.description && (
          <p className="mt-1 text-xs leading-relaxed text-neutral-500">{activity.description}</p>
        )}
        <div className="mt-2.5 flex items-center justify-between">
          <p className="text-xs capitalize text-neutral-400">
            {activity.type.replace("_", " ")}
            {activity.location ? ` · ${activity.location}` : ""}
          </p>
          {activity.cost_est > 0 && (
            <span className="rounded-full bg-sky-50 px-2 py-0.5 text-xs font-semibold text-sky-600">
              ~${activity.cost_est}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function OpportunityHighlightCard({
  opportunity,
  onClaim,
}: {
  opportunity: OpportunityResponse;
  onClaim: (opp: OpportunityResponse) => void;
}) {
  const priceDisplay = opportunity.is_free
    ? "Free"
    : opportunity.offer_price != null
    ? `$${opportunity.offer_price.toLocaleString()}`
    : null;

  const originalDisplay =
    !opportunity.is_free && opportunity.original_price != null
      ? `$${opportunity.original_price.toLocaleString()}`
      : null;

  return (
    <div className="flex items-center gap-3 rounded-xl border border-neutral-100 bg-white p-3 shadow-xs transition-shadow hover:shadow-md">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-sky-50">
        <Ticket className="size-4 text-sky-500" strokeWidth={1.75} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-neutral-800">
          {opportunity.title}
        </p>
        <div className="mt-0.5 flex items-center gap-2">
          <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-500">
            {opportunity.category}
          </span>
          {opportunity.provider_name && (
            <span className="truncate text-[11px] text-neutral-400">
              {opportunity.provider_name}
            </span>
          )}
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        {originalDisplay && (
          <span className="text-[11px] text-neutral-400 line-through">
            {originalDisplay}
          </span>
        )}
        {priceDisplay && (
          <span
            className={cn(
              "text-sm font-bold",
              opportunity.is_free ? "text-emerald-600" : "text-sky-600"
            )}
          >
            {priceDisplay}
          </span>
        )}
        <button
          onClick={() => onClaim(opportunity)}
          className="mt-1 flex items-center gap-1 rounded-lg bg-sky-500 px-2.5 py-1 text-xs font-semibold text-white transition-all hover:bg-sky-600 active:scale-95"
        >
          <Tag className="size-3" strokeWidth={2} />
          Claim
        </button>
      </div>
    </div>
  );
}

function DealsSection({
  opportunities,
  onClaim,
}: {
  opportunities: OpportunityResponse[];
  onClaim: (opp: OpportunityResponse) => void;
}) {
  if (opportunities.length === 0) return null;

  return (
    <div className="rounded-2xl border border-sky-100 bg-sky-50/50 p-5 shadow-xs">
      <div className="mb-3 flex items-center gap-2">
        <span className="text-lg">🎟️</span>
        <p className="text-xs font-semibold uppercase tracking-widest text-sky-700">
          Deals at your destination
        </p>
      </div>
      <div className="space-y-2">
        {opportunities.map((opp) => (
          <OpportunityHighlightCard key={opp.id} opportunity={opp} onClaim={onClaim} />
        ))}
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-neutral-50">
      <TopNav />
      <div className="mx-auto max-w-6xl animate-pulse px-4 py-12 lg:px-8">
        <div className="mb-8 h-8 w-40 rounded-lg bg-neutral-200" />
        <div className="mb-4 h-52 rounded-2xl bg-neutral-200" />
        <div className="mt-6 grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 rounded-xl bg-neutral-200" />
          ))}
        </div>
        <div className="mt-6 flex gap-6">
          <div className="hidden w-20 flex-col gap-2 lg:flex">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 rounded-xl bg-neutral-200" />
            ))}
          </div>
          <div className="flex-1 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 rounded-xl bg-neutral-200" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="min-h-screen bg-neutral-50">
      <TopNav />
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-6 px-4 text-center">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-red-100">
          <AlertCircle className="size-8 text-red-500" strokeWidth={1.75} />
        </div>
        <div>
          <h2 className="font-display text-xl font-bold text-neutral-900">
            Trip not found
          </h2>
          <p className="mt-1 text-sm text-neutral-500">{message}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onRetry}
            className="rounded-xl border border-neutral-200 bg-white px-5 py-2 text-sm font-semibold text-neutral-700 transition-all hover:bg-neutral-50 active:scale-95"
          >
            Try again
          </button>
          <Link
            href="/my-trips"
            className="inline-flex items-center gap-2 rounded-xl bg-sky-500 px-5 py-2 text-sm font-semibold text-white transition-all hover:bg-sky-600 active:scale-95"
          >
            Back to My Trips
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function TripDetailPage() {
  const params = useParams();
  const router = useRouter();
  const tripId = typeof params.id === "string" ? params.id : params.id?.[0] ?? "";

  const [trip, setTrip] = useState<TripResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeDay, setActiveDay] = useState(1);
  const [copied, setCopied] = useState(false);
  const [selectedHelper, setSelectedHelper] = useState<LocalHelper | null>(null);

  // Opportunities / deals state
  const [opportunities, setOpportunities] = useState<OpportunityResponse[]>([]);
  const [claimTarget, setClaimTarget] = useState<OpportunityResponse | null>(null);
  const [claimState, setClaimState] = useState<"confirm" | "loading" | "success">("confirm");
  const [claimedData, setClaimedData] = useState<ClaimedOpportunityResponse | null>(null);

  const fetchOpportunities = (destination: string) => {
    http
      .get<OpportunityResponse[]>(`/opportunities?city=${encodeURIComponent(destination)}`)
      .then((data) => setOpportunities((data ?? []).slice(0, 3)))
      .catch(() => {/* non-critical — silently skip */});
  };

  const fetchTrip = () => {
    setLoading(true);
    setError(null);
    http
      .get<TripResponse>(`/trips/${tripId}`)
      .then((data) => {
        setTrip(data);
        setActiveDay(data.itinerary_data.days[0]?.day ?? 1);
        fetchOpportunities(data.destination);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (tripId) fetchTrip();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId]);

  const handleOpenClaim = (opp: OpportunityResponse) => {
    setClaimTarget(opp);
    setClaimState("confirm");
    setClaimedData(null);
  };

  const handleConfirmClaim = () => {
    if (!claimTarget) return;
    setClaimState("loading");
    http
      .post<ClaimedOpportunityResponse>(`/opportunities/claim/${claimTarget.id}`, {})
      .then((data) => {
        setClaimedData(data);
        setClaimState("success");
        setOpportunities((prev) => prev.filter((o) => o.id !== claimTarget.id));
      })
      .catch(() => {
        setClaimState("confirm");
      });
  };

  const handleCloseClaim = () => {
    if (claimState === "loading") return;
    setClaimTarget(null);
    setClaimedData(null);
    setClaimState("confirm");
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard not available */
    }
  };

  if (loading) return <LoadingSkeleton />;
  if (error || !trip) return <ErrorState message={error ?? "Trip not found."} onRetry={fetchTrip} />;

  const { itinerary_data: itinerary } = trip;
  const currentDay =
    itinerary.days.find((d) => d.day === activeDay) ?? itinerary.days[0];
  const totalActivities = itinerary.days.reduce((s, d) => s + d.activities.length, 0);
  const formattedDate = new Date(trip.created_at).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-neutral-50">
      <TopNav />
      <HelperModal
        helper={selectedHelper}
        tripId={tripId}
        onClose={() => setSelectedHelper(null)}
      />
      <ClaimModal
        opportunity={claimTarget}
        state={claimState}
        claimedData={claimedData}
        onConfirm={handleConfirmClaim}
        onClose={handleCloseClaim}
      />

      {/* ── Hero ── */}
      <div className="relative overflow-hidden bg-neutral-900">
        <img
          src="https://images.unsplash.com/photo-1488085061387-422e29b40080?w=1600&q=80"
          alt={itinerary.destination}
          className="absolute inset-0 h-full w-full object-cover opacity-40"
        />
        <div
          className="absolute inset-0"
          style={{ background: "var(--gradient-card-overlay)" }}
        />

        <div className="relative mx-auto max-w-6xl px-4 py-12 lg:px-8 lg:py-16">
          {/* Back nav */}
          <button
            onClick={() => router.back()}
            className="mb-6 flex items-center gap-1.5 text-sm font-medium text-white/70 transition-colors hover:text-white"
          >
            <ArrowLeft className="size-4" />
            Back
          </button>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-sky-300">
                Your itinerary · {formattedDate}
              </p>
              <h1 className="mt-1 font-display text-4xl font-bold text-white lg:text-5xl">
                {itinerary.destination}
              </h1>
              <p className="mt-1 text-base text-white/60">
                {itinerary.origin} → {itinerary.destination}
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleShare}
                className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20 active:scale-95"
              >
                <Share2 className="size-4" />
                {copied ? "Copied!" : "Share"}
              </button>
              <Link
                href="/planner"
                className="flex items-center gap-2 rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-sky-600 active:scale-95"
              >
                <Plus className="size-4" />
                New trip
              </Link>
            </div>
          </div>

          {/* Stats strip */}
          <div className="mt-6 flex flex-wrap gap-3">
            {[
              {
                icon: Calendar,
                label: `${itinerary.duration_days} days`,
              },
              {
                icon: MapPin,
                label: `${totalActivities} activities`,
              },
              {
                icon: DollarSign,
                label: `~$${itinerary.total_budget_est.toLocaleString()} est.`,
              },
              {
                icon: Plane,
                label: itinerary.currency ?? "USD",
              },
            ].map(({ icon: Icon, label }) => (
              <span
                key={label}
                className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm font-medium text-white backdrop-blur-sm"
              >
                <Icon className="size-3.5 text-sky-300" strokeWidth={2} />
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="mx-auto max-w-6xl px-4 py-8 lg:px-8 lg:py-10">
        <div className="flex gap-8">
          {/* Day sidebar — desktop */}
          <aside className="hidden w-20 shrink-0 lg:block">
            <div className="sticky top-6 flex flex-col gap-1.5">
              <p className="mb-1 text-center text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                Days
              </p>
              {itinerary.days.map(({ day }) => (
                <button
                  key={day}
                  onClick={() => setActiveDay(day)}
                  className={cn(
                    "flex flex-col items-center gap-0.5 rounded-xl px-2 py-3 text-center transition-all duration-200",
                    activeDay === day
                      ? "bg-sky-500 text-white shadow-md"
                      : "bg-white text-neutral-500 shadow-xs hover:bg-sky-50 hover:text-sky-600"
                  )}
                >
                  <span className="text-[10px] font-semibold uppercase tracking-wide opacity-70">
                    Day
                  </span>
                  <span className="font-display text-xl font-bold leading-none">{day}</span>
                </button>
              ))}
            </div>
          </aside>

          {/* Main content */}
          <div className="min-w-0 flex-1">
            {/* Mobile day tabs */}
            <div className="mb-4 flex gap-1.5 overflow-x-auto pb-1 lg:hidden">
              {itinerary.days.map(({ day }) => (
                <button
                  key={day}
                  onClick={() => setActiveDay(day)}
                  className={cn(
                    "shrink-0 rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200",
                    activeDay === day
                      ? "bg-sky-500 text-white shadow-md"
                      : "bg-white text-neutral-500 shadow-xs hover:bg-sky-50 hover:text-sky-600"
                  )}
                >
                  Day {day}
                </button>
              ))}
            </div>

            {/* Day header */}
            {currentDay && (
              <div
                key={activeDay}
                style={{ animation: "fadeInUp 200ms ease-out both" }}
              >
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-sky-500 font-display text-lg font-bold text-white shadow-md">
                    {activeDay}
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-sky-600">
                      Day {activeDay}
                    </p>
                    <h2 className="font-display text-xl font-bold text-neutral-900">
                      {currentDay.title}
                    </h2>
                  </div>
                </div>

                {/* Activities timeline */}
                <div className="relative space-y-3">
                  <div className="absolute left-[18px] top-2 h-[calc(100%-16px)] w-0.5 bg-sky-100" />
                  {currentDay.activities.map((activity, idx) => (
                    <ActivityCard
                      key={idx}
                      activity={activity}
                      tripId={tripId}
                      onConnectHelper={setSelectedHelper}
                    />
                  ))}
                </div>

                {/* Day cost summary */}
                {currentDay.activities.some((a) => a.cost_est > 0) && (
                  <div className="mt-4 flex justify-end">
                    <span className="rounded-full bg-sky-50 px-4 py-1.5 text-sm font-semibold text-sky-700">
                      Day {activeDay} total: ~$
                      {currentDay.activities
                        .reduce((s, a) => s + a.cost_est, 0)
                        .toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Trip info cards */}
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {itinerary.visa_info && (
                <InfoCard icon="🛂" label="Visa info" text={itinerary.visa_info} />
              )}
              {itinerary.accommodation_summary && (
                <InfoCard
                  icon="🏨"
                  label="Accommodation"
                  text={itinerary.accommodation_summary}
                />
              )}
              {itinerary.transport_tips && (
                <InfoCard
                  icon="🚌"
                  label="Getting around"
                  text={itinerary.transport_tips}
                />
              )}
              <BudgetBreakdown days={itinerary.days} />
            </div>

            {/* Opportunities / deals at destination */}
            {opportunities.length > 0 && (
              <div className="mt-6">
                <DealsSection
                  opportunities={opportunities}
                  onClaim={handleOpenClaim}
                />
              </div>
            )}

            {/* Footer actions */}
            <div className="mt-10 flex flex-col items-center gap-3 border-t border-neutral-200 pt-8 sm:flex-row sm:justify-between">
              <Link
                href="/my-trips"
                className="flex items-center gap-2 text-sm font-medium text-neutral-500 transition-colors hover:text-neutral-700"
              >
                <ArrowLeft className="size-4" />
                All my trips
              </Link>
              <Link
                href="/planner"
                className="inline-flex items-center gap-2 rounded-xl bg-sky-500 px-6 py-2.5 text-sm font-semibold text-white transition-all hover:bg-sky-600 hover:shadow-md active:scale-95"
              >
                <Plus className="size-4" />
                Plan a new trip
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
