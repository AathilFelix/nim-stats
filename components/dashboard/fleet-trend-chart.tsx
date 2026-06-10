"use client";

import { useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { FleetTrendPoint } from "@/lib/dashboard-data";

type MetricKey = "ttftMs" | "throughput" | "successRate";

const METRICS: Record<
  MetricKey,
  { label: string; unit: string; color: string; fmt: (v: number) => string }
> = {
  ttftMs: { label: "Latency", unit: "ms", color: "var(--chart-1)", fmt: (v) => `${Math.round(v)}` },
  throughput: { label: "Throughput", unit: "tok/s", color: "var(--chart-2)", fmt: (v) => v.toFixed(1) },
  successRate: { label: "Reliability", unit: "%", color: "var(--chart-2)", fmt: (v) => `${v.toFixed(1)}` },
};

const ORDER: MetricKey[] = ["ttftMs", "throughput", "successRate"];

function hhmm(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
}

export function FleetTrendChart({ data }: { data: FleetTrendPoint[] }) {
  const [metric, setMetric] = useState<MetricKey>("ttftMs");
  const cfg = METRICS[metric];

  const points = data.filter((d) => d[metric] != null);
  const values = points.map((d) => d[metric] as number);
  const current = values.at(-1) ?? null;
  const avg = values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;

  return (
    <section className="rounded-xl border border-border-base bg-surface-card">
      <header className="flex flex-col gap-3 border-b border-border-subtle p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-baseline gap-3">
          <h2 className="text-sm font-semibold tracking-tight text-text-primary">Fleet performance</h2>
          {current != null && (
            <span className="font-mono text-sm tabular-nums text-text-secondary">
              {cfg.fmt(current)}
              <span className="ml-1 text-text-tertiary">{cfg.unit}</span>
            </span>
          )}
          {avg != null && (
            <span className="hidden text-xs text-text-tertiary sm:inline">
              avg {cfg.fmt(avg)} {cfg.unit}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-border-subtle bg-surface-recessed p-0.5">
          {ORDER.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setMetric(k)}
              aria-pressed={metric === k}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                metric === k
                  ? "bg-surface-elevated text-text-primary shadow-sm"
                  : "text-text-tertiary hover:text-text-secondary"
              }`}
            >
              {METRICS[k].label}
            </button>
          ))}
        </div>
      </header>

      <div className="h-[200px] w-full px-2 pb-2 pt-4 sm:h-[240px]">
        {points.length < 2 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-xs text-text-tertiary">Collecting data — the trend fills in as probes run.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={points} margin={{ top: 4, right: 12, bottom: 0, left: 4 }}>
              <defs>
                <linearGradient id={`grad-${metric}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={cfg.color} stopOpacity={0.22} />
                  <stop offset="100%" stopColor={cfg.color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--border-subtle)" strokeDasharray="0" vertical={false} />
              <XAxis
                dataKey="t"
                tickFormatter={hhmm}
                tick={{ fill: "var(--text-tertiary)", fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: "var(--border-subtle)" }}
                minTickGap={40}
              />
              <YAxis
                width={40}
                tick={{ fill: "var(--text-tertiary)", fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => cfg.fmt(v)}
              />
              <Tooltip
                cursor={{ stroke: "var(--border-base)" }}
                contentStyle={{
                  background: "var(--surface-elevated)",
                  border: "1px solid var(--border-base)",
                  borderRadius: 8,
                  fontSize: 12,
                  padding: "8px 10px",
                }}
                labelStyle={{ color: "var(--text-tertiary)", marginBottom: 2 }}
                itemStyle={{ color: "var(--text-primary)" }}
                labelFormatter={(l) => hhmm(l as string)}
                formatter={(v) => [`${cfg.fmt(Number(v))} ${cfg.unit}`, cfg.label]}
              />
              <Area
                type="monotone"
                dataKey={metric}
                stroke={cfg.color}
                strokeWidth={2}
                fill={`url(#grad-${metric})`}
                dot={false}
                activeDot={{ r: 3, strokeWidth: 0 }}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}
