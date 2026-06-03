"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Landmark,
  Users,
  Wrench,
  HandHeart,
  Ticket,
  Gift,
  MapPin,
} from "lucide-react";
import { EventCard } from "@/components/cards/event-card";
import { WalletSection } from "@/components/tickets/wallet-section";
import { BuyTicketModal } from "@/components/tickets/buy-ticket-modal";
import { OpportunityCard } from "@/components/tickets/opportunity-card";
import { ClaimModal } from "@/components/tickets/claim-modal";
import { TopNav } from "@/components/navigation";
import { BottomTabBar } from "@/components/navigation/bottom-tab-bar";
import { cn } from "@/lib/utils";
import { http, ApiError } from "@/lib/http";
import { getAccessToken } from "@/lib/auth";
import { env } from "@/lib/env";
import type {
  EventCategory,
  EventResponse,
  OwnedTicketResponse,
  OpportunityCategory,
  OpportunityResponse,
  ClaimedOpportunityResponse,
} from "@/types/tickets";

type CategoryTab = EventCategory | "all";
type OpportunityCategoryTab = OpportunityCategory | "all";
type PageSection = "tickets" | "opportunities";
type ModalState = "confirm" | "loading" | "success";

interface Tab {
  id: CategoryTab;
  label: string;
  icon: React.ReactNode;
}

interface OppCategoryTab {
  id: OpportunityCategoryTab;
  label: string;
}

const TABS: Tab[] = [
  { id: "all", label: "All", icon: <Ticket className="size-4" strokeWidth={1.75} /> },
  { id: "museum", label: "Museums", icon: <Landmark className="size-4" strokeWidth={1.75} /> },
  { id: "networking", label: "Networking", icon: <Users className="size-4" strokeWidth={1.75} /> },
  { id: "workshop", label: "Workshops", icon: <Wrench className="size-4" strokeWidth={1.75} /> },
  { id: "local", label: "Meet with Locals", icon: <HandHeart className="size-4" strokeWidth={1.75} /> },
];

const OPP_CATEGORY_TABS: OppCategoryTab[] = [
  { id: "all", label: "All" },
  { id: "Museum", label: "Museum" },
  { id: "Concert", label: "Concert" },
  { id: "Art", label: "Art" },
  { id: "Hotel", label: "Hotel" },
  { id: "Workshop", label: "Workshop" },
  { id: "Festival", label: "Festival" },
  { id: "Networking", label: "Networking" },
];

export default function TicketMarketPage() {
  const [section, setSection] = useState<PageSection>("tickets");

  // Ticket Market state
  const [activeTab, setActiveTab] = useState<CategoryTab>("all");
  const [events, setEvents] = useState<EventResponse[]>([]);
  const [ownedTickets, setOwnedTickets] = useState<OwnedTicketResponse[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [walletLoading, setWalletLoading] = useState(true);
  const [eventsError, setEventsError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<EventResponse | null>(null);
  const [ticketModalState, setTicketModalState] = useState<ModalState>("confirm");
  const [purchaseError, setPurchaseError] = useState<string | null>(null);

  // Opportunities state
  const [oppCategory, setOppCategory] = useState<OpportunityCategoryTab>("all");
  const [cityFilter, setCityFilter] = useState("");
  const [opportunities, setOpportunities] = useState<OpportunityResponse[]>([]);
  const [claimedOpps, setClaimedOpps] = useState<ClaimedOpportunityResponse[]>([]);
  const [oppsLoading, setOppsLoading] = useState(false);
  const [oppsError, setOppsError] = useState<string | null>(null);
  const [claimedLoading, setClaimedLoading] = useState(false);
  const [selectedOpp, setSelectedOpp] = useState<OpportunityResponse | null>(null);
  const [claimModalState, setClaimModalState] = useState<ModalState>("confirm");
  const [claimResult, setClaimResult] = useState<ClaimedOpportunityResponse | null>(null);
  const [claimError, setClaimError] = useState<string | null>(null);

  // ── Ticket Market fetches ──────────────────────────────────────────
  const fetchEvents = useCallback(() => {
    setEventsLoading(true);
    setEventsError(null);
    const params = activeTab !== "all" ? { category: activeTab } : undefined;
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
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
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

  useEffect(() => { fetchEvents(); }, [fetchEvents]);
  useEffect(() => { fetchOwnedTickets(); }, [fetchOwnedTickets]);

  // ── Opportunities fetches ──────────────────────────────────────────
  const fetchOpportunities = useCallback(() => {
    setOppsLoading(true);
    setOppsError(null);
    const params: Record<string, string> = {};
    if (oppCategory !== "all") params.category = oppCategory;
    if (cityFilter.trim()) params.city = cityFilter.trim();
    http
      .get<OpportunityResponse[]>("/opportunities", { params })
      .then(setOpportunities)
      .catch((err: Error) => setOppsError(err.message))
      .finally(() => setOppsLoading(false));
  }, [oppCategory, cityFilter]);

  const fetchClaimedOpps = useCallback(async () => {
    setClaimedLoading(true);
    try {
      const token = getAccessToken();
      if (!token) return;
      const res = await fetch(`${env.apiBaseUrl}/opportunities/wallet`, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      });
      if (!res.ok) return;
      const data: ClaimedOpportunityResponse[] = await res.json();
      setClaimedOpps(data);
    } catch {
      // Silently ignore
    } finally {
      setClaimedLoading(false);
    }
  }, []);

  useEffect(() => {
    if (section === "opportunities") {
      fetchOpportunities();
      fetchClaimedOpps();
    }
  }, [section, fetchOpportunities, fetchClaimedOpps]);

  // Refetch opportunities when filters change (only when section is active)
  useEffect(() => {
    if (section === "opportunities") fetchOpportunities();
  }, [oppCategory, cityFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Handlers: Ticket Market ────────────────────────────────────────
  const handleBuy = (eventId: string) => {
    const event = events.find((e) => e.id === eventId) ?? null;
    setSelectedEvent(event);
    setTicketModalState("confirm");
    setPurchaseError(null);
  };

  const handleConfirmPurchase = async () => {
    if (!selectedEvent) return;
    setTicketModalState("loading");
    setPurchaseError(null);
    try {
      await http.post("/tickets/purchase", { event_id: selectedEvent.id });
      setTicketModalState("success");
      fetchOwnedTickets();
      fetchEvents();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Purchase failed. Try again.";
      setPurchaseError(msg);
      setTicketModalState("confirm");
    }
  };

  const handleCloseTicketModal = () => {
    setSelectedEvent(null);
    setPurchaseError(null);
  };

  // ── Handlers: Opportunities ────────────────────────────────────────
  const handleClaim = (oppId: string) => {
    const opp = opportunities.find((o) => o.id === oppId) ?? null;
    setSelectedOpp(opp);
    setClaimModalState("confirm");
    setClaimResult(null);
    setClaimError(null);
  };

  const handleConfirmClaim = async () => {
    if (!selectedOpp) return;
    setClaimModalState("loading");
    setClaimError(null);
    try {
      const token = getAccessToken();
      if (!token) throw new Error("Not authenticated.");
      const res = await fetch(`${env.apiBaseUrl}/opportunities/claim/${selectedOpp.id}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.detail ?? "Claim failed. Try again.");
      }
      const data: ClaimedOpportunityResponse = await res.json();
      setClaimResult(data);
      setClaimModalState("success");
      fetchOpportunities();
      fetchClaimedOpps();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Claim failed. Try again.";
      setClaimError(msg);
      setClaimModalState("confirm");
    }
  };

  const handleCloseClaimModal = () => {
    setSelectedOpp(null);
    setClaimResult(null);
    setClaimError(null);
  };

  const filteredEvents =
    activeTab === "all" ? events : events.filter((e) => e.category === activeTab);

  return (
    <div className="min-h-screen bg-neutral-50">
      <TopNav />

      <main className="mx-auto max-w-[1440px] px-4 py-8 pb-24 sm:px-6 lg:px-10 lg:pb-8">

        {/* Page header */}
        <header className="mb-6">
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

        {/* Section switcher */}
        <div className="mb-6 flex gap-1 rounded-xl bg-neutral-100 p-1 w-fit">
          <button
            onClick={() => setSection("tickets")}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg px-4 h-9 text-sm font-medium transition-all duration-200",
              section === "tickets"
                ? "bg-white text-neutral-900 shadow-sm"
                : "text-neutral-500 hover:text-neutral-700"
            )}
          >
            <Ticket className="size-4" strokeWidth={1.75} />
            Ticket Market
          </button>
          <button
            onClick={() => setSection("opportunities")}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg px-4 h-9 text-sm font-medium transition-all duration-200",
              section === "opportunities"
                ? "bg-white text-neutral-900 shadow-sm"
                : "text-neutral-500 hover:text-neutral-700"
            )}
          >
            <Gift className="size-4" strokeWidth={1.75} />
            Opportunities
          </button>
        </div>

        {/* ── TICKET MARKET ── */}
        {section === "tickets" && (
          <>
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

            {purchaseError && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {purchaseError}
              </div>
            )}

            {eventsLoading ? (
              <EventGridSkeleton />
            ) : eventsError ? (
              <SectionError message={eventsError} onRetry={fetchEvents} />
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
              <EmptyState
                icon={<Ticket className="size-7 text-neutral-400" strokeWidth={1.5} />}
                title="No events in this category"
                description="Check back soon for new experiences."
              />
            )}

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
          </>
        )}

        {/* ── OPPORTUNITIES ── */}
        {section === "opportunities" && (
          <>
            {/* Filters row */}
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
              {/* City search */}
              <div className="relative flex items-center">
                <MapPin className="absolute left-3 size-4 text-neutral-400 pointer-events-none" strokeWidth={1.75} />
                <input
                  type="text"
                  value={cityFilter}
                  onChange={(e) => setCityFilter(e.target.value)}
                  placeholder="Filter by city…"
                  className={cn(
                    "h-9 w-full rounded-lg border border-neutral-200 bg-white pl-9 pr-4 text-sm",
                    "placeholder:text-neutral-400 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100",
                    "sm:w-52"
                  )}
                />
              </div>

              {/* Category filter */}
              <nav
                aria-label="Opportunity categories"
                className="flex gap-2 overflow-x-auto pb-1 scrollbar-none"
              >
                {OPP_CATEGORY_TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setOppCategory(tab.id)}
                    aria-pressed={oppCategory === tab.id}
                    className={cn(
                      "inline-flex shrink-0 items-center rounded-full px-4 h-9 text-sm font-medium",
                      "border transition-all duration-200 focus-visible:outline-2 focus-visible:outline-sky-500 focus-visible:outline-offset-2",
                      oppCategory === tab.id
                        ? "bg-sky-500 border-sky-500 text-white shadow-sm"
                        : "bg-white border-neutral-200 text-neutral-600 hover:border-sky-300 hover:text-sky-600 hover:bg-sky-50"
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            {claimError && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {claimError}
              </div>
            )}

            {oppsLoading ? (
              <OpportunityGridSkeleton />
            ) : oppsError ? (
              <SectionError message={oppsError} onRetry={fetchOpportunities} />
            ) : opportunities.length > 0 ? (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4 mb-10">
                {opportunities.map((opp) => (
                  <OpportunityCard
                    key={opp.id}
                    opportunity={opp}
                    onClaim={handleClaim}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<Gift className="size-7 text-neutral-400" strokeWidth={1.5} />}
                title="No opportunities available"
                description="Try a different city or category."
              />
            )}

            {/* Claimed wallet */}
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
              claimedOpportunities={claimedLoading ? [] : claimedOpps}
              claimedOpportunitiesLoading={claimedLoading}
            />
          </>
        )}
      </main>

      {/* Modals */}
      <BuyTicketModal
        event={selectedEvent}
        state={ticketModalState}
        onConfirm={handleConfirmPurchase}
        onClose={handleCloseTicketModal}
      />

      <ClaimModal
        opportunity={selectedOpp}
        state={claimModalState}
        claimedData={claimResult}
        onConfirm={handleConfirmClaim}
        onClose={handleCloseClaimModal}
      />

      <BottomTabBar />
    </div>
  );
}

function EventGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4 mb-10">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-72 rounded-xl border border-neutral-100 bg-white animate-pulse" />
      ))}
    </div>
  );
}

function OpportunityGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4 mb-10">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-56 rounded-xl border border-neutral-100 bg-white animate-pulse" />
      ))}
    </div>
  );
}

function SectionError({ message, onRetry }: { message: string; onRetry: () => void }) {
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

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-center mb-10">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-neutral-100">
        {icon}
      </div>
      <p className="text-sm font-semibold text-neutral-700">{title}</p>
      <p className="text-sm text-neutral-400">{description}</p>
    </div>
  );
}
