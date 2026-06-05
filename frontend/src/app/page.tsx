"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import { Plane, Shield, Zap, ArrowRight, Star } from "lucide-react";
import { Button, Badge, SearchInput } from "@/components/ui";
import { TopNav } from "@/components/navigation";
import Link from "next/link";

const HOW_IT_WORKS = [
  {
    icon: Zap,
    title: "Tell AI your dream",
    desc: "Describe your ideal trip — destinations, budget, travel style — in plain language.",
  },
  {
    icon: Plane,
    title: "Get a full itinerary",
    desc: "AI builds a day-by-day plan with flights, hotels, activities and local tips.",
  },
  {
    icon: Shield,
    title: "Book with confidence",
    desc: "Compare real-time prices and book everything in one place, securely.",
  },
];

const TESTIMONIALS = [
  {
    name: "Sarah K.",
    rating: 5,
    text: "Planned a 10-day Japan trip in minutes. The AI suggested things I would never have found on my own!",
  },
  {
    name: "Marco V.",
    rating: 5,
    text: "The itinerary was perfectly balanced — rest days included. Finally a planner that gets it.",
  },
  {
    name: "Aisha R.",
    rating: 4,
    text: "Saved hours of research. Booked flights and hotels right from the plan. Seamless.",
  },
];

export default function HomePage() {
  const router = useRouter();
  const searchRef = useRef<HTMLInputElement>(null);

  const navigateToPlanner = (query: string) => {
    const q = query.trim();
    if (!q) return;
    router.push(`/planner?q=${encodeURIComponent(q)}`);
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <TopNav />

      {/* ── Hero ── */}
      <section
        className="relative px-4 py-20 lg:py-32"
        style={{ background: "var(--gradient-hero)" }}
      >
        <div className="mx-auto max-w-4xl text-center">
          <Badge variant="primary" className="mb-6 text-sm px-4 py-1">
            ✨ AI-powered travel planning
          </Badge>

          <h1 className="font-display text-[40px] font-extrabold leading-[1.1] text-neutral-900 lg:text-[72px]">
            Your perfect trip,{" "}
            <span className="text-sky-600">planned by AI</span>
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-lg text-neutral-500">
            Describe your dream holiday and get a personalised itinerary,
            real-time flights, hotels and activities — all in seconds.
          </p>

          <div className="mx-auto mt-10 max-w-2xl">
            <SearchInput
              ref={searchRef}
              placeholder="E.g. 10 days in Japan for 2 people, mid-budget…"
              className="w-full"
              onSearch={navigateToPlanner}
              onKeyDown={(e) => {
                if (e.key === "Enter") navigateToPlanner(searchRef.current?.value ?? "");
              }}
            />
          </div>

          {/* quick chips */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            {[
              { label: "🗼 Paris", dest: "Paris" },
              { label: "🗾 Tokyo", dest: "Tokyo" },
              { label: "🏝 Bali", dest: "Bali" },
              { label: "🗽 New York", dest: "New York" },
              { label: "🏔 Cappadocia", dest: "Cappadocia" },
            ].map(({ label, dest }) => (
              <button
                key={label}
                onClick={() => navigateToPlanner(dest)}
                className="rounded-full border-[1.5px] border-sky-300 bg-sky-50 px-4 py-2 text-sm font-medium text-sky-700 transition-all duration-normal hover:border-sky-500 hover:bg-sky-100"
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <section className="border-y border-neutral-200 bg-white py-6">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-8 px-4 text-center lg:gap-16">
          {[
            { value: "1.8M+", label: "Trips planned" },
            { value: "190+", label: "Countries covered" },
            { value: "4.9 ★", label: "Average rating" },
            { value: "< 30s", label: "Time to itinerary" },
          ].map(({ value, label }) => (
            <div key={label}>
              <p className="font-display text-2xl font-bold text-sky-600 lg:text-3xl">
                {value}
              </p>
              <p className="text-sm text-neutral-500">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section
        className="px-4 py-16 lg:py-24"
        style={{ background: "var(--gradient-subtle)" }}
      >
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-sky-600">
              Simple process
            </p>
            <h2 className="mt-1 font-display text-[30px] font-bold text-neutral-900 lg:text-[48px]">
              How it works
            </h2>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            {HOW_IT_WORKS.map(({ icon: Icon, title, desc }, i) => (
              <div key={title} className="relative flex flex-col items-center text-center">
                {/* connector arrow (desktop) */}
                {i < HOW_IT_WORKS.length - 1 && (
                  <ArrowRight className="absolute -right-6 top-8 hidden size-5 text-sky-300 lg:block" />
                )}
                <div className="flex size-16 items-center justify-center rounded-2xl bg-sky-100">
                  <Icon className="size-7 text-sky-600" strokeWidth={1.75} />
                </div>
                <h3 className="mt-4 font-display text-xl font-semibold text-neutral-900">
                  {title}
                </h3>
                <p className="mt-2 text-sm text-neutral-500 max-w-xs">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="px-4 py-16 lg:py-24">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <h2 className="font-display text-[30px] font-bold text-neutral-900 lg:text-[48px]">
              Loved by travellers
            </h2>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {TESTIMONIALS.map(({ name, rating, text }) => (
              <div
                key={name}
                className="flex flex-col gap-4 rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex gap-0.5">
                  {Array.from({ length: rating }).map((_, i) => (
                    <Star
                      key={i}
                      className="size-4 fill-warning-500 text-warning-500"
                      strokeWidth={0}
                    />
                  ))}
                </div>
                <p className="text-sm text-neutral-600 leading-relaxed">{text}</p>
                <p className="text-sm font-semibold text-neutral-800">{name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA banner ── */}
      <section className="px-4 py-16 lg:py-24">
        <div
          className="mx-auto max-w-3xl rounded-3xl p-10 text-center text-white lg:p-16"
          style={{ background: "var(--gradient-cta)" }}
        >
          <h2 className="font-display text-[30px] font-bold lg:text-5xl">
            Ready to explore the world?
          </h2>
          <p className="mx-auto mt-4 max-w-md text-sky-100">
            Join 1.8 million travellers who plan smarter with AI.
          </p>
          <Link href="/planner">
            <Button
              variant="secondary"
              size="xl"
              className="mt-8 rounded-full border-white text-neutral-900 hover:border-white hover:text-sky-700"
              >
              Start planning for free
            </Button>
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-neutral-900 px-4 py-6 text-neutral-400">
        <div className="mx-auto max-w-[1440px] flex flex-col items-center gap-4 lg:flex-row lg:justify-between">
          {/* Brand */}
          <div className="flex items-center gap-2 text-white">
            <Plane className="size-5" />
            <span className="font-display text-base font-bold">
              Travel<span className="text-sky-400">AI</span>
            </span>
          </div>

          {/* Nav links */}
          <div className="flex flex-wrap items-center justify-center gap-5">
            {[
              { label: "Planner", href: "/planner" },
              { label: "Experiences", href: "/experiences" },
              { label: "Tickets", href: "/tickets" },
              { label: "My Trips", href: "/my-trips" },
            ].map(({ label, href }) => (
              <a key={href} href={href} className="text-sm transition-colors hover:text-white">
                {label}
              </a>
            ))}
            <span className="hidden lg:block h-4 w-px bg-neutral-700" />
            {[
              { label: "Log in", href: "/login" },
              { label: "Sign up", href: "/register" },
            ].map(({ label, href }) => (
              <a key={href} href={href} className="text-sm transition-colors hover:text-white">
                {label}
              </a>
            ))}
          </div>

          {/* Copyright */}
          <p className="text-xs">© 2026 Travel AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
