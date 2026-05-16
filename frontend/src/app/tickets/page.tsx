"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Landmark,
  Users,
  Wrench,
  HandHeart,
  Ticket,
} from "lucide-react";
import { EventCard } from "@/components/cards/event-card";
import { WalletSection } from "@/components/tickets/wallet-section";
import { BuyTicketModal } from "@/components/tickets/buy-ticket-modal";
import { TopNav } from "@/components/navigation";
import { BottomTabBar } from "@/components/navigation/bottom-tab-bar";
import { cn } from "@/lib/utils";
import { http, ApiError } from "@/lib/http";
import { getAccessToken } from "@/lib/auth";
import { env } from "@/lib/env";
import type { EventCategory, EventResponse, OwnedTicketResponse } from "@/types/tickets";

type CategoryTab = EventCategory | "all";

interface Tab {
  id: CategoryTab;
  label: string;
  icon: React.ReactNode;
}

type ModalState = "confirm" | "loading" | "success";

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

export default function TicketMarketPage() {
  const [activeTab, setActiveTab] = useState<CategoryTab>("all");
  const [events, setEvents] = useState<EventResponse[]>([]);
  const [ownedTickets, setOwnedTickets] = useState<OwnedTicketResponse[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [walletLoading, setWalletLoading] = useState(true);
  const [eventsError, setEventsError] = useState<string | null>(null);

  const [selectedEvent, setSelectedEvent] = useState<EventResponse | null>(null);
  const [modalState, setModalState] = useState<ModalState>("confirm");
  const [purchaseError, setPurchaseError] = useState<string | null>(null);

  const fetchEvents = useCallback(() => {
    setEventsLoading(true);
    setEventsError(null);
    const params =
      activeTab !== "all" ? { category: activeTab } : undefined;
    http
      .get<EventResponse[]>("/tickets/events", { params })
      .then(setEvents)
      .catch((err: Error) => setEventsError(err.message))
      .finally(() => setEventsLoading(false));
  }, [activeTab]);

  const fetchOwnedTickets = useCallback(async () => {
    setWalletLoading(true);
    try {
      const token = getAccessToken();
      if (!token) return;
      const res = await fetch(`${env.apiBaseUrl}/tickets`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });
      if (!res.ok) return;
      const data: OwnedTicketResponse[] = await res.json();
      setOwnedTickets(data);
    } catch {
      // Silently ignore — wallet is non-critical
    } finally {
      setWalletLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  useEffect(() => {
    fetchOwnedTickets();
  }, [fetchOwnedTickets]);

  const handleBuy = (eventId: string) => {
    const event = events.find((e) => e.id === eventId) ?? null;
    setSelectedEvent(event);
    setModalState("confirm");
    setPurchaseError(null);
  };

  const handleConfirmPurchase = async () => {
    if (!selectedEvent) return;
    setModalState("loading");
    setPurchaseError(null);
    try {
      await http.post("/tickets/purchase", { event_id: selectedEvent.id });
      setModalState("success");
      fetchOwnedTickets();
      fetchEvents();
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : "Purchase failed. Try again.";
      setPurchaseError(msg);
      setModalState("confirm");
    }
  };

  const handleCloseModal = () => {
    setSelectedEvent(null);
    setPurchaseError(null);
  };

  const filteredEvents =
    activeTab === "all" ? events : events.filter((e) => e.category === activeTab);

  return (
    <div className="min-h-screen bg-neutral-50">
      <TopNav />

      <main className="mx-auto max-w-[1440px] px-4 py-8 pb-24 sm:px-6 lg:px-10 lg:pb-8">

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

        {/* Purchase error */}
        {purchaseError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {purchaseError}
          </div>
        )}

        {/* Event cards grid */}
        {eventsLoading ? (
          <EventGridSkeleton />
        ) : eventsError ? (
          <EventsError message={eventsError} onRetry={fetchEvents} />
        ) : filteredEvents.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4 mb-10">
            {filteredEvents.map((event) => (
              <EventCard
                key={event.id}
                id={event.id}
                title={event.title}
                category={event.category}
                imageUrl={event.image_url}
                date={event.date}
                time={event.time}
                location={event.location}
                price={event.price_usd}
                spotsLeft={event.spots_left ?? undefined}
                onBuy={handleBuy}
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
          tickets={
            walletLoading
              ? []
              : ownedTickets.map((t) => ({
                  id: t.id,
                  eventTitle: t.event_title,
                  date: t.date,
                  location: t.location,
                  status: t.status,
                }))
          }
          isLoading={walletLoading}
        />
      </main>

      {/* Buy ticket modal */}
      <BuyTicketModal
        event={selectedEvent}
        state={modalState}
        onConfirm={handleConfirmPurchase}
        onClose={handleCloseModal}
      />

      <BottomTabBar />
    </div>
  );
}

function EventGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4 mb-10">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="h-72 rounded-xl border border-neutral-100 bg-white animate-pulse"
        />
      ))}
    </div>
  );
}

function EventsError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-red-100 bg-red-50 py-16 text-center mb-10">
      <p className="text-sm font-medium text-red-600">{message}</p>
      <button
        onClick={onRetry}
        className="rounded-md bg-sky-500 px-5 h-9 text-sm font-semibold text-white hover:bg-sky-600 transition-colors"
      >
        Retry
      </button>
    </div>
  );
}
