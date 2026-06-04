"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Heart,
  Bookmark,
  MapPin,
  Tag,
  Calendar,
  User,
  AlertCircle,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { TopNav } from "@/components/navigation";
import { http, ApiError } from "@/lib/http";

interface ExperienceDetail {
  id: string;
  user_id: string;
  author_name: string | null;
  trip_id: string | null;
  title: string;
  body: string;
  city: string | null;
  tags: string[];
  cover_image_url: string | null;
  likes_count: number;
  is_liked: boolean;
  created_at: string;
}

export default function ExperienceDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const experienceId = params.id;

  const [experience, setExperience] = useState<ExperienceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Like state
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [likeLoading, setLikeLoading] = useState(false);
  const [likeAnimating, setLikeAnimating] = useState(false);

  // Save state
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    http
      .get<ExperienceDetail>(`/experiences/${experienceId}`)
      .then((data) => {
        setExperience(data);
        setIsLiked(data.is_liked);
        setLikesCount(data.likes_count);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [experienceId]);

  async function handleLike() {
    if (likeLoading) return;
    setLikeLoading(true);
    setLikeAnimating(true);
    // Optimistic update
    const wasLiked = isLiked;
    setIsLiked(!wasLiked);
    setLikesCount((c) => (wasLiked ? Math.max(c - 1, 0) : c + 1));
    setTimeout(() => setLikeAnimating(false), 300);
    try {
      const res = await http.post<{ liked: boolean; likes_count: number }>(
        `/experiences/${experienceId}/like`
      );
      setIsLiked(res.liked);
      setLikesCount(res.likes_count);
    } catch (err: unknown) {
      // Revert optimistic update on auth error
      if (err instanceof ApiError && err.status === 401) {
        setIsLiked(wasLiked);
        setLikesCount((c) => (wasLiked ? c + 1 : Math.max(c - 1, 0)));
        router.push(`/login?next=/experiences/${experienceId}`);
      }
    } finally {
      setLikeLoading(false);
    }
  }

  async function handleSave() {
    if (saveLoading || saveSuccess) return;
    setSaveLoading(true);
    setSaveError(null);
    try {
      await http.post(`/experiences/${experienceId}/save`);
      setSaveSuccess(true);
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 401) {
        router.push(`/login?next=/experiences/${experienceId}`);
        return;
      }
      setSaveError(
        err instanceof ApiError ? err.message : "Failed to save trip."
      );
    } finally {
      setSaveLoading(false);
    }
  }

  if (loading) return <LoadingSkeleton />;

  if (error || !experience) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <TopNav />
        <main className="mx-auto max-w-[720px] px-4 py-16 text-center">
          <div className="flex flex-col items-center gap-4">
            <AlertCircle className="size-10 text-red-400" strokeWidth={1.5} />
            <p className="text-sm font-medium text-neutral-600">
              {error ?? "Experience not found."}
            </p>
            <Link
              href="/experiences"
              className="inline-flex items-center gap-2 rounded-md bg-sky-500 px-5 h-9 text-sm font-semibold text-white transition-colors hover:bg-sky-600"
            >
              <ArrowLeft className="size-4" strokeWidth={2} />
              Back to feed
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const formattedDate = new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(experience.created_at));

  const bodyParagraphs = experience.body.split(/\n\n+/).filter(Boolean);

  return (
    <div className="min-h-screen bg-neutral-50">
      <TopNav />

      <main className="mx-auto max-w-[720px] px-4 py-8 pb-28 lg:py-12 lg:pb-12">
        {/* Back */}
        <Link
          href="/experiences"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-neutral-500 transition-colors hover:text-sky-600"
        >
          <ArrowLeft className="size-4" strokeWidth={2} />
          Back to experiences
        </Link>

        {/* Cover image */}
        {experience.cover_image_url ? (
          <div className="mb-6 h-64 w-full overflow-hidden rounded-2xl bg-neutral-200 md:h-80">
            <img
              src={experience.cover_image_url}
              alt={experience.title}
              className="h-full w-full object-cover"
            />
          </div>
        ) : (
          <div className="mb-6 flex h-48 w-full items-center justify-center rounded-2xl bg-gradient-to-br from-sky-100 to-sky-200">
            <span className="text-6xl select-none">✈️</span>
          </div>
        )}

        {/* Header card */}
        <div className="mb-6 rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm">
          <h1 className="font-display text-2xl font-bold text-neutral-900 leading-snug md:text-3xl">
            {experience.title}
          </h1>

          {/* Meta */}
          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-neutral-500">
            {experience.author_name && (
              <span className="inline-flex items-center gap-1.5">
                <User className="size-3.5 text-neutral-400" strokeWidth={1.75} />
                {experience.author_name}
              </span>
            )}
            {experience.city && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="size-3.5 text-sky-500" strokeWidth={1.75} />
                {experience.city}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="size-3.5 text-neutral-400" strokeWidth={1.75} />
              {formattedDate}
            </span>
          </div>

          {/* Tags */}
          {experience.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {experience.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-full bg-sky-50 border border-sky-200 px-2.5 py-0.5 text-xs font-semibold text-sky-700"
                >
                  <Tag className="size-3" strokeWidth={2} />
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Like + Save actions */}
          <div className="mt-5 flex items-center gap-3 border-t border-neutral-100 pt-4">
            <button
              onClick={handleLike}
              disabled={likeLoading}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg border px-4 h-9 text-sm font-semibold transition-all duration-200",
                "focus-visible:outline-2 focus-visible:outline-sky-500",
                isLiked
                  ? "border-red-200 bg-red-50 text-red-500 hover:bg-red-100"
                  : "border-neutral-200 bg-white text-neutral-600 hover:border-red-200 hover:text-red-500"
              )}
            >
              <Heart
                className={cn(
                  "size-4 transition-transform duration-200",
                  likeAnimating && "scale-125",
                  isLiked ? "fill-red-400 text-red-400" : ""
                )}
                strokeWidth={isLiked ? 0 : 1.75}
              />
              <span>{likesCount}</span>
            </button>

            {experience.trip_id && (
              <button
                onClick={handleSave}
                disabled={saveLoading || saveSuccess}
                className={cn(
                  "inline-flex items-center gap-2 rounded-lg border px-4 h-9 text-sm font-semibold transition-all duration-200",
                  saveSuccess
                    ? "border-sky-200 bg-sky-50 text-sky-600"
                    : "border-neutral-200 bg-white text-neutral-600 hover:border-sky-300 hover:text-sky-600"
                )}
              >
                {saveSuccess ? (
                  <>
                    <Check className="size-4" strokeWidth={2} />
                    Saved to My Trips
                  </>
                ) : saveLoading ? (
                  <>
                    <span className="size-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <Bookmark className="size-4" strokeWidth={1.75} />
                    Save Itinerary
                  </>
                )}
              </button>
            )}
          </div>

          {saveError && (
            <p className="mt-2 text-xs text-red-500">{saveError}</p>
          )}
        </div>

        {/* Blog body */}
        <article className="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm">
          <div className="space-y-4 text-[15px] leading-relaxed text-neutral-700">
            {bodyParagraphs.map((para, i) => (
              <p key={i} className="whitespace-pre-wrap">
                {para}
              </p>
            ))}
          </div>
        </article>

        {/* Link to saved trip */}
        {saveSuccess && (
          <div className="mt-4 rounded-xl border border-sky-200 bg-sky-50 px-5 py-4 text-sm text-sky-700">
            Itinerary cloned to your trips.{" "}
            <Link
              href="/my-trips"
              className="font-semibold underline underline-offset-2 hover:text-sky-900"
            >
              View My Trips →
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-neutral-50">
      <TopNav />
      <main className="mx-auto max-w-[720px] px-4 py-8 pb-28 lg:py-12">
        <div className="mb-6 h-4 w-32 rounded-lg bg-neutral-200 animate-pulse" />
        <div className="mb-6 h-64 rounded-2xl bg-neutral-200 animate-pulse" />
        <div className="mb-6 h-48 rounded-2xl bg-neutral-200 animate-pulse" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-4 rounded-lg bg-neutral-200 animate-pulse" />
          ))}
        </div>
      </main>
    </div>
  );
}
