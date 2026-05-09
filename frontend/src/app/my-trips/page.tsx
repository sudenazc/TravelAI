"use client";

import Link from "next/link";
import { Plus, Plane } from "lucide-react";
import { TopNav } from "@/components/navigation";
import { MyTripCard } from "@/components/cards";

const MY_TRIPS = [
  {
    id: "vienna-2026",
    title: "Vienna Getaway",
    destination: "Vienna, Austria",
    accommodation: "Vienna Hostel",
    durationDays: 3,
    budget: 130,
    currency: "TL",
    status: "upcoming" as const,
  },
];

export default function MyTripsPage() {
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

        {MY_TRIPS.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {MY_TRIPS.map((trip) => (
              <MyTripCard key={trip.id} {...trip} />
            ))}

            {/* add-new placeholder card */}
            <AddTripCard />
          </div>
        )}
      </main>
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
