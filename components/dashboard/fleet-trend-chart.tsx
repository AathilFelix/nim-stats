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
import { Activity } from "lucide-react";
import type { FleetTrendPoint } from "@/lib/dashboard-data";

type MetricKey = "ttftMs" | "throughput" | "successRate";

const METRICS: Record<
  MetricKey,
  { label: string; unit: string; color: string; goodWhen: "up" | "down"; fmt: (v: number) => string }
> = {
  ttftMs: { label: "Latency", unit: "ms", color: "var(--chart-1)", goodWhen: "down", fmt: (v) => `${Math.round(v)}` },
  throughput: { label: "Throughput", unit: "tok/s", color: "var(--chart-2)", goodWhen: "up", fmt: (v) => v.toFixed(1) },
  successRate: { label: "Reliability", unit: "%", color: "var(--status-healthy)", goodWhen: "up", fmt: (v) => `${v.toFixed(1)}` },
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
  const first = values.at(0) ?? null;
  const avg = values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
  const min = values.length ? Math.min(...values) : null;
  const max = values.length ? Math.max(...values) : null;

  const deltaPct = current != null && first != null && first !== 0 ? ((current - first) / first) * 100 : null;
  const deltaGood = deltaPct == null ? null : cfg.goodWhen === "up" ? deltaPct >= 0 : deltaPct <= 0;

  return (
    <section className="ops-card">
      <div className="hdiv flex-col items-start gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <Activity className="h-3.5 w-3.5 text-text-accent" />
          <span className="section-label">Fleet Performance · 12h</span>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-border-subtle bg-surface-recessed p-0.5">
          {ORDER.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setMetric(k)}
              aria-pressed={metric === k}
              className={`rounded-md px-3 py-1 metric-xs transition-colors ${
                metric === k
                  ? "bg-surface-elevated text-text-primary"
                  : "text-text-tertiary hover:text-text-secondary"
              }`}
            >
              {METRICS[k].label}
            </button>
          ))}
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
            {deltaPct >= 0 ? "▲" : "▼"} {Math.abs(deltaPct).toFixed(1)}% · 12h
          </span>
        )}
        <div className="ml-auto flex items-center gap-4">
          {avg != null && <Readout label="avg" value={`${cfg.fmt(avg)}`} />}
          {min != null && <Readout label="min" value={`${cfg.fmt(min)}`} />}
          {max != null && <Readout label="max" value={`${cfg.fmt(max)}`} />}
        </div>
      </div>

      <div className="h-[210px] w-full px-1 pb-2 pt-3 sm:h-[250px] sm:px-2">
        {points.length < 2 ? (
          <div className="flex h-full items-center justify-center">
            <p className="body-xs text-text-tertiary">Collecting telemetry — the trend fills in as probes run.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={points} margin={{ top: 4, right: 14, bottom: 0, left: 4 }}>
              <defs>
                <linearGradient id={`grad-${metric}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={cfg.color} stopOpacity={0.26} />
                  <stop offset="100%" stopColor={cfg.color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--border-subtle)" strokeDasharray="0" vertical={false} />
              <XAxis
                dataKey="t"
                tickFormatter={hhmm}
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
                activeDot={{ r: 3.5, strokeWidth: 0, fill: cfg.color }}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
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
