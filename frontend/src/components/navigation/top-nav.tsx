import Link from "next/link";
import { Plane } from "lucide-react";
import { Button } from "@/components/ui";

const NAV_LINKS = [
  { label: "Planner", href: "/planner" },
  { label: "Tickets", href: "/tickets" },
  { label: "My Trips", href: "/my-trips" },
] as const;

interface TopNavProps {
  activePath?: string;
}

export function TopNav({ activePath }: TopNavProps) {
  return (
    <header className="sticky top-0 z-50 h-14 lg:h-[72px] w-full border-b border-neutral-100 bg-white/90 shadow-xs backdrop-blur">
      <div className="mx-auto flex h-full max-w-[1440px] items-center justify-between px-4 lg:px-10">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 text-sky-600 transition-opacity hover:opacity-80"
        >
          <Plane className="size-7" strokeWidth={1.75} />
          <span className="font-display text-xl font-bold text-neutral-900">
            Travel<span className="text-sky-500">AI</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-7">
          {NAV_LINKS.map(({ label, href }) => {
            const isActive = activePath === href;
            return (
              <Link
                key={href}
                href={href}
                className={
                  isActive
                    ? "relative text-sm font-medium text-sky-600 after:absolute after:-bottom-0.5 after:left-0 after:h-0.5 after:w-full after:bg-sky-500"
                    : "text-sm font-medium text-neutral-600 transition-colors hover:text-sky-600"
                }
              >
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Desktop CTA */}
        <div className="hidden lg:flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" size="md">
              Log in
            </Button>
          </Link>
        </div>

        {/* Mobile hamburger placeholder */}
        <button
          className="lg:hidden flex h-10 w-10 items-center justify-center rounded-md text-neutral-700 transition-colors hover:bg-neutral-100"
          aria-label="Open menu"
        >
          <span className="flex flex-col gap-1.5">
            <span className="h-0.5 w-5 rounded-full bg-current" />
            <span className="h-0.5 w-5 rounded-full bg-current" />
            <span className="h-0.5 w-4 rounded-full bg-current" />
          </span>
        </button>
      </div>
    </header>
  );
}
