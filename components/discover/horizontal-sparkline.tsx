"use client";

import { useId } from "react";

interface HorizontalSparklineProps {
  data: number[];
  /** Any CSS color — hex or a `var(--token)`. Defaults to the accent. */
  color?: string;
  width?: number;
  height?: number;
  /** Draw the soft area fill under the line. */
  area?: boolean;
  /** Mark the latest sample with a dot. */
  showDot?: boolean;
  strokeWidth?: number;
  className?: string;
}

/**
 * Compact telemetry sparkline. Theme-aware: accepts CSS variables for color
 * and uses a stable, collision-free gradient id (via useId) so multiple
 * instances and `var(--token)` colors both work.
 */
export function HorizontalSparkline({
  data,
  color = "var(--text-accent)",
  width = 120,
  height = 28,
  area = true,
  showDot = false,
  strokeWidth = 1.5,
  className,
}: HorizontalSparklineProps) {
  const gradId = useId();
  if (!data || data.length < 2) return <span style={{ display: "inline-block", width, height }} className={className} />;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pad = strokeWidth + 1;

  const coords = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - pad * 2) - pad;
    return [x, y] as const;
  });

  const points = coords.map(([x, y]) => `${x},${y}`).join(" ");
  const areaPoints = `0,${height} ${points} ${width},${height}`;
  const last = coords[coords.length - 1];

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={`overflow-visible ${className ?? ""}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {area && (
        <>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.22" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          <polygon points={areaPoints} fill={`url(#${gradId})`} />
        </>
      )}
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      {showDot && (
        <circle cx={last[0]} cy={last[1]} r={strokeWidth + 0.6} fill={color} vectorEffect="non-scaling-stroke" />
      )}
    </svg>
  );
}
