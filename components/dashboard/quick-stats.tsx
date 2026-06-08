"use client";

import { type NIMModel } from "./mock-data";

interface QuickStatsProps {
  models: NIMModel[];
}

export function QuickStats({ models }: QuickStatsProps) {
  const healthy = models.filter((m) => m.status === "healthy").length;
  const busy = models.filter((m) => m.status === "busy").length;
  const jammed = models.filter((m) => m.status === "jammed").length;
  const avgThroughput = Math.round(
    models.reduce((acc, m) => acc + m.throughput, 0) / models.length,
  );

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
      <StatCard label="Healthy" value={`${healthy}/${models.length}`} color="#10b981" />
      {busy > 0 && <StatCard label="Busy" value={String(busy)} color="#f59e0b" />}
      {jammed > 0 && (
        <StatCard label="Jammed" value={String(jammed)} color="#ef4444" pulse />
      )}
      <StatCard
        label="Avg throughput"
        value={`${avgThroughput}`}
        suffix="tok/s"
        color="neutral"
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  suffix,
  color,
  pulse,
}: {
  label: string;
  value: string;
  suffix?: string;
  color: string;
  pulse?: boolean;
}) {
  const hex = color === "neutral" ? "#a1a1aa" : color;

  return (
    <div className="rounded-xl border border-border-subtle bg-surface-card px-4 py-3 transition-colors duration-150 cursor-default hover:border-border-base hover:bg-surface-elevated">
      <div className="flex items-center justify-between">
        <span className="text-[22px] font-extrabold tabular-nums tracking-tight text-text-primary">
          {value}
          {suffix && (
            <span className="text-[11px] text-text-tertiary font-mono font-normal ml-1.5">
              {suffix}
            </span>
          )}
        </span>
        <span
          className="inline-block w-1.5 h-1.5 rounded-full shrink-0"
          style={{
            backgroundColor: hex,
            boxShadow: `0 0 6px ${hex}`,
            animation: pulse ? "pulse-soft 2s ease-in-out infinite" : undefined,
          }}
        />
      </div>
      <p className="text-[10px] text-text-tertiary uppercase tracking-[0.08em] font-bold mt-1">
        {label}
      </p>
    </div>
  );
}
