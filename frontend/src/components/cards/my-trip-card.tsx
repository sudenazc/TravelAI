import Link from "next/link";
import { Building2, Clock, Wallet, MapPin } from "lucide-react";
import { Badge } from "@/components/ui";
import { cn } from "@/lib/utils";

type TripStatus = "upcoming" | "ongoing" | "completed" | "draft";

interface MyTripCardProps {
  id: string;
  title: string;
  destination?: string;
  accommodation?: string;
  durationDays?: number;
  budget?: number;
  currency?: string;
  status?: TripStatus;
  className?: string;
}

const STATUS_MAP: Record<TripStatus, { label: string; variant: "primary" | "success" | "warning" | "neutral" }> = {
  upcoming: { label: "Upcoming", variant: "primary" },
  ongoing:  { label: "Ongoing",  variant: "success" },
  completed:{ label: "Completed",variant: "neutral" },
  draft:    { label: "Draft",    variant: "warning" },
};

export function MyTripCard({
  id,
  title,
  destination,
  accommodation,
  durationDays,
  budget,
  currency = "TL",
  status = "upcoming",
  className,
}: MyTripCardProps) {
  const { label, variant } = STATUS_MAP[status];

  const formattedBudget =
    budget !== undefined
      ? `${new Intl.NumberFormat("tr-TR").format(budget)} ${currency}`
      : null;

  return (
    <Link
      href={`/planner/${id}`}
      className={cn(
        "group flex flex-col gap-4 rounded-xl border border-neutral-100 bg-white p-5",
        "shadow-sm transition-all duration-200",
        "hover:-translate-y-1 hover:bg-sky-50 hover:shadow-md",
        className
      )}
    >
      {/* header */}
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-display text-xl font-bold text-neutral-900 leading-snug">
          {title}
        </h3>
        <Badge variant={variant} className="shrink-0">
          {label}
        </Badge>
      </div>

      {/* details */}
      <ul className="flex flex-col gap-2">
        {destination && (
          <li className="flex items-center gap-2 text-sm text-neutral-600">
            <MapPin className="size-4 shrink-0 text-neutral-400" strokeWidth={1.75} />
            {destination}
          </li>
        )}
        {accommodation && (
          <li className="flex items-center gap-2 text-sm text-neutral-600">
            <Building2 className="size-4 shrink-0 text-neutral-400" strokeWidth={1.75} />
            {accommodation}
          </li>
        )}
        {durationDays !== undefined && (
          <li className="flex items-center gap-2 text-sm text-neutral-600">
            <Clock className="size-4 shrink-0 text-neutral-400" strokeWidth={1.75} />
            {durationDays} {durationDays === 1 ? "day" : "days"}
          </li>
        )}
        {formattedBudget && (
          <li className="flex items-center gap-2 text-sm font-semibold text-sky-600">
            <Wallet className="size-4 shrink-0 text-sky-400" strokeWidth={1.75} />
            {formattedBudget} Budget
          </li>
        )}
      </ul>
    </Link>
  );
}
