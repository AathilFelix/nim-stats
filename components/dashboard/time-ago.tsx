"use client";

import { useSyncExternalStore } from "react";
import { formatTimeAgo } from "./mock-data";

// false during SSR and the client's FIRST render, true only after hydration —
// driven by useSyncExternalStore (no setState-in-effect, so it doesn't add to
// the lint baseline the way `useEffect(() => setX(true))` would).
const subscribe = () => () => {};
function useHydrated(): boolean {
  return useSyncExternalStore(subscribe, () => true, () => false);
}

/**
 * Relative timestamp ("3m ago") that cannot cause a hydration mismatch.
 *
 * `formatTimeAgo` reads `Date.now()`, so the value the server renders is already
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
}: {
  date: Date | string;
  className?: string;
  placeholder?: string;
}) {
  const hydrated = useHydrated();
  return (
    <span className={className} suppressHydrationWarning>
      {hydrated ? formatTimeAgo(new Date(date)) : placeholder}
    </span>
  );
}
