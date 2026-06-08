"use client";

import { cn } from "@/lib/utils";

interface NavBarProps {
  lastUpdate: Date;
  className?: string;
}

export function NavBar({ lastUpdate, className }: NavBarProps) {
  const timeAgo = formatTimeAgo(lastUpdate);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 h-12",
        "bg-zinc-950/90 backdrop-blur-md",
        "border-b border-zinc-800/60",
        className
      )}
    >
      <div className="h-full flex items-center justify-between px-4 lg:px-6">
        {/* Left: Logo + Live status */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" style={{ boxShadow: "0 0 8px #10b981" }} />
            <span className="text-[10px] font-semibold text-emerald-400/80 uppercase tracking-widest">
              LIVE
            </span>
          </div>
          <span className="text-sm font-semibold text-zinc-400 tracking-wide">
            NIM Stats
          </span>
          <span className="text-xs text-zinc-600 font-mono tabular-nums">
            {timeAgo}
          </span>
        </div>

        {/* Right: View switcher */}
        <nav className="flex items-center gap-1">
          <NavItem label="Command" active />
          <NavItem label="Discover" />
        </nav>
      </div>
    </header>
  );
}

function NavItem({ label, active }: { label: string; active?: boolean }) {
  return (
    <button
      className={cn(
        "px-3 py-1.5 text-xs font-medium transition-colors rounded-md",
        active
          ? "text-emerald-400 bg-emerald-500/10"
          : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
      )}
    >
      {label}
    </button>
  );
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  return `${Math.floor(seconds / 60)}m ago`;
}
