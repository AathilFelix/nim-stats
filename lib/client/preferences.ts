"use client";

// Client-side, localStorage-backed preferences shared across the dashboard:
// favorites/watchlist and the SLA target. Backed by useSyncExternalStore so
// every consumer re-renders on change and changes sync across tabs. SSR snapshot
// is the defaults, so server HTML is stable and React fills in real values after
// hydration (no mismatch).
import { useCallback } from "react";
import { useSyncExternalStore } from "react";

export interface Preferences {
  favorites: string[];
  /** SLA uptime target as a percentage, e.g. 99.9. */
  slaTarget: number;
}

const KEY = "nim-stats-prefs-v1";

const DEFAULTS: Preferences = {
  favorites: [],
  slaTarget: 99.9,
};

let cache: Preferences = DEFAULTS;
let hydrated = false;
const listeners = new Set<() => void>();

function read(): Preferences {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw) as Partial<Preferences>;
    return {
      ...DEFAULTS,
      ...parsed,
      favorites: Array.isArray(parsed.favorites) ? parsed.favorites : DEFAULTS.favorites,
      slaTarget: typeof parsed.slaTarget === "number" ? parsed.slaTarget : DEFAULTS.slaTarget,
    };
  } catch {
    return DEFAULTS;
  }
}

function ensureHydrated() {
  if (!hydrated && typeof window !== "undefined") {
    cache = read();
    hydrated = true;
  }
}

function emit() {
  for (const l of listeners) l();
}

function write(next: Preferences) {
  cache = next;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* quota / private mode — keep the in-memory value */
    }
  }
  emit();
}

function subscribe(cb: () => void): () => void {
  ensureHydrated();
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = read();
      emit();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

function getSnapshot(): Preferences {
  ensureHydrated();
  return cache;
}

function getServerSnapshot(): Preferences {
  return DEFAULTS;
}

export function usePreferences() {
  const prefs = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setPrefs = useCallback(
    (patch: Partial<Preferences> | ((p: Preferences) => Preferences)) => {
      const base = getSnapshot();
      const next = typeof patch === "function" ? patch(base) : { ...base, ...patch };
      write(next);
    },
    [],
  );

  const toggleFavorite = useCallback((modelId: string) => {
    const base = getSnapshot();
    const has = base.favorites.includes(modelId);
    write({
      ...base,
      favorites: has
        ? base.favorites.filter((id) => id !== modelId)
        : [...base.favorites, modelId],
    });
  }, []);

  const isFavorite = useCallback(
    (modelId: string) => prefs.favorites.includes(modelId),
    [prefs.favorites],
  );

  const setSlaTarget = useCallback((slaTarget: number) => {
    const base = getSnapshot();
    write({ ...base, slaTarget });
  }, []);

  return {
    prefs,
    setPrefs,
    toggleFavorite,
    isFavorite,
    setSlaTarget,
  };
}
