"use client";

import { useMemo, useState } from "react";
import { useReliability, findModelReliability } from "@/lib/client/use-reliability";
import { usePreferences } from "@/lib/client/preferences";
import { buildCalendar, toWeekColumns, type CalendarCell } from "@/lib/reliability-format";
import type { DayUptime } from "@/lib/reliability-types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UPTIME_STEPS, uptimeLevel } from "./heat-scale";

export interface ModelLite {
  id: string;
  name: string;
  provider: string;
  status: string;
}

const WEEKDAY_ROWS: Record<number, string> = { 1: "Mon", 3: "Wed", 5: "Fri" };
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const monthOf = (col: (CalendarCell | null)[]) => {
  const first = col.find((c): c is CalendarCell => c != null);
  return first ? Number(first.date.slice(5, 7)) - 1 : -1;
};

const dayLabel = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

function Swatch({ level, label }: { level: string; label: string }) {
  return (
    <span className="flex items-center gap-2">
      <i className="heat size-3.5" data-lv={level} aria-hidden="true" />
      {label}
    </span>
  );
}

export type CalendarState = "loaded" | "loading" | "error";

const STATE_NOTE: Record<Exclude<CalendarState, "loaded">, string> = {
  loading: "Loading reliability history…",
  error: "Couldn’t load reliability history.",
};

/**
 * Reusable 90-day grid for a single model, used standalone and in the drawer.
 * The box is the same in every state (R10a): loading and error draw the same
 * 13-week grid of empty cells, so only the note line changes. Cell size is fixed
 * per breakpoint (`.cal`), so the height never depends on data or width.
 * `labelled` adds "uptime, 90 days" to the figure; the drawer already has that
 * in its heading, so it passes false.
 */
export function CalendarGrid({
  days, totalDays = 90, state = "loaded", labelled = true,
}: { days: DayUptime[]; totalDays?: number; state?: CalendarState; labelled?: boolean }) {
  const cells = useMemo(() => buildCalendar(state === "loaded" ? days : [], totalDays), [days, totalDays, state]);
  const columns = useMemo(() => toWeekColumns(cells), [cells]);

  const withData = cells.filter((c) => c.total > 0);
  const overall =
    withData.length > 0
      ? withData.reduce((a, c) => a + c.ok, 0) / withData.reduce((a, c) => a + c.total, 0) * 100
      : null;
  const worst = withData.reduce<CalendarCell | null>(
    (w, c) => (c.uptime != null && (w == null || c.uptime < (w.uptime ?? 101)) ? c : w),
    null,
  );

  // Month name above the first week of each month. A label is skipped when it
  // would sit within two columns of the next one or run off the right edge.
  const monthLabels = columns.map((col, ci) => {
    const m = monthOf(col);
    const prev = ci > 0 ? monthOf(columns[ci - 1]) : -1;
    if (m === prev || m < 0 || ci > columns.length - 2) return null;
    const next = columns.findIndex((c, i) => i > ci && monthOf(c) !== m);
    if (ci === 0 && next !== -1 && next - ci < 3) return null;
    return MONTHS[m];
  });

  const summary =
    state !== "loaded"
      ? STATE_NOTE[state]
      : overall != null
        ? `${overall.toFixed(2)}% uptime over ${totalDays} days, ${withData.length} measured${worst?.uptime != null ? `, worst ${worst.uptime.toFixed(1)}% on ${dayLabel(worst.date)}` : ""}`
        : `No uptime measured in the last ${totalDays} days`;

  const note =
    state !== "loaded"
      ? STATE_NOTE[state]
      : `${withData.length} day${withData.length === 1 ? "" : "s"} measured${worst?.uptime != null ? `. Worst ${worst.uptime.toFixed(1)}% on ${dayLabel(worst.date)}.` : ""}`;

  return (
    <div className="heat-up cal flex h-full flex-col gap-4" aria-busy={state === "loading"}>
      <div>
        <p className="metric-xl text-text-primary">
          {overall != null ? overall.toFixed(2) : "—"}
          <small className="body-sm ml-1 tracking-normal text-text-muted">{labelled ? `% uptime, ${totalDays} days` : "%"}</small>
        </p>
        <p className="mt-1 truncate body-sm text-text-muted" role={state === "error" ? "alert" : undefined}>{note}</p>
      </div>

      <div className="overflow-x-auto pb-1">
        <div
          role="img"
          aria-label={summary}
          className="grid justify-start gap-1"
          style={{ gridTemplateColumns: `auto repeat(${columns.length}, var(--cell))`, gridTemplateRows: "16px" }}
        >
          {monthLabels.map((label, ci) =>
            label ? (
              <span key={`m${ci}`} className="body-xs whitespace-nowrap leading-4 text-text-muted" style={{ gridRow: 1, gridColumn: ci + 2 }}>
                {label}
              </span>
            ) : null,
          )}
          {Object.entries(WEEKDAY_ROWS).map(([row, label]) => (
            <span key={label} className="body-xs mr-2 flex items-center leading-none text-text-muted" style={{ gridRow: Number(row) + 2, gridColumn: 1 }}>
              {label}
            </span>
          ))}
          {columns.map((col, ci) =>
            Array.from({ length: 7 }, (_, ri) => {
              const cell = col[ri];
              if (!cell) return null;
              const tip =
                cell.total > 0
                  ? `${dayLabel(cell.date)}: ${cell.uptime?.toFixed(2)}% (${cell.ok} of ${cell.total} probes)`
                  : `${dayLabel(cell.date)}: no data`;
              return (
                <span
                  key={`${ci}-${ri}`}
                  title={tip}
                  className="heat"
                  data-lv={uptimeLevel(cell.uptime, cell.total)}
                  style={{ gridRow: ri + 2, gridColumn: ci + 2 }}
                />
              );
            }),
          )}
        </div>
      </div>

      <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 body-sm text-text-muted">
        <Swatch level="0" label="No data" />
        {UPTIME_STEPS.map((s) => (
          <Swatch key={s.level} level={s.level} label={s.label} />
        ))}
      </div>
    </div>
  );
}

export function UptimeCalendar({ models }: { models: ModelLite[] }) {
  const { prefs } = usePreferences();
  const { data, loading, error } = useReliability();

  const sorted = useMemo(() => [...models].sort((a, b) => a.name.localeCompare(b.name)), [models]);
  const defaultId = useMemo(() => {
    const fav = sorted.find((m) => prefs.favorites.includes(m.id));
    return fav?.id ?? sorted[0]?.id ?? "";
  }, [sorted, prefs.favorites]);

  const [selectedId, setSelectedId] = useState<string>("");
  const activeId = selectedId || defaultId;
  const rel = findModelReliability(data, activeId);
  const days = rel?.days ?? [];

  return (
    <section aria-label="Uptime calendar" className="panel col-span-12 flex flex-col min-[1100px]:col-span-6">
      <div className="hdiv">
        <h2 className="heading-md">Uptime calendar</h2>
        <Select value={activeId} onValueChange={setSelectedId}>
          <SelectTrigger aria-label="Select model for uptime calendar" className="max-w-[240px] max-md:max-w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {sorted.map((m) => (
              <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="panel-pad flex-1">
        <CalendarGrid days={days} state={data ? "loaded" : loading ? "loading" : error ? "error" : "loaded"} />
      </div>
    </section>
  );
}
