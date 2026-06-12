"use client";

// Shared client fetch for /api/fleet/reliability. Multiple panels (uptime
// calendar, latency heatmap, SLA tracker, detail drawer) all need the same
// payload, so we fetch it once at the module level and fan it out to every
// consumer. reload() forces a refetch (e.g. on auto-refresh).
import { useEffect, useReducer } from "react";
import type { ReliabilityResponse } from "@/lib/reliability-types";

let cache: ReliabilityResponse | null = null;
let inflight: Promise<ReliabilityResponse> | null = null;
let error: string | null = null;
const subs = new Set<() => void>();

function notify() {
  for (const s of subs) s();
}

function load(force = false): Promise<ReliabilityResponse> {
  if (cache && !force) return Promise.resolve(cache);
  if (inflight) return inflight;
  inflight = fetch("/api/fleet/reliability", { cache: "no-store" })
    .then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json() as Promise<ReliabilityResponse>;
    })
    .then((json) => {
      cache = json;
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

export function useReliability() {
  const [, force] = useReducer((x: number) => x + 1, 0);

  useEffect(() => {
    subs.add(force);
    load().catch(() => {});
    return () => {
      subs.delete(force);
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
