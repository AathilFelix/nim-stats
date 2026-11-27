"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { DEFAULT_TREND_RANGE, TREND_RANGE_VALUES, type TrendRange } from "@/lib/api/params";

interface TrendRangeValue {
  range: TrendRange;
  setRange: (r: TrendRange) => void;
}

const TrendRangeContext = createContext<TrendRangeValue | null>(null);

/**
 * Holds the selected trend window so the range picker (in the sticky section
 * bar) and the chart (further down) share it. Renders no DOM of its own. The
 * page stays statically cached: the range is client state, never a search param.
 */
export function TrendRangeProvider({ children }: { children: ReactNode }) {
  const [range, setRange] = useState<TrendRange>(DEFAULT_TREND_RANGE);
  const value = useMemo(() => ({ range, setRange }), [range]);
  return <TrendRangeContext.Provider value={value}>{children}</TrendRangeContext.Provider>;
}

export function useTrendRange(): TrendRangeValue {
  const ctx = useContext(TrendRangeContext);
  return ctx ?? { range: DEFAULT_TREND_RANGE, setRange: () => {} };
}

/** The ranges the trend API serves, in picker order. */
export const SUPPORTED_RANGES: readonly TrendRange[] = TREND_RANGE_VALUES;
