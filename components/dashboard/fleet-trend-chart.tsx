"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from "react";
import type { FleetTrendPoint } from "@/lib/dashboard-data";
import { TREND_RANGES, type TrendRange } from "@/lib/api/params";
import { useTrendRange } from "./trend-range";
import { Seg } from "@/components/ui/seg";
import { prefersReducedMotion } from "@/lib/client/motion";

type MetricKey = "successRate" | "ttftMs" | "throughput";

const METRICS: Record<MetricKey, { label: string; unit: string; fixedMax?: number; fmt: (v: number) => string }> = {
  successRate: { label: "Reply rate", unit: "%", fixedMax: 100, fmt: (v) => v.toFixed(1) },
  ttftMs: { label: "First token", unit: "ms", fmt: (v) => String(Math.round(v)) },
  throughput: { label: "Throughput", unit: "tok/s", fmt: (v) => v.toFixed(1) },
};
const ORDER: MetricKey[] = ["successRate", "ttftMs", "throughput"];

/** "86.2%" but "604 ms". */
const withUnit = (v: string, unit: string) => (unit === "%" ? `${v}%` : `${v} ${unit}`);

const DEFAULT_RANGE: TrendRange = "12h";
const RANGE_NAME: Record<TrendRange, string> = { "12h": "12 hours", "24h": "24 hours", "7d": "7 days" };
const SERIES_NAME: Record<TrendRange, string> = { "12h": "12-hour", "24h": "24-hour", "7d": "7-day" };

type Remote = { data: FleetTrendPoint[] } | { failed: true };

/** Largest "nice" step (1, 2, 2.5, 5 x 10^k) that keeps a scale to <= 4 divisions. */
function niceScale(max: number): { top: number; step: number } {
  if (!(max > 0)) return { top: 1, step: 0.25 };
  const raw = max / 4;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((f) => f * pow).find((s) => s >= raw) ?? raw;
  return { top: Math.ceil(max / step) * step, step };
}

const fmtSlot = (t: number, range: TrendRange, long = false) => {
  const d = new Date(t);
  const hm = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "UTC" });
  if (range === "7d" || long) {
    const day = d.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" });
    return long ? `${day} ${d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })}, ${hm} UTC` : `${day} ${hm}`;
  }
  return hm;
};

interface Slot {
  t: number;
  v: number | null;
}

export function FleetTrendChart({ data }: { data: FleetTrendPoint[] }) {
  const { range } = useTrendRange();
  const [metric, setMetric] = useState<MetricKey>("successRate");
  // Fetched series for the non-default ranges, kept so toggling back is instant.
  const [remote, setRemote] = useState<Partial<Record<TrendRange, Remote>>>({});
  const [hover, setHover] = useState<number | null>(null);
  const plotKey = `${range}|${metric}`;
  // M3: the bars sweep in once on mount ("intro", after the panel's own reveal) and
  // again whenever the range or metric changes ("swap", after the old plot has
  // faded). Derived during render so the new bars mount already in draw mode.
  const [draw, setDraw] = useState<{ key: string; mode: "intro" | "swap" | "idle" }>({ key: plotKey, mode: "intro" });
  if (draw.key !== plotKey) setDraw({ key: plotKey, mode: "swap" });
  const plotRef = useRef<HTMLDivElement>(null);
  const ghostRef = useRef<HTMLDivElement>(null);
  const ghostAnim = useRef<Animation | null>(null);
  const lastPlot = useRef<{ key: string; html: string } | null>(null);

  useEffect(() => {
    if (range === DEFAULT_RANGE || remote[range]) return;
    let cancelled = false;
    // No `no-store`: let the route's Cache-Control drive CDN/browser caching.
    fetch(`/api/fleet/trend?range=${range}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((j: { data: FleetTrendPoint[] }) => {
        if (!cancelled) setRemote((s) => ({ ...s, [range]: { data: j.data ?? [] } }));
      })
      .catch(() => {
        if (!cancelled) setRemote((s) => ({ ...s, [range]: { failed: true } }));
      });
    return () => {
      cancelled = true;
    };
  }, [range, remote]);

  const isDefault = range === DEFAULT_RANGE;
  const entry = isDefault ? undefined : remote[range];
  const loading = !isDefault && !entry;
  const failed = !!entry && "failed" in entry;
  const series = useMemo(
    () => (isDefault ? data : entry && "data" in entry ? entry.data : []),
    [isDefault, data, entry],
  );

  const cfg = METRICS[metric];
  const { hours, bucketMinutes } = TREND_RANGES[range];

  // Uniform time grid ending at the newest bucket, so a gap in the probes shows
  // as a gap rather than being squeezed out. Only measured buckets get a bar.
  const slots = useMemo<Slot[]>(() => {
    if (series.length === 0) return [];
    const step = bucketMinutes * 60_000;
    const byT = new Map(series.map((p) => [Date.parse(p.t), p[metric]]));
    const end = Math.max(...byT.keys());
    const n = (hours * 60) / bucketMinutes;
    return Array.from({ length: n }, (_, i) => {
      const t = end - (n - 1 - i) * step;
      return { t, v: byT.get(t) ?? null };
    });
  }, [series, metric, hours, bucketMinutes]);

  // Once any range has had enough data to draw, the panel keeps one box height
  // for loading, error, empty and loaded (R10a). Only a panel that has never had
  // a plot is allowed the compact empty strip.
  const everPlotted =
    data.length >= 2 || Object.values(remote).some((e) => !!e && "data" in e && e.data.length >= 2);

  const measured = slots.filter((s): s is Slot & { v: number } => s.v != null);
  const hasPlot = measured.length >= 2;
  const showPlot = !loading && !failed && hasPlot;
  const n = slots.length;

  // The draw mode ends once the bars have had time to land (the longest run is
  // base 120ms + 240ms of stagger + 360ms).
  useEffect(() => {
    if (draw.mode === "idle" || !showPlot) return;
    const t = setTimeout(() => setDraw((d) => (d.key === draw.key ? { ...d, mode: "idle" } : d)), 1000);
    return () => clearTimeout(t);
  }, [draw, showPlot]);

  // The previous plot is kept as an inert snapshot (the DOM it last drew) so a
  // range or metric change can fade it out in 120ms, and so a remote range that
  // is still loading shows the old plot at 40% instead of a spinner. All
  // imperative: nothing here is React state, and nothing resizes.
  useLayoutEffect(() => {
    const host = plotRef.current;
    const ghost = ghostRef.current;
    if (!host || !ghost) return;
    const reduced = prefersReducedMotion();
    const snap = lastPlot.current;
    const fadeOut = (from: number) => {
      ghostAnim.current?.cancel();
      if (reduced) {
        ghost.replaceChildren();
        return;
      }
      const a = ghost.animate([{ opacity: from }, { opacity: 0 }], {
        duration: 120,
        easing: "cubic-bezier(0.4, 0, 1, 1)",
        fill: "forwards",
      });
      ghostAnim.current = a;
      a.onfinish = () => {
        ghost.replaceChildren();
        a.cancel();
      };
    };
    const show = (html: string) => {
      ghost.innerHTML = html;
      // The snapshot must not draw itself in again.
      ghost.querySelectorAll("[data-draw]").forEach((el) => el.removeAttribute("data-draw"));
      ghost.inert = true;
    };
    if (showPlot) {
      if (ghost.firstChild) fadeOut(loading ? 0.4 : 1);
      else if (snap && snap.key !== plotKey) {
        show(snap.html);
        fadeOut(1);
      }
      lastPlot.current = { key: plotKey, html: host.innerHTML };
    } else if (loading && snap) {
      if (!ghost.firstChild) show(snap.html);
      ghostAnim.current?.cancel();
      if (reduced) ghost.style.opacity = "0.4";
      else
        ghostAnim.current = ghost.animate([{ opacity: 1 }, { opacity: 0.4 }], {
          duration: 120,
          easing: "cubic-bezier(0.4, 0, 1, 1)",
          fill: "forwards",
        });
    } else if (ghost.firstChild) {
      fadeOut(0.4);
    }
    if (!loading) ghost.style.opacity = "";
  }, [showPlot, loading, plotKey, slots]);

  const values = measured.map((s) => s.v);
  const max = values.length ? Math.max(...values) : 0;
  const min = values.length ? Math.min(...values) : 0;
  const avg = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
  let latestIdx = -1;
  slots.forEach((s, i) => {
    if (s.v != null) latestIdx = i;
  });
  const { top, step } = cfg.fixedMax ? { top: cfg.fixedMax, step: cfg.fixedMax / 4 } : niceScale(max);
  const ticks = Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step);
  const tickFmt = (v: number) => (step < 1 ? v.toFixed(1) : String(Math.round(v)));

  const xLabel = (count: number) =>
    Array.from({ length: count }, (_, k) => Math.round((k * (n - 1)) / (count - 1)));

  const gap = n <= 30 ? 4 : n <= 48 ? 2 : 1;
  // Stagger across columns, the whole run clamped to 240ms for any column count.
  const barStep = n > 1 ? Math.min(6, 240 / (n - 1)) : 0;
  const drawing = draw.mode === "idle" ? undefined : draw.mode;

  const idxAt = (e: PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return Math.min(n - 1, Math.max(0, Math.floor(((e.clientX - r.left) / r.width) * n)));
  };
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    const dir = e.key === "ArrowLeft" ? -1 : 1;
    setHover((h) => Math.min(n - 1, Math.max(0, (h ?? latestIdx) + dir)));
  };

  const readout = hover != null ? slots[hover] : null;
  const summary = hasPlot
    ? `Fleet ${cfg.label.toLowerCase()} over the last ${RANGE_NAME[range]}: latest ${withUnit(cfg.fmt(slots[latestIdx].v as number), cfg.unit)}, average ${withUnit(cfg.fmt(avg), cfg.unit)}, range ${withUnit(cfg.fmt(min), cfg.unit)} to ${withUnit(cfg.fmt(max), cfg.unit)}.`
    : "";

  return (
    <section aria-label="Fleet performance" className="panel col-span-12 flex flex-col min-[1100px]:col-span-8">
      <div className="hdiv">
        <h2 className="heading-md">Fleet performance</h2>
        <Seg role="group" aria-label="Metric" className="max-md:w-full">
          {ORDER.map((k) => (
            <button
              key={k}
              type="button"
              aria-pressed={metric === k}
              onClick={() => {
                setMetric(k);
                setHover(null);
              }}
            >
              {METRICS[k].label}
            </button>
          ))}
        </Seg>
      </div>

      {!loading && !failed && !hasPlot && !everPlotted ? (
        // The one compact state: settled empty, and no plot has ever shown.
        <div className="flex flex-1 items-center px-4 py-6 md:px-6">
          <p className="body-sm text-text-muted">No trend yet. The chart fills in as probes run.</p>
        </div>
      ) : (
        <div className="flex flex-1 flex-col p-4 md:p-6">
          <div className="relative ml-8 min-h-44 flex-1 md:min-h-56">
            {loading ? (
              // Static, no spinner. When something has plotted before, the old plot
              // stays under this at 40% (the ghost layer) and only the status is read out.
              <div
                role="status"
                className={
                  everPlotted ? "sr-only" : "flex h-full items-center justify-center body-sm text-text-muted"
                }
              >
                Loading
              </div>
            ) : failed ? (
              <div className="flex h-full flex-wrap content-center items-center justify-center gap-3">
                <p className="body-sm text-text-muted">The {SERIES_NAME[range]} series did not load.</p>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setRemote((s) => ({ ...s, [range]: undefined }))}
                >
                  Retry
                </button>
              </div>
            ) : !hasPlot ? (
              <div className="flex h-full items-center justify-center">
                <p className="body-sm text-text-muted">No trend yet. The chart fills in as probes run.</p>
              </div>
            ) : (
              <div ref={plotRef} className="absolute inset-0">
                <div className="chart-fade" data-draw={drawing}>
                  {ticks.map((tv) => (
                    <div key={tv}>
                      <div className="absolute inset-x-0 border-t border-border-subtle" style={{ top: `${100 - (tv / top) * 100}%` }} />
                      <span
                        className="absolute -left-8 w-6 -translate-y-1/2 text-right text-xs leading-none text-text-muted"
                        style={{ top: `${100 - (tv / top) * 100}%` }}
                      >
                        {tickFmt(tv)}
                      </span>
                    </div>
                  ))}
                </div>
                <div
                  role="group"
                  tabIndex={0}
                  aria-label={`${summary} Use the left and right arrow keys to read each bucket.`}
                  className="chart-bars absolute inset-0 flex items-end rounded-xs"
                  data-draw={drawing}
                  style={{ gap, "--bar-step": `${barStep}ms` } as CSSProperties}
                  onPointerMove={(e) => setHover(idxAt(e))}
                  onPointerLeave={() => setHover(null)}
                  onKeyDown={onKey}
                  onBlur={() => setHover(null)}
                >
                  {slots.map((s, i) => (
                    <div key={`${plotKey}|${s.t}`} className="chart-col relative h-full min-w-0 flex-1" data-active={hover === i}>
                      {s.v != null && (
                        <div
                          className={`chart-bar absolute inset-x-0 bottom-0 ${i === latestIdx ? "bg-primary" : "bg-text-muted"}`}
                          style={{
                            height: `${Math.min(100, (s.v / top) * 100)}%`,
                            minHeight: s.v > 0 ? 2 : 0,
                            borderRadius: "2px 2px 0 0",
                            "--i": i,
                          } as CSSProperties}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div ref={ghostRef} className="chart-ghost" aria-hidden="true" />
          </div>

          {/* The axis and readout rows are always rendered at their loaded height,
              so loading, error and empty keep the box the loaded chart has. */}
          <div className="chart-fade relative ml-8 mt-3 h-4 text-xs leading-none text-text-muted" aria-hidden="true" data-draw={drawing === "swap" ? "swap" : undefined}>
            {showPlot &&
              [
                { idx: xLabel(6), cls: "max-md:hidden" },
                { idx: xLabel(4), cls: "md:hidden" },
              ].map(({ idx, cls }) =>
                idx.map((i) => (
                  <span
                    key={`${cls}-${i}`}
                    className={`absolute whitespace-nowrap ${i === n - 1 ? "-translate-x-full" : "-translate-x-1/2"} ${cls}`}
                    style={{ left: `${((i === n - 1 ? n : i + 0.5) / n) * 100}%` }}
                  >
                    {fmtSlot(slots[i].t, range)}
                  </span>
                )),
              )}
          </div>

          {/* Hover / keyboard readout and the summary share one row. Below sm the
              summary wraps to two lines, so the row reserves two. */}
          <p className="mt-4 flex min-h-[2.625rem] flex-wrap content-start items-baseline gap-x-4 gap-y-1 body-sm text-text-muted sm:min-h-[1.3125rem]">
            {showPlot &&
              (readout ? (
                <>
                  <b className="font-medium text-text-primary">
                    {readout.v != null ? withUnit(cfg.fmt(readout.v), cfg.unit) : "No data"}
                  </b>
                  <span>{fmtSlot(readout.t, range, true)}</span>
                </>
              ) : (
                <>
                  <Stat label="Latest" value={withUnit(cfg.fmt(slots[latestIdx].v as number), cfg.unit)} />
                  <Stat label="Average" value={withUnit(cfg.fmt(avg), cfg.unit)} />
                  <Stat label="Range" value={`${cfg.fmt(min)} to ${withUnit(cfg.fmt(max), cfg.unit)}`} />
                  <span className="sm:ml-auto">Times in UTC</span>
                </>
              ))}
          </p>

          {showPlot && (
            <table className="sr-only">
              <caption>
                {cfg.label}, last {RANGE_NAME[range]}
              </caption>
              <thead>
                <tr>
                  <th scope="col">Time (UTC)</th>
                  <th scope="col">{cfg.label}</th>
                </tr>
              </thead>
              <tbody>
                {measured.map((s) => (
                  <tr key={s.t}>
                    <td>{fmtSlot(s.t, range, true)}</td>
                    <td>{withUnit(cfg.fmt(s.v), cfg.unit)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <span>
      {label} <b className="font-medium text-text-primary">{value}</b>
    </span>
  );
}
