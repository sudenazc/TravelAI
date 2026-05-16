"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  MapPin,
  Calendar,
  DollarSign,
  ChevronRight,
  Check,
  Plane,
  Sparkles,
  Map,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { TopNav } from "@/components/navigation";
import {
  ChatBubble,
  TypingIndicator,
  SuggestionChips,
  ChatInput,
} from "@/components/chat";
import { http } from "@/lib/http";

// ── Types ────────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: "ai" | "user";
  content: string;
}

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

interface GenerateTripParams {
  origin: string;
  destination: string;
  duration_days: number;
  accommodation_pref: string;
  passport_country: string;
  budget_usd: number;
  transport_pref: string;
  interests: string[];
}

// ── Parameter collection steps ───────────────────────────────────────────────

interface ParamStep {
  question: string;
  key: keyof GenerateTripParams | "route";
  chips?: string[];
}

const PARAM_STEPS: ParamStep[] = [
  {
    key: "route",
    question:
      "Where are you travelling from, and where do you want to go? (e.g. 'Istanbul to Vienna')",
    chips: ["Istanbul to Berlin", "London to Barcelona", "New York to Tokyo"],
  },
  {
    key: "duration_days",
    question: "How many days are you planning to travel?",
    chips: ["3 days", "5 days", "7 days", "10 days", "2 weeks"],
  },
  {
    key: "accommodation_pref",
    question:
      "What's your accommodation preference? (e.g. hostel, shared flat, budget hotel)",
    chips: ["Hostel", "Budget hotel", "Shared flat / Airbnb", "Student dorm"],
  },
  {
    key: "passport_country",
    question:
      "Which country passport do you hold? I'll use this to check visa requirements.",
    chips: ["Turkey", "USA", "UK", "Germany", "India"],
  },
  {
    key: "budget_usd",
    question:
      "What's your total budget in USD for the whole trip? (flights and accommodation included)",
    chips: ["$300", "$500", "$800", "$1200", "$2000"],
  },
  {
    key: "transport_pref",
    question:
      "How do you prefer to get around? (e.g. train, budget flights, bus, mix)",
    chips: ["Train", "Budget flights", "Bus", "Mix of everything"],
  },
  {
    key: "interests",
    question:
      "Last one — what are your main interests? (comma-separated, e.g. history, local food, nightlife)",
    chips: [
      "Culture & history",
      "Local food & cafes",
      "Nature & hiking",
      "Nightlife",
      "Art & museums",
    ],
  },
];

// ── Parsers ───────────────────────────────────────────────────────────────────

function parseRoute(input: string): { origin: string; destination: string } {
  const separators = [" to ", " → ", " -> ", " - "];
  for (const sep of separators) {
    const idx = input.toLowerCase().indexOf(sep);
    if (idx !== -1) {
      return {
        origin: input.slice(0, idx).trim(),
        destination: input.slice(idx + sep.length).trim(),
      };
    }
  }
  return { origin: "Not specified", destination: input.trim() };
}

function parseNumber(input: string): number {
  const match = input.replace(/[,$]/g, "").match(/\d+/);
  return match ? parseInt(match[0], 10) : 0;
}

function parseInterests(input: string): string[] {
  return input
    .split(/[,;&]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

// ── Constants ─────────────────────────────────────────────────────────────────

const INITIAL_MESSAGES: Message[] = [
  {
    id: "welcome",
    role: "ai",
    content:
      "Hi! ✈️ I'm your AI travel assistant. I'll ask you 7 quick questions, then build a personalised student-friendly itinerary — day-by-day, budget-optimised, and full of local gems.",
  },
  {
    id: "q0",
    role: "ai",
    content: PARAM_STEPS[0].question,
  },
];

const ACTIVITY_ICON: Record<ActivityType, string> = {
  hotel: "🏨",
  food: "🍜",
  transport: "🚄",
  activity: "📍",
  local_activity: "🎓",
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function PlannerPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [isTyping, setIsTyping] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [paramStep, setParamStep] = useState(0);
  const [collectedParams, setCollectedParams] = useState<Partial<GenerateTripParams>>({});
  const [trip, setTrip] = useState<TripResponse | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [activeDay, setActiveDay] = useState(1);
  const [activeTab, setActiveTab] = useState<"chat" | "plan">("chat");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const addAiMessage = (content: string) => {
    setMessages((prev) => [
      ...prev,
      { id: `ai-${Date.now()}`, role: "ai", content },
    ]);
  };

  const triggerGenerate = async (params: GenerateTripParams) => {
    setIsGenerating(true);
    try {
      const result = await http.post<TripResponse>("/trips/generate", params);
      setIsTyping(false);
      setTrip(result);
      setIsSaved(true);
      setActiveDay(1);
      addAiMessage(
        `Your itinerary is ready! 🎉 I've planned ${result.itinerary_data.duration_days} days in ${result.itinerary_data.destination} within your budget. Switch to the Plan tab to explore it.`
      );
      setActiveTab("plan");
    } catch (err: unknown) {
      setIsTyping(false);
      const message =
        err instanceof Error ? err.message : "Something went wrong. Please try again.";
      addAiMessage(`❌ ${message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSend = (text: string) => {
    const userMsg: Message = { id: `user-${Date.now()}`, role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);

    const currentStep = paramStep;
    const step = PARAM_STEPS[currentStep];
    let updatedParams = { ...collectedParams };

    // Parse and store the answer for this step
    if (step.key === "route") {
      const { origin, destination } = parseRoute(text);
      updatedParams = { ...updatedParams, origin, destination };
    } else if (step.key === "duration_days") {
      const days = parseNumber(text);
      updatedParams = { ...updatedParams, duration_days: days > 0 ? days : 7 };
    } else if (step.key === "budget_usd") {
      const budget = parseNumber(text);
      updatedParams = { ...updatedParams, budget_usd: budget > 0 ? budget : 500 };
    } else if (step.key === "interests") {
      updatedParams = { ...updatedParams, interests: parseInterests(text) };
    } else {
      (updatedParams as Record<string, unknown>)[step.key] = text;
    }

    setCollectedParams(updatedParams);
    const nextStep = currentStep + 1;
    setParamStep(nextStep);

    setIsTyping(true);

    if (nextStep < PARAM_STEPS.length) {
      // Ask the next question
      setTimeout(() => {
        setIsTyping(false);
        addAiMessage(PARAM_STEPS[nextStep].question);
      }, 900);
    } else {
      // All params collected — trigger generation
      setTimeout(() => {
        setIsTyping(false);
        addAiMessage(
          "Perfect! I have everything I need. Let me build your personalised itinerary now — this takes about 15–30 seconds ✨"
        );
        setIsTyping(true);
        triggerGenerate(updatedParams as GenerateTripParams);
      }, 900);
    }
  };

  const currentDay = trip
    ? trip.itinerary_data.days.find((d) => d.day === activeDay) ??
      trip.itinerary_data.days[0]
    : null;

  const hasResults = !!trip;
  const currentChips =
    paramStep < PARAM_STEPS.length ? PARAM_STEPS[paramStep].chips : undefined;

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-neutral-50">
      <TopNav />

      {/* Mobile tab switcher */}
      {hasResults && (
        <div className="flex shrink-0 border-b border-neutral-200 bg-white xl:hidden">
          {(["chat", "plan"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 py-3 text-sm font-semibold transition-colors duration-200",
                activeTab === tab
                  ? "border-b-2 border-sky-500 text-sky-600"
                  : "text-neutral-500 hover:text-neutral-700"
              )}
            >
              {tab === "chat" ? (
                <>
                  <Sparkles className="size-4" />
                  Chat
                </>
              ) : (
                <>
                  <Map className="size-4" />
                  Plan
                </>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Two-column layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT: Chat panel */}
        <aside
          className={cn(
            "flex w-full flex-col bg-neutral-50 xl:w-[420px] xl:shrink-0 xl:border-r xl:border-neutral-200",
            hasResults && activeTab !== "chat" ? "hidden xl:flex" : "flex"
          )}
        >
          {/* Panel header */}
          <div className="flex shrink-0 items-center gap-3 border-b border-neutral-200 bg-white px-5 py-4">
            <div className="flex size-9 items-center justify-center rounded-xl bg-sky-500">
              <Sparkles className="size-5 text-white" strokeWidth={1.75} />
            </div>
            <div>
              <p className="font-display text-sm font-semibold text-neutral-900">
                AI Travel Assistant
              </p>
              <p className="flex items-center gap-1.5 text-xs text-neutral-400">
                <span
                  className={cn(
                    "inline-block size-1.5 rounded-full",
                    isGenerating ? "bg-warning-500 animate-pulse" : "bg-success-600"
                  )}
                />
                {isGenerating ? "Building your itinerary…" : "Online · ready to plan"}
              </p>
            </div>
          </div>

          {/* Progress indicator */}
          {paramStep > 0 && paramStep <= PARAM_STEPS.length && !hasResults && (
            <div className="shrink-0 border-b border-neutral-100 bg-white px-5 pb-3 pt-2">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-neutral-400">
                  Step {Math.min(paramStep, PARAM_STEPS.length)} of {PARAM_STEPS.length}
                </span>
                <span className="text-xs font-medium text-sky-600">
                  {Math.round((Math.min(paramStep, PARAM_STEPS.length) / PARAM_STEPS.length) * 100)}%
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-neutral-100">
                <div
                  className="h-1.5 rounded-full bg-sky-500 transition-all duration-500"
                  style={{
                    width: `${(Math.min(paramStep, PARAM_STEPS.length) / PARAM_STEPS.length) * 100}%`,
                  }}
                />
              </div>
            </div>
          )}

          {/* Messages list */}
          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                style={{ animation: "fadeInUp 200ms ease-out both" }}
              >
                <ChatBubble role={msg.role} content={msg.content} />
              </div>
            ))}
            {isTyping && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggestions + input */}
          <div className="shrink-0 space-y-3 border-t border-neutral-200 bg-white p-4">
            {!isTyping && !isGenerating && currentChips && paramStep < PARAM_STEPS.length && (
              <SuggestionChips
                chips={currentChips}
                onSelect={handleSend}
                disabled={isTyping || isGenerating}
              />
            )}
            <ChatInput
              onSend={handleSend}
              isLoading={isTyping || isGenerating}
            />
          </div>
        </aside>

        {/* RIGHT: Results panel */}
        <main
          className={cn(
            "flex flex-1 flex-col overflow-hidden",
            hasResults && activeTab !== "plan" ? "hidden xl:flex" : "flex"
          )}
        >
          {hasResults && trip && currentDay ? (
            <div className="flex h-full flex-col overflow-hidden">
              {/* Trip header */}
              <div className="shrink-0 border-b border-neutral-200 bg-white px-6 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-sky-600">
                      Your itinerary
                    </p>
                    <h1 className="mt-0.5 font-display text-2xl font-bold text-neutral-900">
                      {trip.itinerary_data.destination}
                    </h1>
                  </div>
                  <button
                    onClick={() => router.push("/my-trips")}
                    className={cn(
                      "flex shrink-0 items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-white transition-all duration-200 active:scale-95",
                      isSaved
                        ? "bg-emerald-500 hover:bg-emerald-600"
                        : "bg-sky-500 hover:bg-sky-600 hover:shadow-brand"
                    )}
                  >
                    {isSaved ? (
                      <>
                        <Check className="size-4" />
                        Saved
                      </>
                    ) : (
                      <>
                        Save trip
                        <ChevronRight className="size-4" />
                      </>
                    )}
                  </button>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {[
                    {
                      icon: Calendar,
                      label: `${trip.itinerary_data.duration_days} days`,
                    },
                    {
                      icon: MapPin,
                      label: `${trip.itinerary_data.origin} → ${trip.itinerary_data.destination}`,
                    },
                  ].map(({ icon: Icon, label }) => (
                    <span
                      key={label}
                      className="flex items-center gap-1.5 rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-600"
                    >
                      <Icon className="size-3.5 text-sky-500" strokeWidth={2} />
                      {label}
                    </span>
                  ))}
                  <span className="flex items-center gap-1.5 rounded-full bg-sky-100 px-3 py-1 text-xs font-medium text-sky-700">
                    <DollarSign className="size-3.5" strokeWidth={2} />
                    ~${trip.itinerary_data.total_budget_est.toLocaleString()} total est.
                  </span>
                </div>
              </div>

              {/* Body — day sidebar + content */}
              <div className="flex flex-1 overflow-hidden">
                {/* Day selector (desktop) */}
                <div className="hidden w-20 shrink-0 flex-col gap-1 overflow-y-auto border-r border-neutral-200 bg-white p-2 lg:flex">
                  {trip.itinerary_data.days.map(({ day }) => (
                    <button
                      key={day}
                      onClick={() => setActiveDay(day)}
                      className={cn(
                        "flex flex-col items-center gap-0.5 rounded-xl px-2 py-3 text-center transition-all duration-200",
                        activeDay === day
                          ? "bg-sky-500 text-white shadow-brand"
                          : "text-neutral-500 hover:bg-sky-50 hover:text-sky-600"
                      )}
                    >
                      <span className="text-[10px] font-semibold uppercase tracking-wide opacity-70">
                        Day
                      </span>
                      <span className="font-display text-xl font-bold leading-none">
                        {day}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Day content */}
                <div className="flex flex-1 flex-col overflow-hidden">
                  {/* Mobile day tabs */}
                  <div className="flex gap-1 overflow-x-auto border-b border-neutral-200 bg-white px-4 py-2 lg:hidden">
                    {trip.itinerary_data.days.map(({ day }) => (
                      <button
                        key={day}
                        onClick={() => setActiveDay(day)}
                        className={cn(
                          "shrink-0 rounded-lg px-3 py-1.5 text-sm font-semibold transition-all duration-200",
                          activeDay === day
                            ? "bg-sky-500 text-white"
                            : "text-neutral-500 hover:bg-sky-50 hover:text-sky-600"
                        )}
                      >
                        Day {day}
                      </button>
                    ))}
                  </div>

                  {/* Scrollable content */}
                  <div className="flex-1 overflow-y-auto">
                    {/* Hero image */}
                    <div className="relative mx-4 mt-4 overflow-hidden rounded-2xl">
                      <img
                        src={`https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1200&q=80`}
                        alt={`Day ${activeDay} — ${currentDay.title}`}
                        className="h-40 w-full object-cover lg:h-52"
                      />
                      <div
                        className="absolute inset-0"
                        style={{ background: "var(--gradient-card-overlay)" }}
                      />
                      <div className="absolute bottom-3 left-4 flex items-center gap-2">
                        <MapPin className="size-4 text-white" />
                        <span className="text-sm font-semibold text-white">
                          Day {activeDay} — {currentDay.title}
                        </span>
                      </div>
                    </div>

                    <div className="p-4 pb-2">
                      <h2 className="font-display text-lg font-semibold text-neutral-900">
                        Day {activeDay}: {currentDay.title}
                      </h2>
                    </div>

                    {/* Activities timeline */}
                    <div className="relative px-4 pb-4 space-y-3">
                      <div className="absolute left-[34px] top-0 h-full w-0.5 bg-sky-100" />
                      {currentDay.activities.map((activity, idx) => (
                        <div key={idx} className="relative flex gap-4">
                          <div className="relative z-10 mt-1 flex size-9 shrink-0 items-center justify-center rounded-full bg-white text-base shadow-xs ring-2 ring-sky-100">
                            {ACTIVITY_ICON[activity.type] ?? "📍"}
                          </div>
                          <div className="flex-1 rounded-xl border border-neutral-100 bg-white p-3 shadow-xs transition-shadow duration-200 hover:shadow-md">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm font-semibold text-neutral-800">
                                {activity.name}
                              </p>
                              <span className="shrink-0 font-mono text-xs text-neutral-400">
                                {activity.time}
                              </span>
                            </div>
                            {activity.description && (
                              <p className="mt-1 text-xs text-neutral-500 leading-relaxed">
                                {activity.description}
                              </p>
                            )}
                            <div className="mt-2 flex items-center justify-between">
                              <p className="text-xs capitalize text-neutral-400">
                                {activity.type.replace("_", " ")}
                                {activity.location ? ` · ${activity.location}` : ""}
                              </p>
                              {activity.cost_est > 0 && (
                                <span className="text-xs font-semibold text-sky-600">
                                  ~${activity.cost_est}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Trip info cards (day 1 only) */}
                    {activeDay === 1 && (
                      <div className="mx-4 mb-6 space-y-3">
                        {trip.itinerary_data.visa_info && (
                          <InfoCard
                            icon="🛂"
                            label="Visa info"
                            text={trip.itinerary_data.visa_info}
                          />
                        )}
                        {trip.itinerary_data.accommodation_summary && (
                          <InfoCard
                            icon="🏨"
                            label="Accommodation"
                            text={trip.itinerary_data.accommodation_summary}
                          />
                        )}
                        {trip.itinerary_data.transport_tips && (
                          <InfoCard
                            icon="🚌"
                            label="Getting around"
                            text={trip.itinerary_data.transport_tips}
                          />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Empty / loading state */
            <EmptyPanel isGenerating={isGenerating} />
          )}
        </main>
      </div>
    </div>
  );
}

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
    <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-xs">
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-base">{icon}</span>
        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
          {label}
        </p>
      </div>
      <p className="text-sm text-neutral-700 leading-relaxed">{text}</p>
    </div>
  );
}

function EmptyPanel({ isGenerating }: { isGenerating: boolean }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 p-8 text-center">
      <div
        className="flex size-20 items-center justify-center rounded-3xl"
        style={{ background: "var(--gradient-subtle)" }}
      >
        {isGenerating ? (
          <Sparkles
            className="size-10 text-sky-500 animate-pulse"
            strokeWidth={1.5}
          />
        ) : (
          <Plane className="size-10 text-sky-500" strokeWidth={1.5} />
        )}
      </div>
      <div>
        <h2 className="font-display text-2xl font-bold text-neutral-900">
          {isGenerating ? "Building your itinerary…" : "Your plan will appear here"}
        </h2>
        <p className="mt-2 max-w-sm text-sm text-neutral-500">
          {isGenerating
            ? "The AI is crafting a personalised day-by-day plan. This usually takes 15–30 seconds."
            : "Answer the 7 questions in the chat and watch your personalised itinerary come to life."}
        </p>
      </div>
      {!isGenerating && (
        <div className="flex flex-wrap justify-center gap-2">
          {["✈️ Flights", "🏨 Hotels", "📅 Itinerary", "💰 Budget"].map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-sky-100 px-4 py-2 text-sm font-medium text-sky-700"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
      {isGenerating && (
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="size-2 rounded-full bg-sky-400 animate-bounce"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
