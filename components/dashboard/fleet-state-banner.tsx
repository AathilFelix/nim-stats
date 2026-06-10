"use client";

import type { FleetStateResult } from "@/lib/operational-types";

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
            <p className="heading-md" style={{ color: meta.color }}>
              {meta.label}
            </p>
            <p className="metric-sm text-text-tertiary mt-0.5">{state.detail}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="label-sm text-text-tertiary mb-0.5">Degraded</p>
          <p
            className="metric-lg"
            style={{ color: state.degradedCount > 0 ? '#f59e0b' : meta.color }}
          >
            {state.degradedCount}
          </p>
        </div>
      </div>
    </div>
  );
}
