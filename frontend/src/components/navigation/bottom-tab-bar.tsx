"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Compass,
  CalendarDays,
  Map,
  MessageCircle,
  UserCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { label: "Discover", href: "/discover", Icon: Compass },
  { label: "Planner", href: "/planner", Icon: CalendarDays },
  { label: "Map", href: "/map", Icon: Map },
  { label: "Chat", href: "/chat", Icon: MessageCircle },
  { label: "Account", href: "/account", Icon: UserCircle },
] as const;

export function BottomTabBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden border-t border-neutral-100 bg-white pb-safe shadow-[0_-4px_12px_rgba(0,0,0,0.06)]">
      <div className="flex h-16 items-center">
        {TABS.map(({ label, href, Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");
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
