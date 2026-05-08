import Image from "next/image";
import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { Badge } from "@/components/ui";
import { cn } from "@/lib/utils";

interface TripCardProps {
  id: string;
  title: string;
  thumbnailUrl: string;
  startDate: string;
  endDate: string;
  priceFrom: number;
  currency?: string;
  tag?: string;
  className?: string;
}

export function TripCard({
  id,
  title,
  thumbnailUrl,
  startDate,
  endDate,
  priceFrom,
  currency = "USD",
  tag,
  className,
}: TripCardProps) {
  const formattedPrice = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(priceFrom);

  return (
    <Link
      href={`/planner/${id}`}
      className={cn(
        "group flex flex-col overflow-hidden rounded-xl border border-neutral-100",
        "bg-white shadow-sm transition-all duration-normal",
        "hover:-translate-y-1 hover:bg-sky-50 hover:shadow-md",
        className
      )}
    >
      {/* thumbnail */}
      <div className="relative aspect-video overflow-hidden rounded-lg m-3 mb-0">
        <Image
          src={thumbnailUrl}
          alt={title}
          fill
          className="object-cover transition-transform duration-slower group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, 400px"
        />
      </div>

      {/* content */}
      <div className="flex flex-col gap-2 p-5">
        <h3 className="font-display text-xl font-bold text-neutral-900 line-clamp-2">
          {title}
        </h3>

        <div className="flex items-center gap-1.5 text-sm text-neutral-500">
          <CalendarDays className="size-4 shrink-0" strokeWidth={1.75} />
          <span>
            {startDate} – {endDate}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <p className="font-display text-lg font-bold text-sky-600">
            {formattedPrice}
          </p>
          {tag && <Badge variant="primary">{tag}</Badge>}
        </div>
      </div>
    </Link>
  );
}
