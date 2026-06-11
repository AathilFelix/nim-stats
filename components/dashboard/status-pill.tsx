"use client";

import { type StatusKey } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

// Theme-aware: resolve to the live status CSS variables so pills track both
// the dark and light palettes.
const STATUS_VAR: Record<StatusKey, string> = {
  healthy: "var(--status-healthy)",
  busy: "var(--status-warn)",
  jammed: "var(--status-critical)",
};

export function StatusPill({ status, size = "md" }: StatusPillProps) {
  const color = STATUS_VAR[status];
  const sizeClasses = size === "sm" ? "px-2 py-0.5 gap-1" : "px-2.5 py-1 gap-1.5";
  const dotSize = size === "sm" ? "w-1 h-1" : "w-1.5 h-1.5";

  return (
    <span
      role="status"
      aria-label={`${status} status`}
      className={cn(
        "inline-flex items-center rounded-full label-xs border",
        sizeClasses,
      )}
      style={{
        backgroundColor: `color-mix(in srgb, ${color} 11%, transparent)`,
        borderColor: `color-mix(in srgb, ${color} 26%, transparent)`,
        color,
      }}
    >
      <span
        className={cn("rounded-full shrink-0", dotSize)}
        style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}` }}
        aria-hidden="true"
      />
      {status}
    </span>
  );
}

interface StatusPillProps {
  status: StatusKey;
  size?: "sm" | "md";
}
