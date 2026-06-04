"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  Ticket,
  Luggage,
  UserCircle,
  Compass,
  BookOpenText,
} from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { label: "Discover", href: "/", Icon: Compass, exact: true },
  { label: "Planner", href: "/planner", Icon: CalendarDays, exact: false },
  { label: "Stories", href: "/experiences", Icon: BookOpenText, exact: false },
  { label: "My Trips", href: "/my-trips", Icon: Luggage, exact: false },
  { label: "Account", href: "/profile", Icon: UserCircle, exact: false },
] as const;

export function BottomTabBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden border-t border-neutral-100 bg-white pb-safe shadow-[0_-4px_12px_rgba(0,0,0,0.06)]">
      <div className="flex h-16 items-center">
        {TABS.map(({ label, href, Icon, exact }) => {
          const isActive = exact
            ? pathname === href
            : pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-1 flex-col items-center justify-center gap-0.5 py-2 transition-colors"
              aria-label={label}
            >
              <Icon
                className={cn(
                  "size-5 transition-colors",
                  isActive ? "text-sky-600" : "text-neutral-400"
                )}
                strokeWidth={isActive ? 2 : 1.75}
                fill={isActive ? "currentColor" : "none"}
              />
              <span
                className={cn(
                  "text-[10px] font-semibold leading-none tracking-wide",
                  isActive ? "text-sky-600" : "text-neutral-400"
                )}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
