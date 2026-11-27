"use client";

import { useMemo } from "react";
import { useReliability } from "@/lib/client/use-reliability";
import type { HourBucket } from "@/lib/reliability-types";
import { LATENCY_STEPS, latencyLevel } from "./heat-scale";

const HOUR_TICKS = [0, 3, 6, 9, 12, 15, 18, 21];

const hh = (h: number) => String(h).padStart(2, "0");

/** Scale for the latency ramp: five labelled steps plus the empty cell. */
export function LatencyLegend() {
  return (
    <div className="heat-lat flex flex-wrap items-center gap-x-4 gap-y-2 body-sm text-text-muted">
      <span className="flex items-center gap-2">
        <i className="heat size-3.5" data-lv="0" aria-hidden="true" />
        No data
      </span>
      {LATENCY_STEPS.map((s) => (
        <span key={s.level} className="flex items-center gap-2">
          <i className="heat size-3.5" data-lv={s.level} aria-hidden="true" />
          {s.label}
        </span>
      ))}
    </div>
  );
}

/** Single-model 24-hour latency strip — used in the detail drawer. */
export function HourStrip({ hours }: { hours: HourBucket[] }) {
  const hasData = hours.some((h) => h.total > 0);
  return (
    <div className="heat-lat space-y-2">
      <div className="flex gap-[2px]" role="img" aria-label="Average first token for each hour of the day, UTC. Stronger means slower.">
        {hours.map((h) => (
          <span
            key={h.hour}
            title={
              h.total > 0
                ? `${hh(h.hour)}:00 UTC: ${h.avgTtft ?? "—"} ms first token, ${h.uptime?.toFixed(0)}% ok (${h.total} probes)`
                : `${hh(h.hour)}:00 UTC: no data`
            }
            className="heat h-6 flex-1"
            data-lv={latencyLevel(h.total > 0 ? h.avgTtft : null)}
          />
        ))}
      </div>
      <div className="flex justify-between body-xs text-text-muted">
        {[0, 6, 12, 18, 23].map((t) => (
          <span key={t}>{hh(t)}</span>
        ))}
      </div>
      <LatencyLegend />
      {!hasData && <p className="body-sm text-text-muted">No hourly samples yet.</p>}
    </div>
  );
}

export function LatencyHeatmap() {
  const { data, loading, error } = useReliability();

  // Every model that has at least one hour of samples, alphabetical.
  const rows = useMemo(() => {
    if (!data) return [];
    return data.models
      .filter((m) => m.hours.some((h) => h.total > 0))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [data]);

  // One box for loading, loaded, error and empty (R10a): the axis and legend are
  // always drawn and the rows live in a fixed-height scroller, so only what is
  // inside it changes.
  const note = !data ? (loading ? "Loading latency history…" : error ? "Couldn’t load latency history." : "No hourly data yet.") : rows.length === 0 ? "No hourly data yet." : null;

  return (
    <section aria-label="Latency by hour" className="panel col-span-12">
      <div className="hdiv">
        <h2 className="heading-md">Latency by hour</h2>
        <span className="body-sm text-text-muted">Average first token, UTC</span>
      </div>
      <div className="heat-lat panel-pad" aria-busy={loading && !data}>
        {/* Hour axis */}
        <div className="mb-2 grid grid-cols-[6rem_1fr] gap-2 md:grid-cols-[12rem_1fr]" aria-hidden="true">
          <span />
          <div className="grid grid-cols-[repeat(24,minmax(0,1fr))] gap-[2px]">
            {Array.from({ length: 24 }, (_, h) => (
              <span key={h} className="flex justify-center whitespace-nowrap body-xs leading-none text-text-muted">
                {HOUR_TICKS.includes(h) ? hh(h) : ""}
              </span>
            ))}
          </div>
        </div>

        <div
          role="region"
          tabIndex={0}
          aria-label="Average first token by endpoint and hour of day, UTC. Stronger means slower. Scrollable."
          className="h-[560px] overflow-y-auto scroll-y-lane"
        >
          {note ? (
            <p className="body-sm text-text-muted" role={error && !data ? "alert" : undefined}>{note}</p>
          ) : (
            <div className="space-y-[2px]">
              {rows.map((m) => (
                <div key={m.id} className="grid grid-cols-[6rem_1fr] items-center gap-2 md:grid-cols-[12rem_1fr]">
                  <span className="truncate metric-xs text-text-primary" title={m.name}>
                    {m.name}
                  </span>
                  <div className="grid grid-cols-[repeat(24,minmax(0,1fr))] gap-[2px]">
                    {m.hours.map((h) => (
                      <span
                        key={h.hour}
                        title={
                          h.total > 0
                            ? `${m.name}, ${hh(h.hour)}:00 UTC: ${h.avgTtft ?? "—"} ms first token, ${h.uptime?.toFixed(0)}% ok`
                            : `${m.name}, ${hh(h.hour)}:00 UTC: no data`
                        }
                        className="heat h-5"
                        data-lv={latencyLevel(h.total > 0 ? h.avgTtft : null)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-4">
          <LatencyLegend />
        </div>
      </div>
    </section>
  );
}
