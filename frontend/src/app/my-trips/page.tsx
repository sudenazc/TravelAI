"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Plane } from "lucide-react";
import { TopNav } from "@/components/navigation";
import { MyTripCard } from "@/components/cards";
import { http } from "@/lib/http";

interface TripSummary {
  id: string;
  destination: string;
  origin: string;
  duration_days: number | null;
  total_budget_est: number | null;
  itinerary_data: {
    accommodation_summary?: string;
  };
  created_at: string;
}

export default function MyTripsPage() {
  const [trips, setTrips] = useState<TripSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    http
      .get<TripSummary[]>("/trips")
      .then(setTrips)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-neutral-50">
      <TopNav />

      <main className="mx-auto max-w-[1440px] px-4 py-12 lg:px-10 lg:py-16">
        {/* page header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-sky-600">
              Your account
            </p>
            <h1 className="mt-1 font-display text-[30px] font-bold text-neutral-900 lg:text-[40px]">
              My Trips
            </h1>
          </div>

          <Link
            href="/planner"
            className="inline-flex items-center gap-2 self-start rounded-md bg-sky-500 px-5 h-10 text-sm font-semibold text-white transition-all duration-200 hover:bg-sky-600 hover:scale-[1.02] active:scale-[0.98] sm:self-auto"
          >
            <Plus className="size-4" strokeWidth={2} />
            Plan a new trip
          </Link>
        </div>

        {loading ? (
          <LoadingSkeleton />
        ) : error ? (
          <ErrorState message={error} />
        ) : trips.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {trips.map((trip) => (
              <MyTripCard
                key={trip.id}
                id={trip.id}
                title={trip.destination}
                destination={`${trip.origin} → ${trip.destination}`}
                accommodation={trip.itinerary_data?.accommodation_summary?.slice(0, 60)}
                durationDays={trip.duration_days ?? undefined}
                budget={trip.total_budget_est ?? undefined}
                currency="USD"
                status="completed"
              />
            ))}

            <AddTripCard />
          </div>
        )}
      </main>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="h-44 rounded-xl border border-neutral-100 bg-white animate-pulse"
        />
      ))}
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-red-100 bg-red-50 py-16 text-center">
      <p className="text-sm font-medium text-red-600">{message}</p>
      <Link
        href="/planner"
        className="inline-flex items-center justify-center rounded-md bg-sky-500 px-5 h-10 text-sm font-semibold text-white transition-all duration-200 hover:bg-sky-600"
      >
        Plan a new trip
      </Link>
    </div>
  );
}

function AddTripCard() {
  return (
    <Link
      href="/planner"
      className="group flex min-h-[160px] flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-neutral-200 bg-white p-5 text-center transition-all duration-200 hover:border-sky-300 hover:bg-sky-50"
    >
      <div className="flex size-12 items-center justify-center rounded-full bg-neutral-100 transition-colors group-hover:bg-sky-100">
        <Plus className="size-5 text-neutral-400 transition-colors group-hover:text-sky-600" strokeWidth={2} />
      </div>
      <div>
        <p className="text-sm font-semibold text-neutral-700 group-hover:text-sky-700">
          Plan a new trip
        </p>
        <p className="mt-0.5 text-xs text-neutral-400">
          Let AI build your itinerary
        </p>
      </div>
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-6 rounded-2xl border border-dashed border-neutral-200 bg-white py-20 text-center">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-sky-100">
        <Plane className="size-8 text-sky-600" strokeWidth={1.75} />
      </div>
      <div>
        <h2 className="font-display text-xl font-semibold text-neutral-900">
          No trips yet
        </h2>
        <p className="mt-1 text-sm text-neutral-500">
          Start planning your first adventure with AI.
        </p>
      </div>
      <Link
        href="/planner"
        className="inline-flex items-center justify-center rounded-md bg-sky-500 px-5 h-10 text-sm font-semibold text-white transition-all duration-200 hover:bg-sky-600 hover:scale-[1.02] active:scale-[0.98]"
      >
        Plan my first trip
      </Link>
    </div>
  );
}
