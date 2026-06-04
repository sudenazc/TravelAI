import Link from "next/link";
import { Heart, MapPin, Tag } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ExperienceCardProps {
  id: string;
  title: string;
  city?: string | null;
  tags?: string[];
  cover_image_url?: string | null;
  likes_count: number;
  author_name?: string | null;
  created_at: string;
  className?: string;
}

export function ExperienceCard({
  id,
  title,
  city,
  tags = [],
  cover_image_url,
  likes_count,
  author_name,
  created_at,
  className,
}: ExperienceCardProps) {
  const formattedDate = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(created_at));

  return (
    <Link
      href={`/experiences/${id}`}
      className={cn(
        "group flex flex-col gap-0 rounded-xl border border-neutral-100 bg-white",
        "shadow-sm overflow-hidden transition-all duration-200",
        "hover:-translate-y-1 hover:shadow-md",
        className
      )}
    >
      {/* Cover image */}
      <div className="relative h-40 w-full bg-gradient-to-br from-sky-100 to-sky-200 overflow-hidden">
        {cover_image_url ? (
          <img
            src={cover_image_url}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="text-4xl select-none">✈️</span>
          </div>
        )}
        {city && (
          <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-neutral-700 shadow-xs backdrop-blur-sm">
            <MapPin className="size-3 text-sky-500" strokeWidth={2} />
            {city}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col gap-3 p-4">
        <h3 className="font-display text-base font-bold text-neutral-900 leading-snug line-clamp-2 group-hover:text-sky-700 transition-colors">
          {title}
        </h3>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 rounded-full bg-sky-50 border border-sky-200 px-2 py-0.5 text-[10px] font-semibold text-sky-700"
              >
                <Tag className="size-2.5" strokeWidth={2} />
                {tag}
              </span>
            ))}
            {tags.length > 3 && (
              <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-medium text-neutral-400">
                +{tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            {author_name && (
              <p className="text-xs font-medium text-neutral-500 truncate">{author_name}</p>
            )}
            <p className="text-[11px] text-neutral-400">{formattedDate}</p>
          </div>
          <div className="flex items-center gap-1 shrink-0 text-neutral-400">
            <Heart className="size-3.5" strokeWidth={1.75} />
            <span className="text-xs font-medium">{likes_count}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
