"use client";

import type { NIMModel } from "../dashboard/mock-data";

interface Props {
  models: NIMModel[];
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function cellBg(score: number): string {
  if (score >= 99.5) return "rgba(16,185,129,0.3)";
  if (score >= 99) return "rgba(16,185,129,0.15)";
  if (score >= 98) return "rgba(245,158,11,0.15)";
  return "rgba(239,68,68,0.15)";
}

function cellBorder(score: number): string {
  if (score >= 99.5) return "rgba(16,185,129,0.4)";
  if (score >= 99) return "rgba(16,185,129,0.2)";
  if (score >= 98) return "rgba(245,158,11,0.2)";
  return "rgba(239,68,68,0.2)";
}

function cellColor(score: number): string {
  if (score >= 99.5) return "#10b981";
  if (score >= 99) return "#10b981";
  if (score >= 98) return "#f59e0b";
  return "#ef4444";
}

function hashDayScore(modelId: string, dayIndex: number): number {
  let h = 0;
  const str = modelId + dayIndex;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  }
  const base = 95 + (Math.abs(h) % 5);
  const swing = (Math.abs(h * 7) % 3) - 1;
  return Math.min(100, Math.max(90, base + swing));
}

export function ReliabilityHeatmap({ models }: Props) {
  const rows = models.map((m) => ({
    model: m,
    scores: DAYS.map((_, i) => hashDayScore(m.id, i)),
  }));

  return (
    <div className="space-y-3">
      <p
        className="uppercase tracking-wider"
        style={{
          fontFamily: '"IBM Plex Mono", monospace',
          fontSize: '0.6rem',
          color: 'var(--text-tertiary)',
          letterSpacing: '0.12em',
          fontWeight: 600,
        }}
      >
        Reliability Heatmap (7d)
      </p>
      <div
        className="overflow-x-auto p-4"
        style={{
          backgroundColor: 'var(--surface-card)',
          border: '1px solid var(--border-base)',
          borderRadius: '0.5rem',
        }}
      >
        <div
          className="flex items-center gap-1 mb-2 min-w-[260px]"
          style={{ height: '20px' }}
        >
          <span className="w-20 shrink-0" />
          {DAYS.map((d) => (
            <span
              key={d}
              className="flex-1 text-center"
              style={{
                fontFamily: '"IBM Plex Mono", monospace',
                fontSize: '0.55rem',
                color: 'var(--text-tertiary)',
                fontWeight: 600,
                letterSpacing: '0.06em',
              }}
            >
              {d}
            </span>
          ))}
        </div>
        {rows.map(({ model, scores }, rowIdx) => (
          <div
            key={model.id}
            className="flex items-center gap-1 mb-1 min-w-[260px]"
            style={{
              borderBottom: rowIdx < rows.length - 1 ? '1px solid var(--border-subtle)' : 'none',
              paddingBottom: rowIdx < rows.length - 1 ? '4px' : '0',
            }}
          >
            <span
              className="w-20 shrink-0 truncate"
              style={{
                fontFamily: '"IBM Plex Sans", sans-serif',
                fontSize: '0.7rem',
                color: 'var(--text-secondary)',
                fontWeight: 500,
              }}
            >
              {model.name}
            </span>
            {scores.map((score, i) => (
              <div key={i} className="flex-1 flex justify-center">
                <div
                  className="flex items-center justify-center rounded-sm"
                  style={{
                    width: '100%',
                    height: '20px',
                    backgroundColor: cellBg(score),
                    border: `1px solid ${cellBorder(score)}`,
                  }}
                >
                  <span
                    className="tabular-nums"
                    style={{
                      fontFamily: '"IBM Plex Mono", monospace',
                      fontSize: '0.55rem',
                      fontWeight: 600,
                      color: cellColor(score),
                    }}
                  >
                    {score.toFixed(1)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ))}
        <div
          className="flex items-center gap-2 mt-3"
          style={{ height: '16px' }}
        >
          <span
            className="tabular-nums"
            style={{
              fontFamily: '"IBM Plex Mono", monospace',
              fontSize: '0.55rem',
              color: 'var(--text-tertiary)',
            }}
          >
            99.5%+
          </span>
          <div className="flex gap-0.5">
            <HeatmapLegend color="#10b981" bg="rgba(16,185,129,0.3)" />
            <HeatmapLegend color="#10b981" bg="rgba(16,185,129,0.15)" />
            <HeatmapLegend color="#f59e0b" bg="rgba(245,158,11,0.15)" />
            <HeatmapLegend color="#ef4444" bg="rgba(239,68,68,0.15)" />
          </div>
          <span
            className="tabular-nums"
            style={{
              fontFamily: '"IBM Plex Mono", monospace',
              fontSize: '0.55rem',
              color: 'var(--text-tertiary)',
            }}
          >
            {"<"}98%
          </span>
        </div>
      </div>
    </div>
  );
}

function HeatmapLegend({ color, bg }: { color: string; bg: string }) {
  return (
    <div
      className="rounded-sm"
      style={{
        width: '14px',
        height: '14px',
        backgroundColor: bg,
        border: `1px solid ${color}33`,
      }}
    />
  );
}
