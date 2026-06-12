// Pure, client-safe helpers shared by the uptime calendar, latency heatmap and
// SLA tracker. No React, no server deps.
import type { DayUptime } from "@/lib/reliability-types";

export interface CalendarCell {
  /** YYYY-MM-DD (UTC). */
  date: string;
  uptime: number | null;
  total: number;
  ok: number;
  /** Whether this cell is in the future (rendered as a placeholder). */
  future: boolean;
}

function isoDay(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Build a contiguous list of the last `totalDays` calendar days (UTC, oldest
 * first), each annotated with the day's uptime if we have samples for it. The
 * resulting list is laid out as week columns by the calendar component.
 */
export function buildCalendar(days: DayUptime[], totalDays = 90): CalendarCell[] {
  const byDate = new Map(days.map((d) => [d.date, d]));
  const today = new Date();
  const todayUTC = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());

  const cells: CalendarCell[] = [];
  for (let i = totalDays - 1; i >= 0; i--) {
    const d = new Date(todayUTC - i * 86_400_000);
    const date = isoDay(d);
    const hit = byDate.get(date);
    cells.push({
      date,
      uptime: hit?.uptime ?? null,
      total: hit?.total ?? 0,
      ok: hit?.ok ?? 0,
      future: false,
    });
  }
  return cells;
}

/** Group calendar cells into GitHub-style week columns (Sun–Sat). */
export function toWeekColumns(cells: CalendarCell[]): (CalendarCell | null)[][] {
  if (cells.length === 0) return [];
  const first = new Date(`${cells[0].date}T00:00:00Z`);
  const lead = first.getUTCDay(); // 0 = Sunday
  const padded: (CalendarCell | null)[] = [...Array(lead).fill(null), ...cells];
  const columns: (CalendarCell | null)[][] = [];
  for (let i = 0; i < padded.length; i += 7) {
    columns.push(padded.slice(i, i + 7));
  }
  return columns;
}

/** GitHub-style fill for an uptime cell. Higher uptime = stronger green. */
export function uptimeFill(uptime: number | null, total: number): string {
  if (total === 0 || uptime == null) return "var(--surface-recessed)";
  if (uptime >= 99.9) return "color-mix(in srgb, var(--status-healthy) 92%, transparent)";
  if (uptime >= 99) return "color-mix(in srgb, var(--status-healthy) 66%, transparent)";
  if (uptime >= 97) return "color-mix(in srgb, var(--status-healthy) 42%, transparent)";
  if (uptime >= 95) return "color-mix(in srgb, var(--status-warn) 60%, transparent)";
  if (uptime >= 90) return "color-mix(in srgb, var(--status-warn) 85%, transparent)";
  return "color-mix(in srgb, var(--status-critical) 85%, transparent)";
}

/** Inline background for a latency heatmap cell — low latency = healthy. */
export function latencyColor(ms: number | null): string {
  if (ms == null) return "var(--surface-recessed)";
  if (ms < 250) return "color-mix(in srgb, var(--status-healthy) 80%, transparent)";
  if (ms < 500) return "color-mix(in srgb, var(--status-healthy) 48%, transparent)";
  if (ms < 800) return "color-mix(in srgb, var(--status-warn) 55%, transparent)";
  if (ms < 1500) return "color-mix(in srgb, var(--status-warn) 88%, transparent)";
  return "color-mix(in srgb, var(--status-critical) 88%, transparent)";
}

export function uptimeTone(uptime: number | null): "healthy" | "warn" | "critical" | "neutral" {
  if (uptime == null) return "neutral";
  if (uptime >= 99) return "healthy";
  if (uptime >= 95) return "warn";
  return "critical";
}

/**
 * SLA error-budget math for a target uptime over a window. Returns the allowed
 * downtime, the consumed budget and whether the model is currently passing.
 */
export function slaBudget(uptime: number | null, target: number, windowDays: number) {
  const windowMinutes = windowDays * 24 * 60;
  const allowedDowntimeMin = ((100 - target) / 100) * windowMinutes;
  if (uptime == null) {
    return { passing: null as boolean | null, allowedDowntimeMin, actualDowntimeMin: null, budgetUsedPct: null };
  }
  const actualDowntimeMin = ((100 - uptime) / 100) * windowMinutes;
  const budgetUsedPct = allowedDowntimeMin > 0 ? (actualDowntimeMin / allowedDowntimeMin) * 100 : actualDowntimeMin > 0 ? 999 : 0;
  return {
    passing: uptime >= target,
    allowedDowntimeMin,
    actualDowntimeMin,
    budgetUsedPct,
  };
}

export function fmtDuration(min: number | null): string {
  if (min == null) return "—";
  if (min < 1) return `${Math.round(min * 60)}s`;
  if (min < 60) return `${min.toFixed(min < 10 ? 1 : 0)}m`;
  const h = min / 60;
  if (h < 24) return `${h.toFixed(h < 10 ? 1 : 0)}h`;
  return `${(h / 24).toFixed(1)}d`;
}
