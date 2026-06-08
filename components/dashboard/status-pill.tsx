"use client";

import { cn } from "@/lib/utils";
import { getStatusColor, getStatusBg, type ModelStatus } from "./mock-data";

interface StatusPillProps {
  status: ModelStatus;
}

export function StatusPill({ status }: StatusPillProps) {
  const color = getStatusColor(status);
  const bgClass = getStatusBg(status);
  const label = status === "jammed" ? "jammed" : status;

  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border", bgClass)}>
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}` }}
      />
      {label}
    </span>
  );
}

interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  className?: string;
}

export function MetricCard({ label, value, unit, trend, trendValue, className }: MetricCardProps) {
  const trendColor = trend === "up" ? "text-emerald-400" : trend === "down" ? "text-red-400" : "text-zinc-500";
  const trendIcon = trend === "up" ? "↑" : trend === "down" ? "↓" : "→";

  return (
    <div className={cn("rounded-xl bg-zinc-900/60 border border-zinc-800/60 p-4 backdrop-blur-sm", className)}>
      <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-2">{label}</p>
      <div className="flex items-baseline gap-1.5">
        <span className="text-2xl font-semibold text-zinc-100 tabular-nums tracking-tight">
          {value}
        </span>
        {unit && <span className="text-sm text-zinc-500 font-normal">{unit}</span>}
      </div>
      {trend && (
        <p className={cn("text-xs mt-1.5 font-medium flex items-center gap-0.5", trendColor)}>
          {trendIcon} {trendValue}
        </p>
      )}
    </div>
  );
}
