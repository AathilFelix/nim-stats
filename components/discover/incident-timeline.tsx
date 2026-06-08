"use client";

import type { Incident } from "@/lib/operational-types";

interface Props {
  incidents: Incident[];
}

const SEVERITY_CONFIG: Record<
  string,
  { color: string; bg: string; border: string; label: string }
> = {
  critical: {
    color: "#ef4444",
    bg: "rgba(239,68,68,0.1)",
    border: "rgba(239,68,68,0.25)",
    label: "CRIT",
  },
  warning: {
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.1)",
    border: "rgba(245,158,11,0.25)",
    label: "WARN",
  },
  info: {
    color: "#10b981",
    bg: "rgba(16,185,129,0.1)",
    border: "rgba(16,185,129,0.25)",
    label: "INFO",
  },
};

const severityOrder: Record<string, number> = {
  critical: 0,
  warning: 1,
  info: 2,
};

export function IncidentTimeline({ incidents }: Props) {
  const sorted = [...incidents].sort(
    (a, b) =>
      (severityOrder[a.severity] ?? 2) - (severityOrder[b.severity] ?? 2) ||
      b.time.localeCompare(a.time),
  );
  const display = sorted.slice(0, 12);

  if (display.length === 0) {
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
          Incident Timeline
        </p>
        <div
          className="p-6 text-center"
          style={{
            backgroundColor: 'var(--surface-card)',
            border: '1px solid var(--border-base)',
            borderRadius: '0.5rem',
          }}
        >
          <span
            className="inline-block w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: '#10b981' }}
          />
          <p
            mt-2
            className="text-text-tertiary"
            style={{
              fontFamily: '"IBM Plex Mono", monospace',
              fontSize: '0.7rem',
            }}
          >
            No incidents recorded in current window
          </p>
        </div>
      </div>
    );
  }

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
        Incident Timeline
      </p>
      <div
        style={{
          backgroundColor: 'var(--surface-card)',
          border: '1px solid var(--border-base)',
          borderRadius: '0.5rem',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            borderTop: '1px solid var(--border-base)',
          }}
        >
          {display.map((inc, idx) => {
            const sev = SEVERITY_CONFIG[inc.severity] ?? SEVERITY_CONFIG.info;
            return (
              <div
                key={inc.id}
                className="flex items-start gap-3 px-4 py-2.5"
                style={{
                  borderBottom:
                    idx < display.length - 1
                      ? '1px solid var(--border-subtle)'
                      : 'none',
                  transitionProperty: 'background-color',
                  transitionDuration: '150ms',
                }}
              >
                <span
                  className="mt-1.5 shrink-0"
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: sev.color,
                    boxShadow: `0 0 6px ${sev.color}`,
                  }}
                />
                <div className="min-w-0 flex-1">
                  <p
                    className="leading-snug"
                    style={{
                      fontFamily: '"IBM Plex Sans", sans-serif',
                      fontSize: '0.75rem',
                      color: 'var(--text-primary)',
                      fontWeight: 500,
                    }}
                  >
                    {inc.message}
                  </p>
                  <p
                    className="mt-0.5"
                    style={{
                      fontFamily: '"IBM Plex Mono", monospace',
                      fontSize: '0.65rem',
                      color: 'var(--text-tertiary)',
                      letterSpacing: '-0.01em',
                    }}
                  >
                    {inc.time}
                  </p>
                </div>
                <span
                  className="shrink-0 px-1.5 py-0.5 rounded-sm uppercase"
                  style={{
                    fontFamily: '"IBM Plex Mono", monospace',
                    fontSize: '0.6rem',
                    fontWeight: 600,
                    letterSpacing: '0.08em',
                    color: sev.color,
                    backgroundColor: sev.bg,
                    border: `1px solid ${sev.border}`,
                  }}
                >
                  {sev.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
