"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  GraduationCap,
  Mail,
  CalendarDays,
  Star,
  Plane,
  Ticket,
  Pencil,
  Check,
  X,
  LogOut,
  Trash2,
  AlertTriangle,
  ChevronRight,
  User,
  MapPin,
  Clock,
  FileText,
  BookOpen,
} from "lucide-react";
import { TopNav } from "@/components/navigation";
import { BottomTabBar } from "@/components/navigation/bottom-tab-bar";
import { http, ApiError } from "@/lib/http";
import { useAuth } from "@/contexts/auth-context";
import { cn } from "@/lib/utils";

interface UserProfile {
  id: string;
  edu_email: string;
  full_name: string | null;
  university_name: string | null;
  points: number;
  created_at: string;
  is_local_helper: boolean;
  helper_region: string | null;
  helper_bio: string | null;
  helper_availability: string | null;
}

interface UserResponse {
  data: UserProfile;
  message: string;
}

interface TripSummary {
  id: string;
  destination: string;
}

interface BookingItem {
  id: string;
  requester_id: string;
  helper_id: string;
  trip_id: string | null;
  message: string | null;
  status: "pending" | "accepted" | "declined";
  created_at: string;
}

interface BookingsResponse {
  as_requester: BookingItem[];
  as_helper: BookingItem[];
}

export default function ProfilePage() {
  const { logout } = useAuth();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [tripsCount, setTripsCount] = useState<number>(0);
  const [ticketsCount, setTicketsCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Profile edit
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editUniversity, setEditUniversity] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Local helper state
  const [helperToggle, setHelperToggle] = useState(false);
  const [helperRegion, setHelperRegion] = useState("");
  const [helperBio, setHelperBio] = useState("");
  const [helperAvailability, setHelperAvailability] = useState("");
  const [savingHelper, setSavingHelper] = useState(false);
  const [helperSaveError, setHelperSaveError] = useState<string | null>(null);
  const [helperSaveSuccess, setHelperSaveSuccess] = useState(false);

  // Bookings
  const [bookings, setBookings] = useState<BookingsResponse | null>(null);
  const [loadingBookings, setLoadingBookings] = useState(false);

  // Delete account
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const saveSuccessTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const helperSuccessTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [res, trips] = await Promise.all([
        http.get<UserResponse>("/users/me"),
        http.get<TripSummary[]>("/trips").catch(() => [] as TripSummary[]),
      ]);
      const p = res.data;
      setProfile(p);
      setTripsCount(trips.length);
      // Sync helper form state from profile
      setHelperToggle(p.is_local_helper ?? false);
      setHelperRegion(p.helper_region ?? "");
      setHelperBio(p.helper_bio ?? "");
      setHelperAvailability(p.helper_availability ?? "");

      try {
        const owned = await http.get<{ id: string }[]>("/tickets");
        setTicketsCount(owned.length);
      } catch {
        setTicketsCount(0);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load profile.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadBookings = useCallback(async () => {
    setLoadingBookings(true);
    try {
      const res = await http.get<BookingsResponse>("/locals/bookings");
      setBookings(res);
    } catch {
      setBookings(null);
    } finally {
      setLoadingBookings(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
    loadBookings();
  }, [loadProfile, loadBookings]);

  useEffect(() => {
    return () => {
      if (saveSuccessTimer.current) clearTimeout(saveSuccessTimer.current);
      if (helperSuccessTimer.current) clearTimeout(helperSuccessTimer.current);
    };
  }, []);

  function startEdit() {
    if (!profile) return;
    setEditName(profile.full_name ?? "");
    setEditUniversity(profile.university_name ?? "");
    setSaveError(null);
    setSaveSuccess(false);
    setIsEditing(true);
  }

  function cancelEdit() {
    setIsEditing(false);
    setSaveError(null);
  }

  async function handleSave() {
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    try {
      const res = await http.put<UserResponse>("/users/me", {
        full_name: editName.trim() || null,
        university_name: editUniversity.trim() || null,
      });
      setProfile(res.data);
      setIsEditing(false);
      setSaveSuccess(true);
      saveSuccessTimer.current = setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : "Failed to save changes.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveHelper() {
    setSavingHelper(true);
    setHelperSaveError(null);
    setHelperSaveSuccess(false);
    try {
      await http.put("/locals/profile", {
        is_local_helper: helperToggle,
        helper_region: helperToggle ? helperRegion.trim() || null : null,
        helper_bio: helperToggle ? helperBio.trim() || null : null,
        helper_availability: helperToggle ? helperAvailability.trim() || null : null,
      });
      setHelperSaveSuccess(true);
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              is_local_helper: helperToggle,
              helper_region: helperToggle ? helperRegion.trim() || null : null,
              helper_bio: helperToggle ? helperBio.trim() || null : null,
              helper_availability: helperToggle ? helperAvailability.trim() || null : null,
            }
          : prev
      );
      helperSuccessTimer.current = setTimeout(() => setHelperSaveSuccess(false), 3000);
    } catch (err) {
      setHelperSaveError(err instanceof ApiError ? err.message : "Failed to save helper profile.");
    } finally {
      setSavingHelper(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    setDeleteError(null);
    try {
      await http.delete("/users/me");
      await logout();
    } catch (err) {
      setDeleteError(err instanceof ApiError ? err.message : "Deletion failed. Try again.");
      setDeleting(false);
    }
  }

  const displayName =
    profile?.full_name || profile?.edu_email?.split("@")[0] || "Traveler";

  const initials = displayName
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  const memberSince = profile?.created_at
    ? new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(
        new Date(profile.created_at)
      )
    : null;

  const allBookings = [
    ...(bookings?.as_requester ?? []).map((b) => ({ ...b, role: "requester" as const })),
    ...(bookings?.as_helper ?? []).map((b) => ({ ...b, role: "helper" as const })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  if (loading) return <PageSkeleton />;

  if (error) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <TopNav />
        <main className="mx-auto max-w-[600px] px-4 py-16 text-center">
          <p className="text-sm text-red-600">{error}</p>
          <button
            onClick={loadProfile}
            className="mt-4 rounded-md bg-sky-500 px-5 h-9 text-sm font-semibold text-white hover:bg-sky-600 transition-colors"
          >
            Retry
          </button>
        </main>
        <BottomTabBar />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <TopNav />

      <main className="mx-auto max-w-[680px] px-4 py-8 pb-28 lg:py-12 lg:pb-12">

        {/* ── Avatar + identity ─────────────────────────────── */}
        <section className="mb-6 flex flex-col items-center gap-4 rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm text-center">
          <div className="relative">
            <div
              className="flex size-20 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 to-sky-600 text-2xl font-bold text-white shadow-md select-none"
              aria-hidden
            >
              {initials || "T"}
            </div>
            {(profile?.points ?? 0) > 0 && (
              <div className="absolute -bottom-1 -right-1 flex items-center gap-0.5 rounded-full bg-warning-100 px-2 py-0.5 text-[10px] font-semibold text-warning-600 border border-white shadow-xs">
                <Star className="size-2.5 fill-warning-600" />
                {profile?.points}
              </div>
            )}
          </div>

          <div>
            <h1 className="font-display text-2xl font-bold text-neutral-900 leading-snug">
              {displayName}
            </h1>
            {profile?.university_name && (
              <p className="mt-1 flex items-center justify-center gap-1.5 text-sm text-neutral-500">
                <GraduationCap className="size-4 text-neutral-400" strokeWidth={1.75} />
                {profile.university_name}
              </p>
            )}
          </div>

          <div className="flex flex-wrap justify-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 border border-sky-200 px-3 py-1 text-xs font-medium text-sky-700">
              <Mail className="size-3" />
              {profile?.edu_email}
            </span>
            {memberSince && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-500">
                <CalendarDays className="size-3" />
                Member since {memberSince}
              </span>
            )}
            {profile?.is_local_helper && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-200 px-3 py-1 text-xs font-semibold text-sky-700">
                <User className="size-3" strokeWidth={2} />
                Local Guide
              </span>
            )}
          </div>
        </section>

        {/* ── Stats ─────────────────────────────────────────── */}
        <div className="mb-6 grid grid-cols-3 gap-3">
          <StatCard
            icon={<Plane className="size-5 text-sky-500" strokeWidth={1.75} />}
            value={tripsCount}
            label="Trips"
            href="/my-trips"
          />
          <StatCard
            icon={<Ticket className="size-5 text-sky-500" strokeWidth={1.75} />}
            value={ticketsCount}
            label="Tickets"
            href="/tickets"
          />
          <StatCard
            icon={<Star className="size-5 text-warning-600 fill-warning-600" />}
            value={profile?.points ?? 0}
            label="Points"
          />
        </div>

        {/* ── Edit Profile ──────────────────────────────────── */}
        <section className="mb-4 rounded-2xl border border-neutral-100 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
            <h2 className="font-display text-base font-semibold text-neutral-900">
              Profile details
            </h2>
            {!isEditing ? (
              <button
                onClick={startEdit}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 h-8 text-sm font-medium text-sky-600 transition-colors hover:bg-sky-50 focus-visible:outline-2 focus-visible:outline-sky-500"
              >
                <Pencil className="size-3.5" />
                Edit
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={cancelEdit}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 rounded-lg px-3 h-8 text-sm font-medium text-neutral-500 transition-colors hover:bg-neutral-100 disabled:opacity-50"
                >
                  <X className="size-3.5" />
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 rounded-lg px-3 h-8 text-sm font-semibold text-white bg-sky-500 transition-colors hover:bg-sky-600 disabled:opacity-60"
                >
                  {saving ? (
                    <span className="size-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  ) : (
                    <Check className="size-3.5" />
                  )}
                  Save
                </button>
              </div>
            )}
          </div>

          <div className="divide-y divide-neutral-100">
            <ProfileRow
              label="Full name"
              isEditing={isEditing}
              editElement={
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Your full name"
                  className="w-full rounded-md border border-neutral-200 bg-neutral-50 px-3 h-9 text-sm text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200 transition"
                  autoFocus
                />
              }
            >
              <span className="text-sm text-neutral-700">
                {profile?.full_name || <span className="text-neutral-400">Not set</span>}
              </span>
            </ProfileRow>

            <ProfileRow
              label="University"
              isEditing={isEditing}
              editElement={
                <input
                  type="text"
                  value={editUniversity}
                  onChange={(e) => setEditUniversity(e.target.value)}
                  placeholder="Your university name"
                  className="w-full rounded-md border border-neutral-200 bg-neutral-50 px-3 h-9 text-sm text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200 transition"
                />
              }
            >
              <span className="text-sm text-neutral-700">
                {profile?.university_name || <span className="text-neutral-400">Not set</span>}
              </span>
            </ProfileRow>

            <ProfileRow label="Email">
              <span className="text-sm text-neutral-500">{profile?.edu_email}</span>
            </ProfileRow>
          </div>

          {saveError && (
            <p className="px-5 py-3 text-sm text-red-600 bg-red-50 border-t border-red-100">
              {saveError}
            </p>
          )}
          {saveSuccess && (
            <p className="px-5 py-3 text-sm text-green-600 bg-green-50 border-t border-green-100">
              Profile updated successfully.
            </p>
          )}
        </section>

        {/* ── Local Helper ──────────────────────────────────── */}
        <section className="mb-4 rounded-2xl border border-neutral-100 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
            <div className="flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-lg bg-sky-100">
                <User className="size-4 text-sky-600" strokeWidth={1.75} />
              </div>
              <div>
                <h2 className="font-display text-base font-semibold text-neutral-900 leading-none">
                  Be a Local Guide
                </h2>
                <p className="mt-0.5 text-xs text-neutral-400">
                  Help visiting students explore your city
                </p>
              </div>
            </div>
            {/* Toggle */}
            <button
              role="switch"
              aria-checked={helperToggle}
              onClick={() => setHelperToggle((v) => !v)}
              className={cn(
                "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent",
                "transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-sky-500",
                helperToggle ? "bg-sky-500" : "bg-neutral-200"
              )}
            >
              <span
                className={cn(
                  "pointer-events-none inline-block size-5 rounded-full bg-white shadow-sm",
                  "transition-transform duration-200",
                  helperToggle ? "translate-x-5" : "translate-x-0"
                )}
              />
            </button>
          </div>

          {helperToggle && (
            <div className="divide-y divide-neutral-100">
              {/* Region */}
              <div className="px-5 py-3.5 space-y-1.5">
                <label
                  htmlFor="helper-region"
                  className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-neutral-400"
                >
                  <MapPin className="size-3.5" strokeWidth={1.75} />
                  Your city / region
                </label>
                <input
                  id="helper-region"
                  type="text"
                  value={helperRegion}
                  onChange={(e) => setHelperRegion(e.target.value)}
                  placeholder="e.g. Istanbul, Barcelona…"
                  className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3.5 h-10 text-sm text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-200/50 transition"
                />
              </div>

              {/* Bio */}
              <div className="px-5 py-3.5 space-y-1.5">
                <label
                  htmlFor="helper-bio"
                  className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-neutral-400"
                >
                  <FileText className="size-3.5" strokeWidth={1.75} />
                  About you
                </label>
                <textarea
                  id="helper-bio"
                  value={helperBio}
                  onChange={(e) => setHelperBio(e.target.value)}
                  placeholder="Tell visiting students about yourself and what you can show them…"
                  rows={3}
                  className="w-full resize-none rounded-xl border border-neutral-200 bg-neutral-50 px-3.5 py-2.5 text-sm text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-200/50 transition"
                />
              </div>

              {/* Availability */}
              <div className="px-5 py-3.5 space-y-1.5">
                <label
                  htmlFor="helper-availability"
                  className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-neutral-400"
                >
                  <Clock className="size-3.5" strokeWidth={1.75} />
                  Availability
                </label>
                <input
                  id="helper-availability"
                  type="text"
                  value={helperAvailability}
                  onChange={(e) => setHelperAvailability(e.target.value)}
                  placeholder="e.g. Weekends, Mon-Wed afternoons…"
                  className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3.5 h-10 text-sm text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-200/50 transition"
                />
              </div>
            </div>
          )}

          {/* Footer actions */}
          <div className="px-5 py-4 border-t border-neutral-100 flex items-center gap-3">
            <button
              onClick={handleSaveHelper}
              disabled={savingHelper || (helperToggle && !helperRegion.trim())}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-4 h-9 text-sm font-semibold text-white",
                "bg-sky-500 hover:bg-sky-600 transition-colors",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {savingHelper ? (
                <span className="size-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
              ) : (
                <Check className="size-3.5" />
              )}
              {helperToggle ? "Save guide profile" : "Turn off guide"}
            </button>
            {helperToggle && !helperRegion.trim() && (
              <p className="text-xs text-neutral-400">City is required to activate.</p>
            )}
          </div>

          {helperSaveError && (
            <p className="px-5 py-3 text-sm text-[var(--error-600)] bg-[var(--error-100)] border-t border-red-100">
              {helperSaveError}
            </p>
          )}
          {helperSaveSuccess && (
            <p className="px-5 py-3 text-sm text-[var(--success-600)] bg-[var(--success-100)] border-t border-green-100">
              {helperToggle ? "Guide profile activated!" : "Guide mode turned off."}
            </p>
          )}
        </section>

        {/* ── My Bookings ───────────────────────────────────── */}
        <section className="mb-4 rounded-2xl border border-neutral-100 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center gap-2.5 px-5 py-4 border-b border-neutral-100">
            <div className="flex size-8 items-center justify-center rounded-lg bg-sky-100">
              <BookOpen className="size-4 text-sky-600" strokeWidth={1.75} />
            </div>
            <h2 className="font-display text-base font-semibold text-neutral-900">
              My Bookings
            </h2>
          </div>

          {loadingBookings ? (
            <div className="space-y-3 px-5 py-4">
              {[1, 2].map((i) => (
                <div key={i} className="h-16 rounded-xl bg-neutral-100 animate-pulse" />
              ))}
            </div>
          ) : allBookings.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-5 py-8 text-center">
              <BookOpen className="size-8 text-neutral-300" strokeWidth={1.5} />
              <p className="text-sm text-neutral-400">
                No bookings yet. Connect with a local guide from your itinerary!
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-neutral-100">
              {allBookings.map((b) => (
                <li key={b.id} className="flex items-center gap-3 px-5 py-4">
                  <div
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                      b.role === "requester"
                        ? "bg-sky-100 text-sky-600"
                        : "bg-emerald-100 text-emerald-600"
                    )}
                  >
                    {b.role === "requester" ? "R" : "H"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-neutral-800 truncate">
                      {b.role === "requester"
                        ? `Guide request to …${b.helper_id.slice(-6)}`
                        : `Incoming request from …${b.requester_id.slice(-6)}`}
                    </p>
                    {b.message && (
                      <p className="text-xs text-neutral-400 truncate">{b.message}</p>
                    )}
                    <p className="text-[11px] text-neutral-300 mt-0.5">
                      {new Intl.DateTimeFormat("en-US", {
                        month: "short",
                        day: "numeric",
                      }).format(new Date(b.created_at))}
                    </p>
                  </div>
                  <BookingStatusBadge status={b.status} />
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* ── Quick links ───────────────────────────────────── */}
        <section className="mb-4 rounded-2xl border border-neutral-100 bg-white shadow-sm overflow-hidden">
          <QuickLink
            href="/my-trips"
            label="My Trips"
            icon={<Plane className="size-4 text-neutral-400" strokeWidth={1.75} />}
          />
          <QuickLink
            href="/tickets"
            label="My Tickets"
            icon={<Ticket className="size-4 text-neutral-400" strokeWidth={1.75} />}
          />
          <QuickLink
            href="/planner"
            label="Plan a new trip"
            icon={<CalendarDays className="size-4 text-neutral-400" strokeWidth={1.75} />}
          />
        </section>

        {/* ── Account actions ───────────────────────────────── */}
        <section className="rounded-2xl border border-neutral-100 bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-neutral-100">
            <h2 className="font-display text-base font-semibold text-neutral-900">Account</h2>
          </div>

          <button
            onClick={() => logout()}
            className="flex w-full items-center gap-3 px-5 py-4 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 border-b border-neutral-100"
          >
            <LogOut className="size-4 text-neutral-400" strokeWidth={1.75} />
            Sign out
          </button>

          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex w-full items-center gap-3 px-5 py-4 text-sm font-medium text-red-500 transition-colors hover:bg-red-50"
            >
              <Trash2 className="size-4" strokeWidth={1.75} />
              Delete account
            </button>
          ) : (
            <div className="px-5 py-5 bg-red-50 border-t border-red-100">
              <div className="flex items-start gap-3 mb-4">
                <AlertTriangle className="size-5 text-red-500 mt-0.5 shrink-0" strokeWidth={1.75} />
                <div>
                  <p className="text-sm font-semibold text-red-700">This action is irreversible</p>
                  <p className="mt-0.5 text-xs text-red-500">
                    All your trips, tickets and account data will be permanently deleted. Type{" "}
                    <strong>DELETE</strong> below to confirm.
                  </p>
                </div>
              </div>
              <input
                type="text"
                value={deleteInput}
                onChange={(e) => setDeleteInput(e.target.value)}
                placeholder="Type DELETE to confirm"
                className="w-full rounded-md border border-red-200 bg-white px-3 h-9 text-sm text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition mb-3"
              />
              {deleteError && <p className="mb-2 text-xs text-red-600">{deleteError}</p>}
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteInput("");
                    setDeleteError(null);
                  }}
                  className="flex-1 h-9 rounded-lg border border-neutral-200 bg-white text-sm font-medium text-neutral-600 hover:bg-neutral-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleteInput !== "DELETE" || deleting}
                  className={cn(
                    "flex-1 h-9 rounded-lg text-sm font-semibold text-white transition-colors",
                    deleteInput === "DELETE" && !deleting
                      ? "bg-red-600 hover:bg-red-700"
                      : "bg-red-300 cursor-not-allowed"
                  )}
                >
                  {deleting ? "Deleting…" : "Delete my account"}
                </button>
              </div>
            </div>
          )}
        </section>
      </main>

      <BottomTabBar />
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function BookingStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-[var(--warning-100)] text-[var(--warning-600)]",
    accepted: "bg-[var(--success-100)] text-[var(--success-600)]",
    declined: "bg-[var(--error-100)] text-[var(--error-600)]",
  };
  return (
    <span
      className={cn(
        "shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize",
        styles[status] ?? "bg-neutral-100 text-neutral-500"
      )}
    >
      {status}
    </span>
  );
}

function StatCard({
  icon,
  value,
  label,
  href,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
  href?: string;
}) {
  const inner = (
    <div className="flex flex-col items-center gap-1.5 rounded-xl border border-neutral-100 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      {icon}
      <span className="font-display text-2xl font-bold text-neutral-900">{value}</span>
      <span className="text-xs font-medium text-neutral-500">{label}</span>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {inner}
      </Link>
    );
  }
  return inner;
}

function ProfileRow({
  label,
  children,
  isEditing,
  editElement,
}: {
  label: string;
  children: React.ReactNode;
  isEditing?: boolean;
  editElement?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-4 px-5 py-3.5">
      <span className="w-28 shrink-0 text-xs font-semibold uppercase tracking-wide text-neutral-400">
        {label}
      </span>
      <div className="flex-1 min-w-0">
        {isEditing && editElement ? editElement : children}
      </div>
    </div>
  );
}

function QuickLink({ href, label, icon }: { href: string; label: string; icon: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-5 py-4 text-sm font-medium text-neutral-700 transition-colors hover:bg-sky-50 hover:text-sky-600 border-b border-neutral-100 last:border-b-0 group"
    >
      {icon}
      <span className="flex-1">{label}</span>
      <ChevronRight
        className="size-4 text-neutral-300 transition-colors group-hover:text-sky-400"
        strokeWidth={1.75}
      />
    </Link>
  );
}

function PageSkeleton() {
  return (
    <div className="min-h-screen bg-neutral-50">
      <TopNav />
      <main className="mx-auto max-w-[680px] px-4 py-8 pb-28 lg:py-12">
        <div className="mb-6 flex flex-col items-center gap-4 rounded-2xl border border-neutral-100 bg-white p-6">
          <div className="size-20 rounded-full bg-neutral-200 animate-pulse" />
          <div className="h-6 w-40 rounded-lg bg-neutral-200 animate-pulse" />
          <div className="h-4 w-56 rounded-lg bg-neutral-200 animate-pulse" />
        </div>
        <div className="mb-6 grid grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl border border-neutral-100 bg-white animate-pulse" />
          ))}
        </div>
        <div className="h-48 rounded-2xl border border-neutral-100 bg-white animate-pulse" />
      </main>
      <BottomTabBar />
    </div>
  );
}

