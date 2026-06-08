"use client";

import { type StatusKey, statusColor, STATUS_GLOW_BASE } from "@/lib/design-tokens";

interface GlowDotProps {
  status: StatusKey;
  size?: number;
  pulse?: boolean;
  className?: string;
}

export function GlowDot({ status, size = 7, pulse, className }: GlowDotProps) {
  return (
    <span
      aria-hidden
      className={["inline-block rounded-full shrink-0", pulse ? "animate-pulse-soft" : undefined, className]
        .filter(Boolean)
        .join(" ")}
      style={{
        width: size,
        height: size,
        backgroundColor: statusColor(status),
        boxShadow: `${STATUS_GLOW_BASE} ${statusColor(status)}`,
      }}
    />
  );
}
