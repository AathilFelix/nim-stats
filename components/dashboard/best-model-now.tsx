"use client";

import type { BestModelResult } from "@/lib/operational-types";
import { statusColor } from "@/lib/design-tokens";

interface Props {
  recommendation: BestModelResult | null;
  models: Array<Record<string, unknown>>;
}

interface MetricProps {
  label: string;
  value: string;
}

function humanize(v: string): string {
  return v.replace(/_/g, " ");
}

function Metric({ label, value }: MetricProps) {
  return (
    <div className="min-w-0">
      <p className="label-xs text-text-tertiary mb-0.5 truncate">{label}</p>
      <p className="metric-sm font-semibold text-text-primary break-words">{value}</p>
    </div>
  );
}

export function BestModelNow({ recommendation }: Props) {
  const m = recommendation?.model;
  if (!m) {
    return (
      <div
        className="p-5"
        style={{
          backgroundColor: 'var(--surface-card)',
          border: '1px solid var(--border-base)',
          borderRadius: '0.5rem',
        }}
      >
        <p className="body-sm text-text-tertiary">
          No models currently meet operational thresholds
        </p>
      </div>
    );
  }

  const status = m.status as "healthy" | "busy" | "jammed";
  const color = statusColor(status);
  const reasons = recommendation?.reasons ?? [];

  return (
    <div
      className="overflow-hidden"
      style={{
        backgroundColor: 'var(--surface-elevated)',
        border: '1px solid var(--border-base)',
        borderRadius: '0.5rem',
      }}
    >
      <div
        className="flex items-start justify-between p-4"
        style={{ borderBottom: '1px solid var(--border-subtle)' }}
      >
        <div>
          <p className="label-sm text-text-tertiary">Recommended</p>
          <h2 className="heading-md mt-1.5 text-text-primary">
            {m.name as string}
          </h2>
          <p className="metric-sm text-text-tertiary mt-1">{m.provider as string}</p>
        </div>
        <span
          className="inline-flex items-center px-2 py-0.5 rounded-sm border label-xs"
          style={{
            borderColor: `${color}40`,
            color,
            backgroundColor: `${color}15`,
          }}
        >
          {status}
        </span>
      </div>

      <div className="p-4 space-y-3">
        {reasons.length > 0 && (
          <div>
            <p className="label-sm text-text-tertiary mb-2">Why this model</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {reasons.map((r, i) => (
                <div
                  key={i}
                  className="flex items-center gap-1.5 px-2 py-1.5 rounded-sm min-w-0"
                  style={{
                    backgroundColor: 'var(--surface-recessed)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <span className="h-1 w-1 rounded-full shrink-0 bg-emerald-500" aria-hidden="true" />
                  <span className="body-sm leading-tight text-text-secondary min-w-0">{r}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div
          className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3"
          style={{ borderTop: '1px solid var(--border-subtle)' }}
        >
          <Metric label="TTFT" value={`${m.ttft}ms`} />
          <Metric label="Throughput" value={`${m.throughput} tok/s`} />
          <Metric label="Uptime" value={`${m.uptime}%`} />
          <Metric label="Volatility" value={humanize((m.volatility as { measure: string })?.measure ?? "—")} />
          <Metric label="Queue" value={humanize(m.queuePressure as string)} />
          <Metric label="Reliability" value={`${(m.sessionReliability as { score: number })?.score ?? "—"}`} />
        </div>
      </div>
    </div>
  );
}
