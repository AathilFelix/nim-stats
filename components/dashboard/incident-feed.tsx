"use client";

import type { Incident } from "@/lib/operational-types";
import { cn } from "@/lib/utils";

interface Props {
  incidents: Incident[];
}

const SEVERITY_STYLES: Record<
  string,
  { dot: string; label: string }
> = {
  critical: { dot: "#ef4444", label: "CRITICAL" },
  warning: { dot: "#f59e0b", label: "WARN" },
  info: { dot: "#10b981", label: "INFO" },
};

export function IncidentFeed({ incidents }: Props) {
  const display = incidents.slice(0, 6);

  return (
    <div
      className="overflow-hidden"
      style={{
        backgroundColor: 'var(--surface-card)',
        border: '1px solid var(--border-base)',
        borderRadius: '0.5rem',
      }}
    >
      <div
        className="flex items-center justify-between px-4 py-2.5"
        style={{
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
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
          Active Incidents
        </p>
        {incidents.length > 0 && (
          <span
            className="inline-flex h-5 min-w-5 items-center justify-center rounded-sm px-1"
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              color: '#ef4444',
              fontFamily: '"IBM Plex Mono", monospace',
              fontSize: '0.6rem',
              fontWeight: 600,
            }}
          >
            {incidents.length}
          </span>
        )}
      </div>

      <div className="p-2">
        {display.length === 0 ? (
          <div className="flex items-center gap-2 py-4 justify-center">
            <span
              className="h-1.5 w-1.5 rounded-full shrink-0 bg-emerald-500"
              aria-hidden="true"
            />
            <p
              className="text-xs"
              style={{
                fontFamily: '"IBM Plex Mono", monospace',
                fontSize: '0.7rem',
                color: 'var(--text-tertiary)',
              }}
            >
              No active incidents
            </p>
          </div>
        ) : (
          <div className="space-y-0.5">
            {display.map((inc) => {
              const sev = SEVERITY_STYLES[inc.severity] ?? SEVERITY_STYLES.info;
              return (
                <div
                  key={inc.id}
                  className="flex items-start gap-2.5 py-2 px-2 rounded-sm transition-colors duration-150 cursor-pointer"
                  style={{
                    borderBottom: '1px solid var(--border-subtle)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--surface-recessed)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full shrink-0 mt-1"
                    style={{
                      backgroundColor: sev.dot,
                      boxShadow: `0 0 4px ${sev.dot}`,
                    }}
                    aria-hidden="true"
                  />
                  <div className="min-w-0 flex-1">
                    <p
                      className="leading-snug text-text-primary"
                      style={{
                        fontFamily: '"IBM Plex Sans", sans-serif',
                        fontSize: '0.75rem',
                      }}
                    >
                      {inc.message}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <p
                        className="tabular-nums"
                        style={{
                          fontFamily: '"IBM Plex Mono", monospace',
                          fontSize: '0.65rem',
                          color: 'var(--text-tertiary)',
                        }}
                      >
                        {inc.time}
                      </p>
                      <span
                        className="px-1 py-0.5 rounded-sm uppercase tracking-wider"
                        style={{
                          fontFamily: '"IBM Plex Mono", monospace',
                          fontSize: '0.55rem',
                          fontWeight: 600,
                          letterSpacing: '0.06em',
                          color: sev.dot,
                          backgroundColor: `${sev.dot}15`,
                        }}
                      >
                        {sev.label}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
