"use client";

import type { BestModelResult } from "@/lib/operational-types";
import { statusColor } from "@/lib/status-colors";
import { cn } from "@/lib/utils";
import { TYPE_SCALE } from "@/lib/design-tokens";

interface Props {
  recommendation: BestModelResult | null;
  models: Array<Record<string, unknown>>;
}

interface MetricProps {
  label: string;
  value: string;
}

function Metric({ label, value }: MetricProps) {
  return (
    <div>
      <p
        className="uppercase tracking-wider font-medium mb-0.5"
        style={{
          fontFamily: '"IBM Plex Mono", monospace',
          fontSize: '0.6rem',
          color: 'var(--text-tertiary)',
          letterSpacing: '0.08em',
        }}
      >
        {label}
      </p>
      <p
        className="font-semibold"
        style={{
          fontFamily: '"IBM Plex Mono", monospace',
          fontSize: '0.8rem',
          color: 'var(--text-primary)',
          letterSpacing: '-0.01em',
        }}
      >
        {value}
      </p>
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
        <p
          className="text-xs"
          style={{
            fontFamily: '"IBM Plex Mono", monospace',
            fontSize: '0.75rem',
            color: 'var(--text-tertiary)',
          }}
        >
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
          <p
            className="uppercase tracking-wider font-medium"
            style={{
              fontFamily: '"IBM Plex Mono", monospace',
              fontSize: '0.6rem',
              color: 'var(--text-tertiary)',
              letterSpacing: '0.12em',
              fontWeight: 600,
            }}
          >
            Recommended
          </p>
          <h2
            className="font-semibold tracking-tight mt-1.5"
            style={{
              fontFamily: '"IBM Plex Sans", sans-serif',
              fontSize: '1.125rem',
              color: 'var(--text-primary)',
            }}
          >
            {m.name as string}
          </h2>
          <p
            className="mt-1"
            style={{
              fontFamily: '"IBM Plex Mono", monospace',
              fontSize: '0.7rem',
              color: 'var(--text-tertiary)',
            }}
          >
            {m.provider as string}
          </p>
        </div>
        <span
          className="inline-flex items-center px-2 py-0.5 rounded-sm border text-[10px] font-medium uppercase tracking-wider"
          style={{
            fontFamily: '"IBM Plex Mono", monospace',
            fontSize: '0.6rem',
            borderColor: `${color}40`,
            color,
            backgroundColor: `${color}15`,
            letterSpacing: '0.08em',
          }}
        >
          {status}
        </span>
      </div>

      <div className="p-4 space-y-3">
        {reasons.length > 0 && (
          <div>
            <p
              className="uppercase tracking-wider font-medium mb-2"
              style={{
                fontFamily: '"IBM Plex Mono", monospace',
                fontSize: '0.6rem',
                color: 'var(--text-tertiary)',
                letterSpacing: '0.12em',
                fontWeight: 600,
              }}
            >
              Why this model
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {reasons.map((r, i) => (
                <div
                  key={i}
                  className="flex items-center gap-1.5 px-2 py-1.5 rounded-sm"
                  style={{
                    backgroundColor: 'var(--surface-recessed)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <span
                    className="h-1 w-1 rounded-full shrink-0 bg-emerald-500"
                    aria-hidden="true"
                  />
                  <span
                    className="leading-tight"
                    style={{
                      fontFamily: '"IBM Plex Sans", sans-serif',
                      fontSize: '0.7rem',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {r}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div
          className="grid grid-cols-3 gap-3 pt-3"
          style={{ borderTop: '1px solid var(--border-subtle)' }}
        >
          <Metric label="TTFT" value={`${m.ttft}ms`} />
          <Metric label="Throughput" value={`${m.throughput} tok/s`} />
          <Metric label="Uptime" value={`${m.uptime}%`} />
          <Metric label="Volatility" value={(m.volatility as { measure: string })?.measure ?? "—"} />
          <Metric label="Queue" value={m.queuePressure as string} />
          <Metric label="Reliability" value={`${(m.sessionReliability as { score: number })?.score ?? "—"}`} />
        </div>
      </div>
    </div>
  );
}
