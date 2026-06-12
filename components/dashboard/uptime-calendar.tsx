"use client";

import { useMemo, useState } from "react";
import { CalendarDays } from "lucide-react";
import { PanelHeader } from "@/components/discover/ops-primitives";
import { useReliability, findModelReliability } from "@/lib/client/use-reliability";
import { usePreferences } from "@/lib/client/preferences";
import {
  buildCalendar,
  toWeekColumns,
  uptimeFill,
  type CalendarCell,
} from "@/lib/reliability-format";
import type { DayUptime } from "@/lib/reliability-types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface ModelLite {
  id: string;
  name: string;
  provider: string;
  status: string;
}

const WEEKDAY_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""];

/** Reusable 90-day grid for a single model — used standalone and in the drawer. */
export function CalendarGrid({ days, totalDays = 90 }: { days: DayUptime[]; totalDays?: number }) {
  const cells = useMemo(() => buildCalendar(days, totalDays), [days, totalDays]);
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

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="metric-xl text-text-primary">
            {overall != null ? overall.toFixed(2) : "—"}
            <span className="metric-xs text-text-tertiary ml-1">% uptime · {totalDays}d</span>
          </p>
          <p className="metric-xs text-text-tertiary mt-0.5">
            {withData.length} day{withData.length === 1 ? "" : "s"} measured
            {worst?.uptime != null && (
              <span className="text-text-quaternary"> · worst {worst.uptime.toFixed(1)}% on {worst.date.slice(5)}</span>
            )}
          </p>
        </div>
      </div>

      <div className="overflow-x-auto pb-1">
        <div className="flex gap-[3px]">
          {/* weekday gutter */}
          <div className="mr-1 flex flex-col gap-[3px]">
            {WEEKDAY_LABELS.map((l, i) => (
              <span key={i} className="h-[11px] w-7 metric-xs leading-[11px] text-text-quaternary">
                {l}
              </span>
            ))}
          </div>
          {columns.map((col, ci) => (
            <div key={ci} className="flex flex-col gap-[3px]">
              {Array.from({ length: 7 }, (_, ri) => {
                const cell = col[ri];
                if (!cell) return <span key={ri} className="h-[11px] w-[11px]" />;
                const tip =
                  cell.total > 0
                    ? `${cell.date} · ${cell.uptime?.toFixed(2)}% (${cell.ok}/${cell.total})`
                    : `${cell.date} · no data`;
                return (
                  <span
                    key={ri}
                    title={tip}
                    className="h-[11px] w-[11px] rounded-[2px] ring-1 ring-inset ring-border-subtle/60"
                    style={{ backgroundColor: uptimeFill(cell.uptime, cell.total) }}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2">
        <span className="metric-xs text-text-quaternary">Less</span>
        {[null, 90, 95, 99, 99.95].map((u, i) => (
          <span
            key={i}
            className="h-[11px] w-[11px] rounded-[2px] ring-1 ring-inset ring-border-subtle/60"
            style={{ backgroundColor: uptimeFill(u, u == null ? 0 : 10) }}
          />
        ))}
        <span className="metric-xs text-text-quaternary">More</span>
      </div>
    </div>
  );
}

export function UptimeCalendar({ models }: { models: ModelLite[] }) {
  const { prefs } = usePreferences();
  const { data, loading } = useReliability();

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
    <section className="ops-card">
      <PanelHeader
        label="Uptime Calendar"
        icon={CalendarDays}
        tone="healthy"
        meta={
          <Select value={activeId} onValueChange={setSelectedId}>
            <SelectTrigger size="sm" aria-label="Select model for uptime calendar" className="max-w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sorted.map((m) => (
                <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />
      <div className="panel-pad p-4 sm:p-5">
        {loading && !data ? (
          <p className="body-xs text-text-tertiary py-6 text-center">Loading reliability history…</p>
        ) : (
          <CalendarGrid days={days} />
        )}
      </div>
    </section>
  );
}
