"use client";

import { useMemo } from "react";
import type { FleetStateResult } from "@/lib/operational-types";
import { cn } from "@/lib/utils";

interface Props {
  state: FleetStateResult;
}

const STATE_META: Record<
  string,
  { label: string; color: string; bg: string; border: string }
> = {
  healthy: {
    label: "All Systems Operational",
    color: "#10b981",
    bg: "rgba(16, 185, 129, 0.04)",
    border: "rgba(16, 185, 129, 0.2)",
  },
  elevated_congestion: {
    label: "Elevated Congestion",
    color: "#f59e0b",
    bg: "rgba(245, 158, 11, 0.04)",
    border: "rgba(245, 158, 11, 0.2)",
  },
  partial_degradation: {
    label: "Partial Degradation",
    color: "#ef4444",
    bg: "rgba(239, 68, 68, 0.04)",
    border: "rgba(239, 68, 68, 0.2)",
  },
  recovery_in_progress: {
    label: "Recovery in Progress",
    color: "#3b82f6",
    bg: "rgba(59, 130, 246, 0.04)",
    border: "rgba(59, 130, 246, 0.2)",
  },
};

export function FleetStateBanner({ state }: Props) {
  const meta = STATE_META[state.state] ?? STATE_META.healthy;

  return (
    <div
      className="relative overflow-hidden"
      style={{
        backgroundColor: meta.bg,
        border: `1px solid ${meta.border}`,
        borderRadius: '0.5rem',
      }}
    >
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <div
            className="h-2 w-2 rounded-full shrink-0"
            style={{
              backgroundColor: meta.color,
              boxShadow: `0 0 8px ${meta.color}`,
            }}
          />
          <div>
            <p
              className="font-semibold tracking-tight"
              style={{
                fontFamily: '"IBM Plex Sans", sans-serif',
                fontSize: '0.875rem',
                color: meta.color,
              }}
            >
              {meta.label}
            </p>
            <p
              className="mt-0.5"
              style={{
                fontFamily: '"IBM Plex Mono", monospace',
                fontSize: '0.7rem',
                color: 'var(--text-tertiary)',
                letterSpacing: '-0.01em',
              }}
            >
              {state.detail}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p
            className="uppercase tracking-wider mb-0.5"
            style={{
              fontFamily: '"IBM Plex Mono", monospace',
              fontSize: '0.6rem',
              color: 'var(--text-tertiary)',
              letterSpacing: '0.1em',
              fontWeight: 600,
            }}
          >
            Degraded
          </p>
          <p
            className="tabular-nums font-bold"
            style={{
              fontFamily: '"IBM Plex Mono", monospace',
              fontSize: '1.125rem',
              color: state.degradedCount > 0 ? '#f59e0b' : meta.color,
              letterSpacing: '-0.01em',
            }}
          >
            {state.degradedCount}
          </p>
        </div>
      </div>
    </div>
  );
}
