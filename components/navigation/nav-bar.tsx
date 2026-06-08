"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { cn } from "@/lib/utils";

interface NavBarProps {
  className?: string;
}

export function NavBar({ className }: NavBarProps) {
  const pathname = usePathname();
  const isDiscover = pathname === "/discover";

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 h-11",
        "bg-surface-base/90 backdrop-blur-md",
        "border-b border-border-base",
        className
      )}
      role="banner"
    >
      <div className="h-full flex items-center justify-between px-5 lg:px-7">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span
              className="relative flex h-1.5 w-1.5 shrink-0"
              aria-hidden="true"
            >
              <span className="absolute inset-0 rounded-full bg-emerald-400" />
              <span
                className="absolute inset-0 rounded-full bg-emerald-400"
                style={{ animation: "pulse-soft 2s ease-in-out infinite" }}
              />
            </span>
            <span
              className="font-medium uppercase tracking-wider text-emerald-500"
              style={{
                fontFamily: '"IBM Plex Mono", ui-monospace, monospace',
                fontSize: '0.7rem',
                fontWeight: 500,
                letterSpacing: '0.08em',
              }}
            >
              Live
            </span>
          </div>
          <span
            className="h-3 w-px bg-border-subtle"
            aria-hidden="true"
          />
          <span
            className="font-semibold tracking-tight text-text-primary"
            style={{
              fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
              fontSize: '0.875rem',
              fontWeight: 600,
            }}
          >
            NIM Stats
          </span>
        </div>

        <nav className="flex items-center gap-2" aria-label="Primary navigation">
          <NavLink href="/" label="Command" active={!isDiscover} />
          <span className="h-3 w-px bg-border-base" aria-hidden="true" />
          <NavLink href="/discover" label="Discover" active={isDiscover} />
          <span className="h-3 w-px bg-border-base" aria-hidden="true" />
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}

function NavLink({ href, label, active }: { href: string; label: string; active?: boolean }) {
  return (
    <Link
      href={href}
      className={cn(
        "relative px-2.5 py-1.5 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-surface-base rounded-sm",
        active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
      )}
      style={{
        fontFamily: '"IBM Plex Mono", ui-monospace, monospace',
        fontSize: '0.65rem',
        fontWeight: 500,
        letterSpacing: '0.08em',
      }}
    >
      {label}
      {active && (
        <span
          className="absolute -bottom-2px left-2 right-2 h-[2px] rounded-full bg-emerald-500/70"
          aria-hidden="true"
        />
      )}
    </Link>
  );
}
