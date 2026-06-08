"use client";

import { type NIMModel } from "../dashboard/mock-data";
import { getStatusColor } from "../dashboard/mock-data";
import { HorizontalSparkline } from "./horizontal-sparkline";

interface ComparisonPanelProps {
  models: [NIMModel, NIMModel] | null;
  onClear: () => void;
}

const METRICS = [
  { label: "TTFT", getValue: (m: NIMModel) => `${m.ttft}ms` },
  { label: "THROUGHPUT", getValue: (m: NIMModel) => `${m.throughput.toFixed(1)} tok/s` },
  { label: "CONGESTION", getValue: (m: NIMModel) => `${m.congestion}%` },
  { label: "RELIABILITY", getValue: (m: NIMModel) => `${m.reliability}%` },
  { label: "UPTIME", getValue: (m: NIMModel) => `${m.uptime.toFixed(2)}%` },
];

export function ComparisonPanel({ models, onClear }: ComparisonPanelProps) {
  if (!models) return null;

  return (
    <div
      style={{
        backgroundColor: 'var(--surface-card)',
        border: '1px solid var(--border-base)',
        borderRadius: '0.5rem',
        overflow: 'hidden',
      }}
    >
      <div
        className="flex items-center justify-between px-5"
        style={{
          paddingTop: '12px',
          paddingBottom: '12px',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <span
          className="uppercase tracking-wider"
          style={{
            fontFamily: '"IBM Plex Mono", monospace',
            fontSize: '0.6rem',
            color: 'var(--text-tertiary)',
            letterSpacing: '0.1em',
            fontWeight: 600,
          }}
        >
          Comparison
        </span>
        <button
          onClick={onClear}
          className="uppercase tracking-wider transition-opacity hover:opacity-80"
          style={{
            fontFamily: '"IBM Plex Mono", monospace',
            fontSize: '0.65rem',
            color: 'var(--text-tertiary)',
            letterSpacing: '0.06em',
          }}
        >
          Clear
        </button>
      </div>

      <div className="grid grid-cols-2">
        {models.map((model) => {
          const statusColor = getStatusColor(model.status);
          return (
            <div
              key={model.id}
              className="p-5"
              style={{
                borderRight: '1px solid var(--border-subtle)',
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: statusColor,
                    boxShadow: `0 0 6px ${statusColor}60`,
                    display: 'inline-block',
                  }}
                />
                <p
                  className="font-semibold truncate"
                  style={{
                    fontFamily: '"IBM Plex Sans", sans-serif',
                    fontSize: '0.9rem',
                    color: 'var(--text-primary)',
                  }}
                >
                  {model.name}
                </p>
              </div>
              <p
                className="mb-4"
                style={{
                  fontFamily: '"IBM Plex Mono", monospace',
                  fontSize: '0.65rem',
                  color: 'var(--text-tertiary)',
                }}
              >
                {model.provider}
              </p>

              <div className="space-y-2">
                {METRICS.map((metric) => (
                  <div
                    key={metric.label}
                    className="flex items-baseline justify-between"
                  >
                    <span
                      className="uppercase tracking-wider shrink-0"
                      style={{
                        fontFamily: '"IBM Plex Mono", monospace',
                        fontSize: '0.6rem',
                        color: 'var(--text-tertiary)',
                        fontWeight: 500,
                        letterSpacing: '0.06em',
                      }}
                    >
                      {metric.label}
                    </span>
                    <span
                      className="tabular-nums font-semibold ml-3"
                      style={{
                        fontFamily: '"IBM Plex Mono", monospace',
                        fontSize: '0.75rem',
                        color: 'var(--text-secondary)',
                        letterSpacing: '-0.01em',
                      }}
                    >
                      {metric.getValue(model)}
                    </span>
                  </div>
                ))}
              </div>

              <div
                className="mt-4"
                style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '14px' }}
              >
                <p
                  className="uppercase tracking-wider mb-2"
                  style={{
                    fontFamily: '"IBM Plex Mono", monospace',
                    fontSize: '0.6rem',
                    color: 'var(--text-tertiary)',
                    fontWeight: 500,
                    letterSpacing: '0.06em',
                  }}
                >
                  Throughput History
                </p>
                <HorizontalSparkline
                  data={model.throughputHistory}
                  color={statusColor}
                  width={200}
                  height={32}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
