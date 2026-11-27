"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { Menu, X } from "lucide-react";
import { StatusGlyph } from "@/components/dashboard/status-glyph";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { cn } from "@/lib/utils";

interface NavBarProps {
  className?: string;
  /**
   * Stay pinned to the top while scrolling (default). The overview turns this
   * off because its section bar is the sticky element there.
   */
  sticky?: boolean;
}

const LINKS = [
  { href: "/", label: "Overview" },
  { href: "/discover", label: "Discover" },
];

/**
 * Site nav, in the page flow (68px, 60px on mobile) with a hairline below.
 * Brand = the three state shapes plus the name, then Overview / Discover, a UTC
 * clock and the theme toggle. Below 768px the links collapse behind a menu
 * button and the clock drops out.
 */
export function NavBar({ className, sticky = true }: NavBarProps) {
  const pathname = usePathname();
  // The menu records the path it was opened on, so navigating closes it
  // without an effect.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenOn(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header
      className={cn("command-bar z-50", sticky ? "sticky top-0" : "relative", className)}
      style={{ paddingTop: "var(--safe-top)" }}
    >
      <div className="mx-auto flex min-h-[60px] max-w-(--page-max) flex-wrap items-center gap-x-3 gap-y-0 px-4 py-3 md:min-h-[68px] md:gap-x-6 md:px-6 md:py-4">
        <Link
          href="/"
          aria-label="NIM Stats home"
          className="flex shrink-0 items-center gap-2 rounded-xs text-lg leading-none font-medium text-text-primary"
        >
          <span className="flex items-center gap-1" aria-hidden="true">
            <StatusGlyph state="healthy" size={10} />
            <StatusGlyph state="busy" size={10} />
            <StatusGlyph state="jammed" size={10} />
          </span>
          NIM Stats
        </Link>

        <nav
          id="primary-nav"
          aria-label="Primary navigation"
          className={cn(
            "order-last basis-full flex-col border-t border-border-subtle pt-2 md:order-none md:flex md:basis-auto md:flex-row md:gap-1 md:border-0 md:pt-0",
            open ? "mt-3 flex md:mt-0" : "hidden",
          )}
        >
          {LINKS.map((l) => {
            // Exact match: the shell is shared by /about, /contact, /privacy and
            // the 404 too, and none of those is a section of the overview.
            const active = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-xs px-1 py-3 text-base leading-none font-medium transition-colors duration-150 hover:text-text-primary md:px-3 md:py-2 md:text-sm",
                  active ? "text-text-primary" : "text-text-muted",
                )}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2 md:gap-4">
          <UtcClock className="hidden md:grid" />
          <ThemeToggle />
          <button
            type="button"
            className="btn btn-outline btn-icon md:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="primary-nav"
            onClick={() => setOpenOn(open ? null : pathname)}
          >
            {open ? <X strokeWidth={1.8} aria-hidden="true" /> : <Menu strokeWidth={1.8} aria-hidden="true" />}
          </button>
        </div>
      </div>
    </header>
  );
}

// One tick per minute boundary: the clock shows HH:MM, so a 1s timer would
// re-render sixty times for one visible change.
function subscribeMinute(notify: () => void) {
  let id: ReturnType<typeof setTimeout>;
  const schedule = () => {
    id = setTimeout(() => {
      notify();
      schedule();
    }, 60_000 - (Date.now() % 60_000) + 50);
  };
  schedule();
  return () => clearTimeout(id);
}
const currentMinute = () => Math.floor(Date.now() / 60_000);
const serverMinute = () => null;

/** UTC clock, HH:MM. Hydration-safe: the server and first client render show a placeholder. */
function UtcClock({ className }: { className?: string }) {
  const minute = useSyncExternalStore(subscribeMinute, currentMinute, serverMinute);
  const time =
    minute == null
      ? "--:--"
      : new Date(minute * 60_000).toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
          timeZone: "UTC",
          hour12: false,
        });
  return (
    // Tabular digits make every HH:MM the same width; the sizer is that width, so the
    // "--:--" placeholder becoming the real time at hydration moves nothing (R10).
    <span className={cn("body-sm text-text-muted", className)} title="Coordinated Universal Time">
      <span className="invisible col-start-1 row-start-1" aria-hidden="true">00:00 UTC</span>
      <span className={cn("col-start-1 row-start-1 text-right", minute == null && "invisible")} suppressHydrationWarning>
        {time} UTC
      </span>
    </span>
  );
}
