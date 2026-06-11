"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { cn } from "@/lib/utils";

interface NavBarProps {
  className?: string;
}

/**
 * Operations-center command bar. Fixed top shell shared by every page:
 * radar brand mark, live fleet status, primary nav, a ticking UTC clock,
 * and the theme toggle. Height is 3.5rem — pages offset by the same.
 */
export function NavBar({ className }: NavBarProps) {
  const pathname = usePathname();
  const isDiscover = pathname === "/discover";

  return (
    <header
      className={cn(
        "command-bar fixed inset-x-0 top-0 z-50 h-14",
        className,
      )}
      style={{ paddingTop: "var(--safe-top)" }}
      role="banner"
    >
      <div className="mx-auto flex h-full max-w-[1600px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* Brand + live status */}
        <div className="flex items-center gap-3">
          <Link href="/" className="group flex items-center gap-2.5" aria-label="NIM Stats home">
            <RadarMark />
            <span className="flex items-baseline gap-1.5">
              <span className="text-[0.95rem] font-semibold tracking-tight text-text-primary">
                NIM
              </span>
              <span className="text-[0.95rem] font-semibold tracking-tight text-text-tertiary group-hover:text-text-secondary transition-colors">
                STATS
              </span>
            </span>
          </Link>

          <span className="hidden h-4 w-px bg-border-base sm:block" aria-hidden="true" />

          <span className="hidden items-center gap-1.5 sm:inline-flex" aria-label="System status: operational">
            <span className="status-led status-led--healthy" style={{ width: 7, height: 7 }} aria-hidden="true" />
            <span className="label-xs text-status-healthy">OPERATIONAL</span>
          </span>
        </div>

        {/* Primary nav + instruments */}
        <div className="flex items-center gap-2 sm:gap-3">
          <nav className="flex items-center gap-1" aria-label="Primary navigation">
            <NavLink href="/" label="COMMAND" active={!isDiscover} />
            <NavLink href="/discover" label="DISCOVER" active={isDiscover} />
          </nav>

          <span className="hidden h-4 w-px bg-border-base md:block" aria-hidden="true" />
          <UTCClock className="hidden md:block" />
          <span className="h-4 w-px bg-border-base" aria-hidden="true" />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

function NavLink({ href, label, active }: { href: string; label: string; active?: boolean }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "nav-item relative rounded-md px-3 py-1.5 transition-colors duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface-base",
        active ? "text-text-primary" : "text-text-tertiary hover:text-text-secondary",
      )}
    >
      {label}
      {active && (
        <span
          className="absolute -bottom-[1px] left-3 right-3 h-[2px] rounded-full bg-text-accent"
          aria-hidden="true"
        />
      )}
    </Link>
  );
}

/** Radar/telemetry brand mark — center node with two outgoing signal arcs. */
function RadarMark() {
  return (
    <span className="relative inline-flex h-6 w-6 items-center justify-center">
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="11" stroke="var(--border-strong)" strokeWidth="1" />
        <circle cx="12" cy="12" r="6.5" stroke="var(--border-base)" strokeWidth="1" />
        <path d="M12 12 L12 2.2" stroke="var(--text-accent)" strokeWidth="1.4" strokeLinecap="round" />
        <path
          d="M12 12 L19 8"
          stroke="var(--status-healthy)"
          strokeWidth="1.4"
          strokeLinecap="round"
          opacity="0.85"
        />
        <circle cx="12" cy="12" r="2.4" fill="var(--text-accent)" />
      </svg>
      <span
        className="absolute inset-0 rounded-full"
        style={{ boxShadow: "0 0 14px color-mix(in srgb, var(--primary) 35%, transparent)" }}
        aria-hidden="true"
      />
    </span>
  );
}

/** Live UTC clock — the mission-control heartbeat. Hydration-safe. */
function UTCClock({ className }: { className?: string }) {
  // Server and the client's first render both show the placeholder (they match,
  // so no hydration mismatch). The interval then begins ticking after mount —
  // no setState in the effect body, just the interval callback.
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const time = now
    ? now.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        timeZone: "UTC",
        hour12: false,
      })
    : "--:--:--";

  return (
    <span
      className={cn("flex items-center gap-1.5 tabular-nums", className)}
      suppressHydrationWarning
      title="Coordinated Universal Time"
    >
      <span className="metric-xs text-text-secondary">{time}</span>
      <span className="label-xs text-text-quaternary">UTC</span>
    </span>
  );
}
