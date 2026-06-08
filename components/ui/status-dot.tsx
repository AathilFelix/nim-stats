"use client";

import { type StatusKey, STATUS_GLOW_BASE, statusColor } from "@/lib/design-tokens";

interface StatusDotProps {
  status: StatusKey;
  size?: number;
  pulse?: boolean;
  className?: string;
}

export function StatusDot({ status, size = 7, pulse, className }: StatusDotProps) {
  const color = statusColor(status);
  return (
    <span
      className={["inline-block rounded-full shrink-0", className]
        .filter(Boolean)
        .join(" ")}
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        boxShadow: `${STATUS_GLOW_BASE} ${color}`,
        ...(pulse ? { animation: "pulse-soft 2s ease-in-out infinite" } : {}),
      }}
    />
  );
}
