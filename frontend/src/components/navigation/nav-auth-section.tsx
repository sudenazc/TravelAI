"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { LogOut, ChevronDown, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";

export function NavAuthSection() {
  const { user, isLoading, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (isLoading) {
    return <div className="h-9 w-24 animate-pulse rounded-lg bg-neutral-100" />;
  }

  if (!user) {
    return (
      <div className="flex items-center gap-3">
        <Link href="/login">
          <Button variant="ghost" size="md">
            Log in
          </Button>
        </Link>
        <Link href="/register">
          <Button variant="primary" size="md">
            Sign up
          </Button>
        </Link>
      </div>
    );
  }

  const initial = (user.email[0] ?? "U").toUpperCase();

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-700 shadow-xs transition-all hover:border-sky-200 hover:bg-sky-50 focus-visible:outline-2 focus-visible:outline-sky-500"
        aria-expanded={open}
        aria-haspopup="true"
      >
        {/* Avatar */}
        <span className="flex size-7 items-center justify-center rounded-full bg-sky-500 text-xs font-bold text-white">
          {initial}
        </span>
        {/* Email truncated */}
        <span className="hidden max-w-[140px] truncate sm:block">
          {user.email}
        </span>
        <ChevronDown
          className={`size-3.5 shrink-0 text-neutral-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-neutral-200 bg-white py-1 shadow-lg">
          {/* User info header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-neutral-100">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-sky-500 text-sm font-bold text-white">
              {initial}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-neutral-800">
                {user.email}
              </p>
              <p className="text-xs text-neutral-400">Student account</p>
            </div>
          </div>

          {/* Menu items */}
          <div className="p-1">
            <Link
              href="/profile"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-neutral-700 transition-colors hover:bg-neutral-50 hover:text-sky-600"
            >
              <User className="size-4" />
              My profile
            </Link>
            <button
              onClick={() => { setOpen(false); logout(); }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-500 transition-colors hover:bg-red-50"
            >
              <LogOut className="size-4" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
