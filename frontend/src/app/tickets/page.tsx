"use client";

import { useState } from "react";
import {
  Landmark,
  Users,
  Wrench,
  HandHeart,
  Ticket,
} from "lucide-react";
import { EventCard, type EventCategory } from "@/components/cards/event-card";
import { WalletSection } from "@/components/tickets/wallet-section";
import { cn } from "@/lib/utils";

type CategoryTab = EventCategory | "all";

interface Tab {
  id: CategoryTab;
  label: string;
  icon: React.ReactNode;
}

const TABS: Tab[] = [
  {
    id: "all",
    label: "All",
    icon: <Ticket className="size-4" strokeWidth={1.75} />,
  },
  {
    id: "museum",
    label: "Museums",
    icon: <Landmark className="size-4" strokeWidth={1.75} />,
  },
  {
    id: "networking",
    label: "Networking Events",
    icon: <Users className="size-4" strokeWidth={1.75} />,
  },
  {
    id: "workshop",
    label: "Workshops",
    icon: <Wrench className="size-4" strokeWidth={1.75} />,
  },
  {
    id: "local",
    label: "Meet with Locals",
    icon: <HandHeart className="size-4" strokeWidth={1.75} />,
  },
];

const MOCK_EVENTS = [
  {
    id: "1",
    title: "The Louvre — Skip-the-Line Guided Tour",
    category: "museum" as EventCategory,
    imageUrl: "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=600&q=80",
    date: "May 15, 2026",
    time: "10:00 AM – 1:00 PM",
    location: "Paris, France",
    price: 49,
    spotsLeft: 3,
  },
  {
    id: "2",
    title: "Tech Founders Mixer — Barcelona Summit",
    category: "networking" as EventCategory,
    imageUrl: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&q=80",
    date: "May 20, 2026",
    time: "6:00 PM – 10:00 PM",
    location: "Barcelona, Spain",
    price: 29,
    spotsLeft: 18,
  },
  {
    id: "3",
    title: "Traditional Japanese Ceramics Workshop",
    category: "workshop" as EventCategory,
    imageUrl: "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=600&q=80",
    date: "May 22, 2026",
    time: "2:00 PM – 5:00 PM",
    location: "Kyoto, Japan",
    price: 65,
    spotsLeft: 8,
  },
  {
    id: "4",
    title: "Sunset Walk & Stories with a Local Guide",
    category: "local" as EventCategory,
    imageUrl: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=600&q=80",
    date: "May 18, 2026",
    time: "5:30 PM – 8:00 PM",
    location: "Lisbon, Portugal",
    price: 22,
    spotsLeft: 6,
  },
  {
    id: "5",
    title: "Rijksmuseum — Dutch Masters Private Evening",
    category: "museum" as EventCategory,
    imageUrl: "https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=600&q=80",
    date: "May 25, 2026",
    time: "7:00 PM – 9:30 PM",
    location: "Amsterdam, Netherlands",
    price: 75,
    spotsLeft: 12,
  },
  {
    id: "6",
    title: "Sustainable Travel Networking Brunch",
    category: "networking" as EventCategory,
    imageUrl: "https://images.unsplash.com/photo-1559329007-40df8a9345d8?w=600&q=80",
    date: "May 28, 2026",
    time: "11:00 AM – 2:00 PM",
    location: "Copenhagen, Denmark",
    price: 35,
    spotsLeft: 22,
  },
  {
    id: "7",
    title: "Neapolitan Pizza-Making Masterclass",
    category: "workshop" as EventCategory,
    imageUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&q=80",
    date: "Jun 1, 2026",
    time: "12:00 PM – 3:30 PM",
    location: "Naples, Italy",
    price: 55,
    spotsLeft: 10,
  },
  {
    id: "8",
    title: "Hidden Istanbul: Bazaars & Tea with Locals",
    category: "local" as EventCategory,
    imageUrl: "https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=600&q=80",
    date: "Jun 5, 2026",
    time: "9:00 AM – 1:00 PM",
    location: "Istanbul, Turkey",
    price: 30,
    spotsLeft: 5,
  },
];

const MOCK_WALLET_TICKETS = [
  {
    id: "t1",
    eventTitle: "Colosseum — Early Access VIP Tour",
    date: "May 10, 2026",
    location: "Rome, Italy",
    status: "upcoming" as const,
  },
  {
    id: "t2",
    eventTitle: "Street Art Workshop — Shoreditch",
    date: "Apr 28, 2026",
    location: "London, UK",
    status: "used" as const,
  },
];

export default function TicketMarketPage() {
  const [activeTab, setActiveTab] = useState<CategoryTab>("all");

  const filteredEvents =
    activeTab === "all"
      ? MOCK_EVENTS
      : MOCK_EVENTS.filter((e) => e.category === activeTab);

  return (
    <main className="min-h-screen bg-neutral-50">
      <div className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-10">

        {/* Page header */}
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="flex size-9 items-center justify-center rounded-xl bg-sky-100">
              <Ticket className="size-5 text-sky-600" strokeWidth={1.75} />
            </div>
            <h1 className="font-display text-display-sm font-bold text-neutral-900">
              Ticket Market
            </h1>
          </div>
          <p className="text-sm text-neutral-500 ml-12">
            Discover and book experiences at your destination
          </p>
        </header>

        {/* Category tabs */}
        <nav
          aria-label="Event categories"
          className="mb-6 flex gap-2 overflow-x-auto pb-1 scrollbar-none"
        >
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              aria-pressed={activeTab === tab.id}
              className={cn(
                "inline-flex shrink-0 items-center gap-2 rounded-full px-4 h-9 text-sm font-medium",
                "border transition-all duration-200 focus-visible:outline-2 focus-visible:outline-sky-500 focus-visible:outline-offset-2",
                activeTab === tab.id
                  ? "bg-sky-500 border-sky-500 text-white shadow-sm"
                  : "bg-white border-neutral-200 text-neutral-600 hover:border-sky-300 hover:text-sky-600 hover:bg-sky-50"
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Event cards grid */}
        {filteredEvents.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4 mb-10">
            {filteredEvents.map((event) => (
              <EventCard
                key={event.id}
                {...event}
                onBuy={(id) => {
                  console.log("Buy ticket for event:", id);
                }}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-center mb-10">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-neutral-100">
              <Ticket className="size-7 text-neutral-400" strokeWidth={1.5} />
            </div>
            <p className="text-sm font-semibold text-neutral-700">
              No events in this category
            </p>
            <p className="text-sm text-neutral-400">
              Check back soon for new experiences.
            </p>
          </div>
        )}

        {/* Wallet section */}
        <WalletSection
          balance={240}
          currency="USD"
          tickets={MOCK_WALLET_TICKETS}
        />
      </div>
    </main>
  );
}
