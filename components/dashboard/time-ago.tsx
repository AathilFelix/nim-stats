"use client";

import { useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";

// false during SSR and the client's FIRST render, true only after hydration —
// driven by useSyncExternalStore (no setState-in-effect, so it doesn't add to
// the lint baseline the way `useEffect(() => setX(true))` would).
const subscribe = () => () => {};
function useHydrated(): boolean {
  return useSyncExternalStore(subscribe, () => true, () => false);
}

// Same wording as the section bar ("38 s ago", "2 min ago", "3 h ago", "2 d ago"),
// so a stale probe reads as hours or days, never as "9000m ago".
function formatAgo(date: Date): string {
  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds} s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} h ago`;
  return `${Math.floor(seconds / 86400)} d ago`;
}

/**
 * Relative timestamp ("3 min ago") that cannot cause a hydration mismatch.
 *
 * `formatAgo` reads `Date.now()`, so the value the server renders is already
 * stale by the time the client hydrates — and worse, with cached page data the
 * gap can be many minutes. Rendering it directly produces a server/client text
 * mismatch. Instead we emit a stable placeholder on the server and the client's
 * first render (they match → no mismatch), then swap in the live value once
 * hydrated, when `Date.now()` is the browser's own clock.
 */
export function TimeAgo({
  date,
  className,
  placeholder = "—",
  hidePlaceholder = false,
}: {
  date: Date | string;
  className?: string;
  placeholder?: string;
  /** Do not paint the placeholder (a reserved box it would reflow in when the real value lands). */
  hidePlaceholder?: boolean;
}) {
  const hydrated = useHydrated();
  return (
    <span className={cn(className, hidePlaceholder && !hydrated && "invisible")} suppressHydrationWarning>
      {hydrated ? formatAgo(new Date(date)) : placeholder}
    </span>
  );
}
