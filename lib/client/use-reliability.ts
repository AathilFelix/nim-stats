"use client";

// Shared client fetch for /api/fleet/reliability. Multiple panels (uptime
// calendar, latency heatmap, SLA tracker, detail drawer) all need the same
// payload, so we fetch it once at the module level and fan it out to every
// consumer. reload() forces a refetch.
//
// The store also refreshes itself on CLIENT_REFRESH_MS while the tab is
// visible. That is not a nicety: these are client components, so the
// `router.refresh()` in <AutoRefresh> re-runs the server tree but cannot touch
// this module-scope cache. Without a timer here the panels froze at whatever
// the fleet looked like on first mount and stayed there for the life of the
// tab — which is how the SLA/heatmap panels kept rendering 34 endpoints for
// hours after registry parole grew the fleet to 78.
//
// One shared timer for all subscribers, paused while hidden, at the same
// cadence as the rest of the surface, so an open tab costs one CDN request per
// FLEET_TTL — almost always an edge HIT.
import { useEffect, useReducer } from "react";
import { CLIENT_REFRESH_MS } from "@/lib/config/cadence";
import type { ReliabilityResponse } from "@/lib/reliability-types";

let cache: ReliabilityResponse | null = null;
let fetchedAt = 0;
let inflight: Promise<ReliabilityResponse> | null = null;
let error: string | null = null;
const subs = new Set<() => void>();

function notify() {
  for (const s of subs) s();
}

function isStale(): boolean {
  return Date.now() - fetchedAt >= CLIENT_REFRESH_MS;
}

function load(force = false): Promise<ReliabilityResponse> {
  if (cache && !force && !isStale()) return Promise.resolve(cache);
  if (inflight) return inflight;
  // No `no-store`: the route sets Cache-Control so repeats hit the CDN edge.
  inflight = fetch("/api/fleet/reliability")
    .then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json() as Promise<ReliabilityResponse>;
    })
    .then((json) => {
      cache = json;
      fetchedAt = Date.now();
      error = null;
      inflight = null;
      notify();
      return json;
    })
    .catch((e) => {
      error = (e as Error).message;
      inflight = null;
      notify();
      throw e;
    });
  return inflight;
}

// Ref-counted shared ticker: started by the first mounted panel, stopped by the
// last unmount, so pages without these panels pay nothing.
let timer: ReturnType<typeof setInterval> | null = null;

function tick() {
  if (document.visibilityState === "visible") load().catch(() => {});
}

function startTicker() {
  if (timer) return;
  timer = setInterval(tick, CLIENT_REFRESH_MS);
  // A tab hidden past the interval misses ticks; catch up when it comes back
  // rather than waiting out another full cycle on stale numbers.
  document.addEventListener("visibilitychange", tick);
}

function stopTicker() {
  if (!timer) return;
  clearInterval(timer);
  timer = null;
  document.removeEventListener("visibilitychange", tick);
}

export function useReliability() {
  const [, force] = useReducer((x: number) => x + 1, 0);

  useEffect(() => {
    subs.add(force);
    startTicker();
    load().catch(() => {});
    return () => {
      subs.delete(force);
      if (subs.size === 0) stopTicker();
    };
  }, []);

  return {
    data: cache,
    loading: !cache && error == null,
    error,
    reload: () => load(true).catch(() => {}),
  };
}

export function findModelReliability(
  data: ReliabilityResponse | null,
  modelId: string,
) {
  return data?.models.find((m) => m.id === modelId) ?? null;
}
