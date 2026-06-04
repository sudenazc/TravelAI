"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { PenLine, Compass, X } from "lucide-react";
import { TopNav } from "@/components/navigation";
import { BottomTabBar } from "@/components/navigation/bottom-tab-bar";
import { ExperienceCard } from "@/components/cards";
import { http } from "@/lib/http";

interface ExperienceSummary {
  id: string;
  title: string;
  city: string | null;
  tags: string[];
  cover_image_url: string | null;
  likes_count: number;
  author_name: string | null;
  created_at: string;
}

const POPULAR_TAGS = [
  "budget",
  "solo",
  "beach",
  "culture",
  "food",
  "adventure",
  "city",
  "nature",
];

const POPULAR_CITIES = ["Barcelona", "Tokyo", "Rome", "Istanbul", "Bangkok", "Paris"];

export default function ExperiencesPage() {
  const [experiences, setExperiences] = useState<ExperienceSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [cityFilter, setCityFilter] = useState("");
  const [activeCity, setActiveCity] = useState<string | null>(null);
  const [activeTags, setActiveTags] = useState<string[]>([]);

  const fetchFeed = useCallback(async (city: string | null, tags: string[]) => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = {};
      if (city) params.city = city;
      if (tags.length > 0) params.tags = tags.join(",");
      const qs = new URLSearchParams(params).toString();
      const path = qs ? `/experiences?${qs}` : "/experiences";
      const data = await http.get<ExperienceSummary[]>(path);
      setExperiences(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load experiences.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeed(activeCity, activeTags);
  }, [fetchFeed, activeCity, activeTags]);

  function toggleTag(tag: string) {
    setActiveTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  function applyCity(city: string) {
    setActiveCity(city);
    setCityFilter(city);
  }

  function clearFilters() {
    setActiveCity(null);
    setCityFilter("");
    setActiveTags([]);
  }

  const hasFilters = activeCity || activeTags.length > 0;

  return (
    <div className="min-h-screen bg-neutral-50">
      <TopNav />

      <main className="mx-auto max-w-[1440px] px-4 py-10 pb-28 lg:px-10 lg:py-14 lg:pb-14">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-sky-600">
              Community
            </p>
            <h1 className="mt-1 font-display text-[30px] font-bold text-neutral-900 lg:text-[40px]">
              Travel Experiences
            </h1>
            <p className="mt-1 text-sm text-neutral-500">
              Real stories from student travellers around the world.
            </p>
          </div>
          <Link
            href="/experiences/new"
            className="inline-flex items-center gap-2 self-start rounded-md bg-sky-500 px-5 h-10 text-sm font-semibold text-white transition-all duration-200 hover:bg-sky-600 hover:scale-[1.02] active:scale-[0.98] shrink-0"
          >
            <PenLine className="size-4" strokeWidth={2} />
            Share Experience
          </Link>
        </div>

        {/* Filters */}
        <div className="mb-6 space-y-3">
          {/* City search */}
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && cityFilter.trim()) {
                  applyCity(cityFilter.trim());
                }
              }}
              placeholder="Search by city…"
              className="h-9 rounded-lg border border-neutral-200 bg-white px-3 text-sm text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-200 transition w-48"
            />
            <div className="flex flex-wrap gap-1.5">
              {POPULAR_CITIES.map((c) => (
                <button
                  key={c}
                  onClick={() => (activeCity === c ? setActiveCity(null) : applyCity(c))}
                  className={`h-8 rounded-full border px-3 text-xs font-semibold transition-all duration-150 ${
                    activeCity === c
                      ? "border-sky-500 bg-sky-500 text-white"
                      : "border-neutral-200 bg-white text-neutral-600 hover:border-sky-300 hover:text-sky-700"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Tag chips */}
          <div className="flex flex-wrap gap-1.5">
            {POPULAR_TAGS.map((tag) => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`h-7 rounded-full border px-3 text-[11px] font-semibold transition-all duration-150 ${
                  activeTags.includes(tag)
                    ? "border-sky-500 bg-sky-500 text-white"
                    : "border-neutral-200 bg-white text-neutral-600 hover:border-sky-300 hover:text-sky-700"
                }`}
              >
                #{tag}
              </button>
            ))}

            {hasFilters && (
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-1 h-7 rounded-full border border-red-200 bg-red-50 px-2.5 text-[11px] font-semibold text-red-500 transition-colors hover:bg-red-100"
              >
                <X className="size-3" strokeWidth={2} />
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Feed */}
        {loading ? (
          <LoadingSkeleton />
        ) : error ? (
          <ErrorState message={error} onRetry={() => fetchFeed(activeCity, activeTags)} />
        ) : experiences.length === 0 ? (
          <EmptyState hasFilters={!!hasFilters} onClear={clearFilters} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {experiences.map((exp) => (
              <ExperienceCard key={exp.id} {...exp} />
            ))}
          </div>
        )}
      </main>

      <BottomTabBar />
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="h-64 rounded-xl border border-neutral-100 bg-white animate-pulse"
        />
      ))}
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-red-100 bg-red-50 py-16 text-center">
      <p className="text-sm font-medium text-red-600">{message}</p>
      <button
        onClick={onRetry}
        className="inline-flex items-center rounded-md bg-sky-500 px-5 h-10 text-sm font-semibold text-white transition-colors hover:bg-sky-600"
      >
        Retry
      </button>
    </div>
  );
}

function EmptyState({
  hasFilters,
  onClear,
}: {
  hasFilters: boolean;
  onClear: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-6 rounded-2xl border border-dashed border-neutral-200 bg-white py-20 text-center">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-sky-100">
        <Compass className="size-8 text-sky-600" strokeWidth={1.75} />
      </div>
      <div>
        <h2 className="font-display text-xl font-semibold text-neutral-900">
          {hasFilters ? "No experiences match your filters" : "No experiences yet"}
        </h2>
        <p className="mt-1 text-sm text-neutral-500">
          {hasFilters
            ? "Try adjusting your city or tag filters."
            : "Be the first to share your travel story!"}
        </p>
      </div>
      {hasFilters ? (
        <button
          onClick={onClear}
          className="inline-flex items-center rounded-md bg-sky-500 px-5 h-10 text-sm font-semibold text-white transition-colors hover:bg-sky-600"
        >
          Clear filters
        </button>
      ) : (
        <Link
          href="/experiences/new"
          className="inline-flex items-center gap-2 rounded-md bg-sky-500 px-5 h-10 text-sm font-semibold text-white transition-colors hover:bg-sky-600"
        >
          <PenLine className="size-4" strokeWidth={2} />
          Share your story
        </Link>
      )}
    </div>
  );
}
