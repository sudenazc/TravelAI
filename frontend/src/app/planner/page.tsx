"use client";

import { useState, useRef, useEffect } from "react";
import {
  MapPin,
  Calendar,
  Users,
  ChevronRight,
  Plane,
  Star,
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

interface Message {
  id: string;
  role: "ai" | "user";
  content: string;
}

interface Activity {
  time: string;
  name: string;
  type: "hotel" | "food" | "transport" | "activity";
}

interface ItineraryDay {
  day: number;
  title: string;
  activities: Activity[];
}

const INITIAL_MESSAGES: Message[] = [
  {
    id: "welcome",
    role: "ai",
    content:
      "Hi! ✈️ I'm your AI travel assistant. Tell me your dream destination and I'll craft a personalised itinerary — flights, hotels and day-by-day plans included.",
  },
];

const SUGGESTION_CHIPS = [
  "🗾 Tokyo for 8 days",
  "🌴 Bali honeymoon",
  "🗼 Paris weekend",
  "🏔️ Nepal adventure",
  "🌊 Greek islands cruise",
];

const AI_RESPONSES = [
  "Sounds amazing! Let me build your personalised Japan itinerary ✨",
  "Your 8-day Tokyo & Kyoto plan is ready! I've balanced culture, food, and nature. Check the itinerary on the right →",
];

const ITINERARY_DAYS: ItineraryDay[] = [
  {
    day: 1,
    title: "Arrival & Shinjuku",
    activities: [
      { time: "14:00", name: "Hotel check-in — Shinjuku Granbell", type: "hotel" },
      { time: "17:00", name: "Shinjuku Gyoen Garden stroll", type: "activity" },
      { time: "19:30", name: "Dinner at Omoide Yokocho", type: "food" },
      { time: "21:00", name: "Tokyo Metropolitan Gov. Observatory", type: "activity" },
    ],
  },
  {
    day: 2,
    title: "Harajuku & Shibuya",
    activities: [
      { time: "09:00", name: "Meiji Shrine morning visit", type: "activity" },
      { time: "11:00", name: "Takeshita Street, Harajuku", type: "activity" },
      { time: "13:00", name: "Lunch — local ramen shop", type: "food" },
      { time: "15:00", name: "Shibuya Scramble Crossing", type: "activity" },
      { time: "18:00", name: "Shibuya Sky rooftop sunset", type: "activity" },
    ],
  },
  {
    day: 3,
    title: "Asakusa & Ueno",
    activities: [
      { time: "08:00", name: "Tsukiji Outer Market breakfast", type: "food" },
      { time: "10:00", name: "Senso-ji Temple, Asakusa", type: "activity" },
      { time: "13:00", name: "Nakamise Shopping Street", type: "activity" },
      { time: "15:00", name: "Ueno Park & National Museum", type: "activity" },
    ],
  },
  {
    day: 4,
    title: "Nikko Day Trip",
    activities: [
      { time: "07:30", name: "Shinkansen to Nikko", type: "transport" },
      { time: "10:00", name: "Tosho-gu Shrine complex", type: "activity" },
      { time: "13:00", name: "Kegon Falls", type: "activity" },
      { time: "17:00", name: "Return to Tokyo", type: "transport" },
    ],
  },
  {
    day: 5,
    title: "Kyoto Arrival",
    activities: [
      { time: "09:00", name: "Shinkansen Tokyo → Kyoto (2h 15m)", type: "transport" },
      { time: "12:00", name: "Hotel check-in — The Screen Kyoto", type: "hotel" },
      { time: "14:00", name: "Fushimi Inari Taisha torii gates", type: "activity" },
      { time: "18:00", name: "Gion District evening stroll", type: "activity" },
      { time: "19:30", name: "Traditional kaiseki dinner", type: "food" },
    ],
  },
  {
    day: 6,
    title: "Arashiyama",
    activities: [
      { time: "08:00", name: "Bamboo Grove (before crowds)", type: "activity" },
      { time: "10:00", name: "Tenryu-ji Zen Garden", type: "activity" },
      { time: "12:00", name: "Sagano Romantic Train", type: "transport" },
      { time: "15:00", name: "Nishiki Market food tour", type: "food" },
      { time: "17:00", name: "Kinkaku-ji (Golden Pavilion)", type: "activity" },
    ],
  },
  {
    day: 7,
    title: "Nara Day Trip",
    activities: [
      { time: "09:00", name: "Train to Nara (45 min)", type: "transport" },
      { time: "10:00", name: "Feed deer in Nara Park", type: "activity" },
      { time: "11:30", name: "Todai-ji Great Buddha Hall", type: "activity" },
      { time: "14:00", name: "Return to Kyoto", type: "transport" },
      { time: "16:00", name: "Philosopher's Path walk", type: "activity" },
    ],
  },
  {
    day: 8,
    title: "Osaka & Departure",
    activities: [
      { time: "09:00", name: "Check out & luggage storage", type: "hotel" },
      { time: "10:00", name: "Dotonbori street food crawl", type: "food" },
      { time: "13:00", name: "Osaka Castle", type: "activity" },
      { time: "16:00", name: "KIX Airport departure", type: "transport" },
    ],
  },
];

const ACTIVITY_ICON: Record<Activity["type"], string> = {
  hotel: "🏨",
  food: "🍜",
  transport: "🚄",
  activity: "📍",
};

export default function PlannerPage() {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [isTyping, setIsTyping] = useState(false);
  const [hasResults, setHasResults] = useState(false);
  const [activeDay, setActiveDay] = useState(1);
  const [activeTab, setActiveTab] = useState<"chat" | "plan">("chat");
  const [responseStep, setResponseStep] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = (text: string) => {
    const userMsg: Message = { id: `user-${Date.now()}`, role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    const firstReply = AI_RESPONSES[responseStep] ?? "Let me look into that for you!";
    const secondReply = AI_RESPONSES[responseStep + 1];

    setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        { id: `ai-${Date.now()}`, role: "ai", content: firstReply },
      ]);
      setResponseStep((s) => s + 1);

      if (secondReply) {
        setIsTyping(true);
        setTimeout(() => {
          setIsTyping(false);
          setMessages((prev) => [
            ...prev,
            { id: `ai-${Date.now() + 1}`, role: "ai", content: secondReply },
          ]);
          setHasResults(true);
          setActiveTab("plan");
          setResponseStep((s) => s + 1);
        }, 1600);
      }
    }, 1500);
  };

  const currentDay = ITINERARY_DAYS.find((d) => d.day === activeDay)!;

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-neutral-50">
      <TopNav />

      {/* Mobile tab switcher — visible only when results are ready */}
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

      {/* ── Two-column layout ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* ── LEFT: Chat panel (420px) ── */}
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
                <span className="inline-block size-1.5 rounded-full bg-success-600" />
                Online · ready to plan
              </p>
            </div>
          </div>

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
            {!isTyping && !hasResults && (
              <SuggestionChips
                chips={SUGGESTION_CHIPS}
                onSelect={handleSend}
                disabled={isTyping}
              />
            )}
            <ChatInput onSend={handleSend} isLoading={isTyping} />
          </div>
        </aside>

        {/* ── RIGHT: Results panel ── */}
        <main
          className={cn(
            "flex flex-1 flex-col overflow-hidden",
            hasResults && activeTab !== "plan" ? "hidden xl:flex" : "flex"
          )}
        >
          {hasResults ? (
            <div className="flex h-full flex-col overflow-hidden">
              {/* Trip header */}
              <div className="shrink-0 border-b border-neutral-200 bg-white px-6 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-sky-600">
                      Your itinerary
                    </p>
                    <h1 className="mt-0.5 font-display text-2xl font-bold text-neutral-900">
                      Tokyo &amp; Kyoto
                    </h1>
                  </div>
                  <button className="flex shrink-0 items-center gap-1.5 rounded-xl bg-sky-500 px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:bg-sky-600 hover:shadow-brand active:scale-95">
                    Book trip
                    <ChevronRight className="size-4" />
                  </button>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {[
                    { icon: Calendar, label: "May 20 – 28, 2026" },
                    { icon: Users, label: "2 people" },
                    { icon: MapPin, label: "Japan" },
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
                    ~$3,200 / person
                  </span>
                </div>
              </div>

              {/* Body — day sidebar + content */}
              <div className="flex flex-1 overflow-hidden">
                {/* Day selector (desktop) */}
                <div className="hidden w-20 shrink-0 flex-col gap-1 overflow-y-auto border-r border-neutral-200 bg-white p-2 lg:flex">
                  {ITINERARY_DAYS.map(({ day }) => (
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
                      <span className="font-display text-xl font-bold leading-none">{day}</span>
                    </button>
                  ))}
                </div>

                {/* Day content */}
                <div className="flex flex-1 flex-col overflow-hidden">
                  {/* Mobile day tabs */}
                  <div className="flex gap-1 overflow-x-auto border-b border-neutral-200 bg-white px-4 py-2 lg:hidden">
                    {ITINERARY_DAYS.map(({ day }) => (
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
                    {/* Map / hero image */}
                    <div className="relative mx-4 mt-4 overflow-hidden rounded-2xl">
                      <img
                        src="https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1200&q=80"
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

                    {/* Activities timeline */}
                    <div className="p-4 pb-2">
                      <h2 className="font-display text-lg font-semibold text-neutral-900">
                        Day {activeDay}: {currentDay.title}
                      </h2>
                    </div>

                    <div className="relative px-4 pb-4 space-y-3">
                      <div className="absolute left-[34px] top-0 h-full w-0.5 bg-sky-100" />
                      {currentDay.activities.map((activity, idx) => (
                        <div key={idx} className="relative flex gap-4">
                          <div className="relative z-10 mt-1 flex size-9 shrink-0 items-center justify-center rounded-full bg-white text-base shadow-xs ring-2 ring-sky-100">
                            {ACTIVITY_ICON[activity.type]}
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
                            <p className="mt-0.5 text-xs capitalize text-neutral-400">
                              {activity.type}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Flight & hotel cards (day 1 only) */}
                    {activeDay === 1 && (
                      <div className="mx-4 mb-6 space-y-3">
                        <h3 className="font-display text-sm font-semibold text-neutral-700">
                          Flights &amp; Stay
                        </h3>

                        {/* Flight card */}
                        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-xs">
                          <div className="grid grid-cols-3 items-center gap-2 text-center">
                            <div>
                              <p className="font-display text-xl font-bold text-neutral-900">
                                10:30
                              </p>
                              <p className="text-xs text-neutral-400">JFK</p>
                            </div>
                            <div className="flex flex-col items-center gap-1">
                              <Plane className="size-5 text-sky-400" />
                              <p className="text-xs text-neutral-500">14h 20m</p>
                              <div className="h-px w-full bg-neutral-200" />
                            </div>
                            <div>
                              <p className="font-display text-xl font-bold text-neutral-900">
                                14:50+1
                              </p>
                              <p className="text-xs text-neutral-400">HND</p>
                            </div>
                          </div>
                          <div className="mt-3 flex items-center justify-between border-t border-neutral-100 pt-3">
                            <span className="text-xs text-neutral-500">
                              Japan Airlines · Economy
                            </span>
                            <span className="font-display text-base font-bold text-sky-600">
                              $890
                            </span>
                          </div>
                        </div>

                        {/* Hotel card */}
                        <div className="flex gap-3 rounded-xl border border-neutral-200 bg-white p-3 shadow-xs">
                          <img
                            src="https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=120&q=80"
                            alt="Shinjuku Granbell Hotel"
                            className="size-16 rounded-lg object-cover"
                          />
                          <div className="flex flex-1 flex-col justify-center gap-1">
                            <p className="text-sm font-semibold text-neutral-800">
                              Shinjuku Granbell Hotel
                            </p>
                            <div className="flex items-center gap-1">
                              {Array.from({ length: 4 }).map((_, i) => (
                                <Star
                                  key={i}
                                  className="size-3 fill-warning-500 text-warning-500"
                                  strokeWidth={0}
                                />
                              ))}
                              <span className="text-xs text-neutral-500">4.6 (2.1k)</span>
                            </div>
                            <p className="text-xs font-bold text-sky-600">
                              $180{" "}
                              <span className="font-normal text-neutral-400">/night</span>
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Empty state */
            <div className="flex flex-1 flex-col items-center justify-center gap-6 p-8 text-center">
              <div
                className="flex size-20 items-center justify-center rounded-3xl"
                style={{ background: "var(--gradient-subtle)" }}
              >
                <Plane className="size-10 text-sky-500" strokeWidth={1.5} />
              </div>
              <div>
                <h2 className="font-display text-2xl font-bold text-neutral-900">
                  Your plan will appear here
                </h2>
                <p className="mt-2 max-w-sm text-sm text-neutral-500">
                  Tell the AI assistant your dream destination and watch your personalised
                  itinerary come to life.
                </p>
              </div>
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
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
