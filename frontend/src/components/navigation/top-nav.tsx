"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plane, X, Menu } from "lucide-react";
import { NavAuthSection } from "./nav-auth-section";

const NAV_LINKS = [
  { label: "Planner", href: "/planner" },
  { label: "Experiences", href: "/experiences" },
  { label: "Tickets", href: "/tickets" },
  { label: "My Trips", href: "/my-trips" },
] as const;

export function TopNav() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
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
              const isActive = pathname === href || pathname.startsWith(href + "/");
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
            <NavAuthSection />
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="lg:hidden flex h-10 w-10 items-center justify-center rounded-md text-neutral-700 transition-colors hover:bg-neutral-100"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/30 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />

          {/* Drawer */}
          <div className="fixed top-14 left-0 right-0 z-50 border-b border-neutral-100 bg-white px-4 py-6 shadow-lg lg:hidden">
            <nav className="flex flex-col gap-1">
              {NAV_LINKS.map(({ label, href }) => {
                const isActive = pathname === href || pathname.startsWith(href + "/");
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileOpen(false)}
                    className={
                      isActive
                        ? "rounded-lg px-3 py-2.5 text-sm font-semibold text-sky-600 bg-sky-50"
                        : "rounded-lg px-3 py-2.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 hover:text-sky-600"
                    }
                  >
                    {label}
                  </Link>
                );
              })}
            </nav>

            <div className="mt-4 border-t border-neutral-100 pt-4">
              <NavAuthSection />
            </div>
          </div>
        </>
      )}
    </>
  );
}
