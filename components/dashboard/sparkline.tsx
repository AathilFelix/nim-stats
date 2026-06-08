"use client";

interface SparklineProps {
  data: number[];
  color?: string;
  height?: number;
}

export function Sparkline({ data, color = "#10b981", height = 40 }: SparklineProps) {
  const width = 120;
  const padding = 2;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data
    .map((val, i) => {
      const x = padding + (i / (data.length - 1)) * (width - padding * 2);
      const y = height - padding - ((val - min) / range) * (height - padding * 2);
      return `${x},${y}`;
    })
    .join(" ");

  const areaPoints = `${padding},${height - padding} ${points} ${width - padding},${height - padding}`;

  const lastVal = data[data.length - 1];
  const prevVal = data[data.length - 2];
  const trendUp = lastVal >= prevVal;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <defs>
        <linearGradient id={`grad-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        points={areaPoints}
        fill={`url(#grad-${color.replace("#", "")})`}
        className="opacity-60"
      />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="opacity-90"
      />
      <circle
        cx={width - padding}
        cy={height - padding - ((lastVal - min) / range) * (height - padding * 2)}
        r="2.5"
        fill={color}
        className="opacity-80"
      />
      {trendUp ? (
        <text
          x={width - padding - 4}
          y={10}
          fill="#10b981"
          fontSize="8"
          fontFamily="ui-monospace, monospace"
        >
          ▲
        </text>
      ) : (
        <text
          x={width - padding - 4}
          y={10}
          fill="#ef4444"
          fontSize="8"
          fontFamily="ui-monospace, monospace"
        >
          ▼
        </text>
      )}
    </svg>
  );
}

interface UptimeBarProps {
  uptime: number;
}

export function UptimeBar({ uptime }: UptimeBarProps) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${uptime}%`,
            backgroundColor: uptime >= 99.9 ? "#10b981" : uptime >= 99.5 ? "#f59e0b" : "#ef4444",
          }}
        />
      </div>
      <span className="text-xs font-mono text-zinc-400 w-12 text-right tabular-nums">
        {uptime.toFixed(2)}%
      </span>
    </div>
  );
}

interface MiniMetricProps {
  value: string | number;
  label: string;
  highlight?: boolean;
}

export function MiniMetric({ value, label, highlight }: MiniMetricProps) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className={cn("text-sm font-semibold tabular-nums tracking-tight", highlight ? "text-emerald-400" : "text-zinc-200")}>
        {value}
      </span>
      <span className="text-[10px] text-zinc-600 uppercase tracking-widest font-medium">
        {label}
      </span>
    </div>
  );
}

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(" ");
}
