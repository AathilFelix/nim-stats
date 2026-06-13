"use client";

import { useEffect, useRef, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Activity, Loader2 } from "lucide-react";
import type { FleetTrendPoint } from "@/lib/dashboard-data";

type MetricKey = "ttftMs" | "throughput" | "successRate";
type RangeKey = "12h" | "24h" | "7d";

const METRICS: Record<
  MetricKey,
  { label: string; unit: string; color: string; goodWhen: "up" | "down"; fmt: (v: number) => string }
> = {
  ttftMs: { label: "Latency", unit: "ms", color: "var(--chart-1)", goodWhen: "down", fmt: (v) => `${Math.round(v)}` },
  throughput: { label: "Throughput", unit: "tok/s", color: "var(--chart-2)", goodWhen: "up", fmt: (v) => v.toFixed(1) },
  successRate: { label: "Reliability", unit: "%", color: "var(--status-healthy)", goodWhen: "up", fmt: (v) => `${v.toFixed(1)}` },
};

const ORDER: MetricKey[] = ["ttftMs", "throughput", "successRate"];
const RANGES: RangeKey[] = ["12h", "24h", "7d"];

function fmtTick(iso: string, range: RangeKey): string {
  const d = new Date(iso);
  if (range === "7d") {
    return d.toLocaleString("en-US", { weekday: "short", hour: "2-digit", hour12: false });
  }
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
}

export function FleetTrendChart({ data }: { data: FleetTrendPoint[] }) {
  const [metric, setMetric] = useState<MetricKey>("ttftMs");
  const [range, setRange] = useState<RangeKey>("12h");
  // Cached series for non-default ranges (the 12h prop refreshes via the page).
  const [remote, setRemote] = useState<{ range: RangeKey; data: FleetTrendPoint[] } | null>(null);

  useEffect(() => {
    if (range === "12h") return;
    let cancelled = false;
    fetch(`/api/fleet/trend?range=${range}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((j: { range: RangeKey; data: FleetTrendPoint[] }) => {
        if (!cancelled) setRemote({ range, data: j.data ?? [] });
      })
      .catch(() => {
        if (!cancelled) setRemote({ range, data: [] });
      });
    return () => {
      cancelled = true;
    };
  }, [range]);

  // Self-measure the plot box instead of using Recharts' ResponsiveContainer,
  // which renders at width(-1)/height(-1) on its first tick (and again under
  // React 19 Strict Mode) and logs a warning. We render the chart only once the
  // ResizeObserver reports a real, positive box — so the chart never sees -1.
  const plotRef = useRef<HTMLDivElement>(null);
  const [plot, setPlot] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const el = plotRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const cr = entries[0]?.contentRect;
      if (cr) setPlot({ w: Math.round(cr.width), h: Math.round(cr.height) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const plotReady = plot.w > 0 && plot.h > 0;

  // In-flight whenever the requested range hasn't been fetched yet.
  const loading = range !== "12h" && remote?.range !== range;
  const series = range === "12h" ? data : remote?.range === range ? remote.data : [];
  const cfg = METRICS[metric];

  const points = series.filter((d) => d[metric] != null);
  const values = points.map((d) => d[metric] as number);
  const current = values.at(-1) ?? null;
  const first = values.at(0) ?? null;
  const avg = values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
  const min = values.length ? Math.min(...values) : null;
  const max = values.length ? Math.max(...values) : null;

  const deltaPct = current != null && first != null && first !== 0 ? ((current - first) / first) * 100 : null;
  const deltaGood = deltaPct == null ? null : cfg.goodWhen === "up" ? deltaPct >= 0 : deltaPct <= 0;
  const rangeLabel = range === "7d" ? "7d" : range;

  return (
    <section className="ops-card">
      <div className="hdiv flex-col items-start gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <Activity className="h-3.5 w-3.5 text-text-accent" />
          <span className="section-label">Fleet Performance · {rangeLabel}</span>
          {loading && <Loader2 className="h-3 w-3 animate-spin text-text-quaternary" aria-label="Loading" />}
        </div>
        <div className="flex items-center gap-2">
          {/* Time range */}
          <div className="flex items-center gap-1 rounded-lg border border-border-subtle bg-surface-recessed p-0.5">
            {RANGES.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRange(r)}
                aria-pressed={range === r}
                className={`rounded-md px-3 py-1 metric-xs transition-colors ${
                  range === r ? "bg-surface-elevated text-text-primary" : "text-text-tertiary hover:text-text-secondary"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
          {/* Metric */}
          <div className="flex items-center gap-1 rounded-lg border border-border-subtle bg-surface-recessed p-0.5">
            {ORDER.map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setMetric(k)}
                aria-pressed={metric === k}
                className={`rounded-md px-3 py-1 metric-xs transition-colors ${
                  metric === k ? "bg-surface-elevated text-text-primary" : "text-text-tertiary hover:text-text-secondary"
                }`}
              >
                {METRICS[k].label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Readout strip */}
      <div className="flex flex-wrap items-end gap-x-6 gap-y-2 px-4 pt-4 sm:px-5">
        <div className="flex items-baseline gap-1.5">
          <span className="metric-hero text-text-primary">{current != null ? cfg.fmt(current) : "—"}</span>
          <span className="metric-sm text-text-tertiary">{cfg.unit}</span>
        </div>
        {deltaPct != null && (
          <span
            className={`metric-xs ${deltaGood ? "text-status-healthy" : "text-status-critical"}`}
            title="Change over window"
          >
            {deltaPct >= 0 ? "▲" : "▼"} {Math.abs(deltaPct).toFixed(1)}% · {rangeLabel}
          </span>
        )}
        <div className="ml-auto flex items-center gap-4">
          {avg != null && <Readout label="avg" value={`${cfg.fmt(avg)}`} />}
          {min != null && <Readout label="min" value={`${cfg.fmt(min)}`} />}
          {max != null && <Readout label="max" value={`${cfg.fmt(max)}`} />}
        </div>
      </div>

      <div ref={plotRef} className="h-[210px] w-full px-1 pb-2 pt-3 sm:h-[250px] sm:px-2">
        {!plotReady || points.length < 2 ? (
          <div className="flex h-full items-center justify-center">
            <p className="body-xs text-text-tertiary">
              {loading || !plotReady ? "Loading…" : "Collecting telemetry — the trend fills in as probes run."}
            </p>
          </div>
        ) : (
            <AreaChart width={plot.w} height={plot.h} data={points} margin={{ top: 4, right: 14, bottom: 0, left: 4 }}>
              <defs>
                <linearGradient id={`grad-${metric}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={cfg.color} stopOpacity={0.26} />
                  <stop offset="100%" stopColor={cfg.color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--border-subtle)" strokeDasharray="0" vertical={false} />
              <XAxis
                dataKey="t"
                tickFormatter={(v) => fmtTick(v as string, range)}
                tick={{ fill: "var(--text-tertiary)", fontSize: 10, fontFamily: "var(--font-mono)" }}
                tickLine={false}
                axisLine={{ stroke: "var(--border-subtle)" }}
                minTickGap={44}
              />
              <YAxis
                width={42}
                tick={{ fill: "var(--text-tertiary)", fontSize: 10, fontFamily: "var(--font-mono)" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => cfg.fmt(v)}
              />
              <Tooltip
                cursor={{ stroke: "var(--border-strong)", strokeDasharray: "3 3" }}
                contentStyle={{
                  background: "var(--surface-overlay)",
                  border: "1px solid var(--border-base)",
                  borderRadius: 9,
                  fontSize: 12,
                  fontFamily: "var(--font-mono)",
                  padding: "8px 11px",
                  boxShadow: "0 8px 28px rgba(0,0,0,0.4)",
                }}
                labelStyle={{ color: "var(--text-tertiary)", marginBottom: 3 }}
                itemStyle={{ color: "var(--text-primary)" }}
                labelFormatter={(l) => fmtTick(l as string, range)}
                formatter={(v) => [`${cfg.fmt(Number(v))} ${cfg.unit}`, cfg.label]}
              />
              <Area
                type="monotone"
                dataKey={metric}
                stroke={cfg.color}
                strokeWidth={2}
                fill={`url(#grad-${metric})`}
                dot={false}
                activeDot={{ r: 3.5, strokeWidth: 0, fill: cfg.color }}
                isAnimationActive={false}
              />
            </AreaChart>
        )}
      </div>
    </section>
  );
}

function Readout({ label, value }: { label: string; value: string }) {
  return (
    <span className="flex items-baseline gap-1.5">
      <span className="label-xs text-text-quaternary">{label}</span>
      <span className="metric-sm text-text-secondary">{value}</span>
    </span>
  );
}
