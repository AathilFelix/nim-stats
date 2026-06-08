"use client";

import { type StatusKey, STATUS_HEX, STATUS_GLOW_BASE } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

interface StatusPillProps {
  status: StatusKey;
  size?: "sm" | "md";
}

export function StatusPill({ status, size = "md" }: StatusPillProps) {
  const color = STATUS_HEX[status];
  const sizeClasses = size === "sm" ? "px-2 py-0.5 gap-1" : "px-2.5 py-1 gap-1.5";
  const dotSize = size === "sm" ? "w-1 h-1" : "w-1.5 h-1.5";

  return (
    <span
      role="status"
      aria-label={`${status} status`}
      className={cn(
        "inline-flex items-center rounded-full text-[11px] font-medium border",
        sizeClasses,
      )}
      style={{
        backgroundColor: `${color}14`,
        borderColor: `${color}30`,
        color: `${color}cc`,
      }}
    >
      <span
        className={cn("rounded-full shrink-0", dotSize)}
        style={{
          backgroundColor: color,
          boxShadow: `${STATUS_GLOW_BASE.replace("8px", "6px")} ${color}`,
        }}
        aria-hidden="true"
      />
      {status}
    </span>
  );
}
