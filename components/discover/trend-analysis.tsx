"use client";

import type { NIMModel } from "../dashboard/mock-data";

interface Props {
  models: NIMModel[];
}

interface DeltaProps {
  label: string;
  entries: NIMModel[];
  accent: string;
}

export function TrendAnalysis({ models }: Props) {
  const improved = [...models]
    .sort((a, b) => b.reliability - a.reliability)
    .slice(0, 3);
  const degraded = models
    .filter((m) => m.status === "jammed" || m.congestion > 60)
    .slice(0, 3);
  const rising = models
    .filter(
      (m) =>
        m.congestionTrend === "worsening" || m.congestionTrend === "rapidly_increasing",
    )
    .slice(0, 3);
  const recovering = models
    .filter((m) => m.congestionTrend === "improving" && m.status === "healthy")
    .slice(0, 3);

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
        Trend Analysis
      </p>
      <div
        className="grid grid-cols-2 gap-1.5"
        style={{ border: '1px solid var(--border-base)', borderRadius: '0.5rem' }}
      >
        <DeltaSection label="Most Improved" entries={improved} accent="emerald" />
        <DeltaSection label="Most Degraded" entries={degraded} accent="red" />
        <DeltaSection label="Rising Congestion" entries={rising} accent="amber" />
        <DeltaSection label="Recovery Leaders" entries={recovering} accent="emerald" />
      </div>
    </div>
  );
}

function DeltaSection({ label, entries, accent }: DeltaProps) {
  const accentColor = accent === "emerald" ? "#10b981" : accent === "amber" ? "#f59e0b" : "#ef4444";

  return (
    <div
      className="p-3"
      style={{ borderBottom: undefined, borderRight: undefined }}
    >
      <div className="flex items-center gap-1.5 mb-2">
        <span
          className="uppercase tracking-wider"
          style={{
            fontFamily: '"IBM Plex Mono", monospace',
            fontSize: '0.55rem',
            color: accentColor,
            letterSpacing: '0.1em',
            fontWeight: 600,
          }}
        >
          {label}
        </span>
      </div>
      {entries.length === 0 ? (
        <p
          className="text-text-tertiary"
          style={{
            fontFamily: '"IBM Plex Mono", monospace',
            fontSize: '0.65rem',
          }}
        >
          No data
        </p>
      ) : (
        <div className="space-y-1">
          {entries.map((m) => (
            <div
              key={m.id}
              className="flex items-center justify-between py-1 px-2 rounded-sm"
              style={{
                backgroundColor: 'var(--surface-recessed)',
              }}
            >
              <span
                className="truncate"
                style={{
                  fontFamily: '"IBM Plex Sans", sans-serif',
                  fontSize: '0.7rem',
                  color: 'var(--text-primary)',
                  fontWeight: 500,
                }}
              >
                {m.name}
              </span>
              <span
                className="tabular-nums ml-2 shrink-0"
                style={{
                  fontFamily: '"IBM Plex Mono", monospace',
                  fontSize: '0.6rem',
                  color: 'var(--text-tertiary)',
                }}
              >
                {m.provider}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
