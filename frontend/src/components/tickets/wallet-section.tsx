"use client";

import { Wallet, QrCode, CalendarDays, MapPin, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui";
import { cn } from "@/lib/utils";

interface OwnedTicket {
  id: string;
  eventTitle: string;
  date: string;
  location: string;
  status: "upcoming" | "used" | "expired";
}

interface WalletSectionProps {
  balance: number;
  currency?: string;
  tickets?: OwnedTicket[];
  className?: string;
}

const statusVariants: Record<
  OwnedTicket["status"],
  "success" | "neutral" | "error"
> = {
  upcoming: "success",
  used: "neutral",
  expired: "error",
};

const statusLabels: Record<OwnedTicket["status"], string> = {
  upcoming: "Upcoming",
  used: "Used",
  expired: "Expired",
};

export function WalletSection({
  balance,
  currency = "USD",
  tickets = [],
  className,
}: WalletSectionProps) {
  const formattedBalance = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(balance);

  return (
    <section
      aria-labelledby="wallet-heading"
      className={cn(
        "rounded-2xl border border-neutral-200 bg-white overflow-hidden shadow-sm",
        className
      )}
    >
      <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-100 bg-gradient-to-r from-sky-50 to-white">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-sky-100">
            <Wallet className="size-5 text-sky-600" strokeWidth={1.75} />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-neutral-400">
              My Wallet
            </p>
            <p
              id="wallet-heading"
              className="font-display text-2xl font-bold text-neutral-900"
            >
              {formattedBalance}
            </p>
          </div>
        </div>
        <button
          className={cn(
            "rounded-md px-4 h-9 text-sm font-semibold text-sky-600",
            "border border-neutral-200 bg-white hover:border-sky-300 hover:bg-sky-50",
            "transition-all duration-200 focus-visible:outline-2 focus-visible:outline-sky-500"
          )}
        >
          Top Up
        </button>
      </div>

      {tickets.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-neutral-100">
            <QrCode className="size-7 text-neutral-400" strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-sm font-semibold text-neutral-700">
              No tickets yet
            </p>
            <p className="text-sm text-neutral-400">
              Your purchased tickets will appear here.
            </p>
          </div>
        </div>
      ) : (
        <ul className="divide-y divide-neutral-100">
          {tickets.map((ticket) => (
            <li key={ticket.id}>
              <button className="group flex w-full items-center gap-4 px-6 py-4 text-left transition-colors hover:bg-sky-50">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-neutral-100 group-hover:bg-sky-100 transition-colors">
                  <QrCode
                    className="size-5 text-neutral-400 group-hover:text-sky-600 transition-colors"
                    strokeWidth={1.5}
                  />
                </div>
                <div className="flex flex-1 flex-col gap-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-display text-sm font-semibold text-neutral-900 line-clamp-1">
                      {ticket.eventTitle}
                    </span>
                    <Badge variant={statusVariants[ticket.status]}>
                      {statusLabels[ticket.status]}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-neutral-500">
                    <span className="flex items-center gap-1">
                      <CalendarDays className="size-3" strokeWidth={1.75} />
                      {ticket.date}
                    </span>
                    <span className="flex items-center gap-1 truncate">
                      <MapPin className="size-3 shrink-0" strokeWidth={1.75} />
                      <span className="line-clamp-1">{ticket.location}</span>
                    </span>
                  </div>
                </div>
                <ChevronRight
                  className="size-4 shrink-0 text-neutral-300 group-hover:text-sky-400 transition-colors"
                  strokeWidth={2}
                />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
