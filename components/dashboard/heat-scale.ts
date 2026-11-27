// Buckets for the uptime calendar and the latency heatmap. They return a
// `data-lv` value that `.heat` in globals.css paints from tokens, so the ramps
// live in CSS (both themes) and these thresholds are the only numbers here.
//
// Uptime: emerald steps, stronger = more uptime; under 95% is a hatch, so the
// worst days never depend on telling two hues apart.
// Latency: ink steps, stronger = slower first token.

export type HeatLevel = "0" | "1" | "2" | "3" | "4" | "5" | "bad";

export function uptimeLevel(uptime: number | null, total: number): HeatLevel {
  if (total === 0 || uptime == null) return "0";
  if (uptime >= 99.9) return "4";
  if (uptime >= 99) return "3";
  if (uptime >= 97) return "2";
  if (uptime >= 95) return "1";
  return "bad";
}

export function latencyLevel(ms: number | null): HeatLevel {
  if (ms == null) return "0";
  if (ms < 250) return "1";
  if (ms < 500) return "2";
  if (ms < 800) return "3";
  if (ms < 1500) return "4";
  return "5";
}

export const UPTIME_STEPS: { level: HeatLevel; label: string }[] = [
  { level: "bad", label: "Below 95%" },
  { level: "1", label: "95 to 97%" },
  { level: "2", label: "97 to 99%" },
  { level: "3", label: "99 to 99.9%" },
  { level: "4", label: "99.9%+" },
];

export const LATENCY_STEPS: { level: HeatLevel; label: string }[] = [
  { level: "1", label: "Under 250 ms" },
  { level: "2", label: "250 to 500" },
  { level: "3", label: "500 to 800" },
  { level: "4", label: "800 to 1,500" },
  { level: "5", label: "Over 1,500 ms" },
];
