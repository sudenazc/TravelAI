import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface DestinationCardProps {
  city: string;
  country: string;
  imageUrl: string;
  slug: string;
  className?: string;
}

export function DestinationCard({
  city,
  country,
  imageUrl,
  slug,
  className,
}: DestinationCardProps) {
  return (
    <Link
      href={`/destination/${slug}`}
      className={cn(
        "group relative flex w-full flex-col overflow-hidden rounded-xl",
        "h-48 lg:h-[200px] lg:w-[280px]",
        "transition-all duration-normal hover:-translate-y-1 hover:shadow-md",
        className
      )}
    >
      <Image
        src={imageUrl}
        alt={`${city}, ${country}`}
        fill
        className="object-cover transition-transform duration-slower group-hover:scale-105"
        sizes="(max-width: 768px) 100vw, 280px"
      />
      {/* gradient overlay */}
      <div
        className="absolute inset-0"
        style={{ background: "var(--gradient-card-overlay)" }}
      />
      {/* content */}
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <p className="font-display text-xl font-bold text-white">{city}</p>
        <p className="text-sm text-sky-200">{country}</p>
        <p className="mt-1 text-xs text-white/80">Plan it →</p>
      </div>
    </Link>
  );
}
