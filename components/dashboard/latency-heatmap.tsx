"use client";

import { useMemo } from "react";
import { Clock } from "lucide-react";
import { PanelHeader } from "@/components/discover/ops-primitives";
import { useReliability } from "@/lib/client/use-reliability";
import { latencyColor } from "@/lib/reliability-format";
import type { HourBucket } from "@/lib/reliability-types";

const HOUR_TICKS = [0, 3, 6, 9, 12, 15, 18, 21];

/** Single-model 24-hour latency strip — used in the detail drawer. */
export function HourStrip({ hours }: { hours: HourBucket[] }) {
  const hasData = hours.some((h) => h.total > 0);
  return (
    <div className="space-y-1.5">
      <div className="flex gap-[2px]">
        {hours.map((h) => (
          <span
            key={h.hour}
            title={
              h.total > 0
                ? `${String(h.hour).padStart(2, "0")}:00 UTC · ${h.avgTtft ?? "—"}ms TTFT · ${h.uptime?.toFixed(0)}% ok (${h.total})`
                : `${String(h.hour).padStart(2, "0")}:00 UTC · no data`
            }
            className="h-5 flex-1 rounded-[2px] ring-1 ring-inset ring-border-subtle/50"
            style={{ backgroundColor: latencyColor(h.total > 0 ? h.avgTtft : null) }}
          />
        ))}
      </div>
      <div className="flex justify-between">
        {[0, 6, 12, 18, 23].map((t) => (
          <span key={t} className="metric-xs text-text-quaternary">{String(t).padStart(2, "0")}</span>
        ))}
      </div>
      {!hasData && <p className="metric-xs text-text-quaternary">No hourly samples yet.</p>}
    </div>
  );
}

export function LatencyHeatmap() {
  const { data, loading } = useReliability();

  // Every model that has at least one hour of samples, alphabetical.
  const rows = useMemo(() => {
    if (!data) return [];
    return data.models
      .filter((m) => m.hours.some((h) => h.total > 0))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [data]);

  return (
    <section className="ops-card">
      <PanelHeader
        label="Time-of-Day Latency"
        icon={Clock}
        tone="warn"
        meta={<span className="metric-xs text-text-quaternary">{rows.length} models</span>}
      />
      <div className="p-4 sm:p-5">
        {/* Hour axis */}
        <div className="mb-1.5 flex items-center gap-2 pl-[120px]">
          <div className="grid flex-1 grid-cols-[repeat(24,minmax(0,1fr))] gap-[2px]">
            {Array.from({ length: 24 }, (_, h) => (
              <span key={h} className="metric-xs text-center text-text-quaternary leading-none">
                {HOUR_TICKS.includes(h) ? h : ""}
              </span>
            ))}
          </div>
        </div>

        {loading && !data ? (
          <p className="body-xs text-text-tertiary py-6 text-center">Loading latency history…</p>
        ) : rows.length === 0 ? (
          <p className="body-xs text-text-tertiary py-6 text-center">No hourly data yet.</p>
        ) : (
          <div className="max-h-[560px] space-y-[2px] overflow-y-auto no-scrollbar">
            {rows.map((m) => (
              <div key={m.id} className="flex items-center gap-2">
                <span className="w-[112px] shrink-0 truncate body-xs text-text-secondary" title={m.name}>
                  {m.name}
                </span>
                <div className="grid flex-1 grid-cols-[repeat(24,minmax(0,1fr))] gap-[2px]">
                  {m.hours.map((h) => (
                    <span
                      key={h.hour}
                      title={
                        h.total > 0
                          ? `${m.name} · ${String(h.hour).padStart(2, "0")}:00 UTC · ${h.avgTtft ?? "—"}ms · ${h.uptime?.toFixed(0)}% ok`
                          : `${m.name} · ${String(h.hour).padStart(2, "0")}:00 UTC · no data`
                      }
                      className="h-4 rounded-[2px] ring-1 ring-inset ring-border-subtle/40"
                      style={{ backgroundColor: latencyColor(h.total > 0 ? h.avgTtft : null) }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Legend */}
        <div className="mt-3 flex items-center gap-2">
          <span className="metric-xs text-text-quaternary">Faster</span>
          {[150, 400, 700, 1100, 2000].map((ms) => (
            <span
              key={ms}
              className="h-3 w-3 rounded-[2px] ring-1 ring-inset ring-border-subtle/50"
              style={{ backgroundColor: latencyColor(ms) }}
            />
          ))}
          <span className="metric-xs text-text-quaternary">Slower · TTFT by hour (UTC)</span>
        </div>
      </div>
    </section>
  );
}
