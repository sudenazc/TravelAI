import Image from "next/image";
import { CalendarDays, MapPin, Clock } from "lucide-react";
import { Badge } from "@/components/ui";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";

export type EventCategory =
  | "museum"
  | "networking"
  | "workshop"
  | "local";

interface EventCardProps {
  id: string;
  title: string;
  category: EventCategory;
  imageUrl: string;
  date: string;
  time: string;
  location: string;
  price: number;
  currency?: string;
  spotsLeft?: number;
  className?: string;
  onBuy?: (id: string) => void;
}

const categoryLabels: Record<EventCategory, string> = {
  museum: "Museum",
  networking: "Networking",
  workshop: "Workshop",
  local: "Local Experience",
};

const categoryBadgeVariants: Record<
  EventCategory,
  "primary" | "success" | "warning" | "neutral"
> = {
  museum: "primary",
  networking: "success",
  workshop: "warning",
  local: "neutral",
};

export function EventCard({
  id,
  title,
  category,
  imageUrl,
  date,
  time,
  location,
  price,
  currency = "USD",
  spotsLeft,
  className,
  onBuy,
}: EventCardProps) {
  const formattedPrice = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(price);

  const isAlmostFull = spotsLeft !== undefined && spotsLeft <= 5;

  return (
    <article
      className={cn(
        "group flex flex-col overflow-hidden rounded-xl border border-neutral-100",
        "bg-white shadow-sm transition-all duration-200",
        "hover:-translate-y-1 hover:shadow-md",
        className
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image
          src={imageUrl}
          alt={title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[rgba(23,37,84,0.5)] to-transparent" />
        <div className="absolute top-3 left-3">
          <Badge variant={categoryBadgeVariants[category]}>
            {categoryLabels[category]}
          </Badge>
        </div>
        {isAlmostFull && (
          <div className="absolute top-3 right-3">
            <Badge variant="error">{spotsLeft} spots left</Badge>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <h3 className="font-display text-base font-semibold text-neutral-900 line-clamp-2 leading-snug">
          {title}
        </h3>

        <div className="flex flex-col gap-1.5 text-sm text-neutral-500">
          <div className="flex items-center gap-1.5">
            <CalendarDays className="size-3.5 shrink-0" strokeWidth={1.75} />
            <span>{date}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="size-3.5 shrink-0" strokeWidth={1.75} />
            <span>{time}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin className="size-3.5 shrink-0" strokeWidth={1.75} />
            <span className="line-clamp-1">{location}</span>
          </div>
        </div>

        <div className="mt-auto flex items-center justify-between pt-2 border-t border-neutral-100">
          <div className="flex flex-col">
            <span className="text-xs text-neutral-400">From</span>
            <span className="font-display text-lg font-bold text-sky-600">
              {formattedPrice}
            </span>
          </div>
          <Button
            size="sm"
            variant="primary"
            onClick={() => onBuy?.(id)}
            aria-label={`Buy ticket for ${title}`}
          >
            Buy Ticket
          </Button>
        </div>
      </div>
    </article>
  );
}
