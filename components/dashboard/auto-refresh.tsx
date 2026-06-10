"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Re-fetches the server-rendered page on an interval so the live status surface
 * stays current without a manual reload. Pauses while the tab is hidden.
 * router.refresh() re-runs the server component and reconciles in place — no
 * full navigation, no lost scroll position.
 */
export function AutoRefresh({ intervalMs = 30_000 }: { intervalMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    const tick = () => {
      if (document.visibilityState === "visible") router.refresh();
    };
    const id = setInterval(tick, intervalMs);
    return () => clearInterval(id);
  }, [router, intervalMs]);

  return null;
}
