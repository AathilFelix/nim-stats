"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { CLIENT_REFRESH_MS } from "@/lib/config/cadence";

/**
 * Re-fetches the server-rendered page on an interval so the live status surface
 * stays current without a manual reload. Pauses while the tab is hidden.
 * router.refresh() re-runs the server component and reconciles in place — no
 * full navigation, no lost scroll position.
 *
 * The default matches the server cache TTL. Polling faster than that guarantees
 * a cache miss on every tick — one tab left open on the old 30s default was
 * enough to push Supabase egress past its free-tier cap.
 */
export function AutoRefresh({ intervalMs = CLIENT_REFRESH_MS }: { intervalMs?: number }) {
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
