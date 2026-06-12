"use client";

import { type NIMModel } from "@/components/dashboard/mock-data";
import { cn } from "@/lib/utils";

interface LateralProps {
  models: NIMModel[];
  className?: string;
}

export function Lateral({ models, className }: LateralProps) {
  const healthy = models.filter((m) => m.status === "healthy").length;
  const busy = models.filter((m) => m.status === "busy").length;
  const jammed = models.filter((m) => m.status === "jammed").length;
  const avgThroughput = Math.round(
    models.reduce((acc, m) => acc + m.throughput, 0) / models.length,
  );
  const avgUptime = (
    models.reduce((acc, m) => acc + m.uptime, 0) / models.length
  ).toFixed(2);
  const bestModel = models.reduce(
    (best, m) => (m.reliability >= best.reliability ? m : best),
    models[0],
  );

  return (
    <aside
      className={cn("w-full xl:w-[272px] flex flex-col gap-6", className)}
      aria-label="Fleet summary"
    >
      <ZoneLabel>Situation</ZoneLabel>

      <div className="space-y-2.5">
        <HealthRow label="Healthy" count={healthy} color="#10b981" />
        <HealthRow label="Busy" count={busy} color="#f59e0b" />
        {jammed > 0 && <HealthRow label="Jammed" count={jammed} color="#ef4444" />}
      </div>

      <div className="pt-3 border-t border-border-subtle space-y-2.5">
        <StatRow label="avg throughput" value={`${avgThroughput} tok/s`} />
        <StatRow label="fleet uptime" value={`${avgUptime}%`} />
      </div>

      <div className="pt-3 border-t border-border-subtle">
        <ZoneLabel>Recommended</ZoneLabel>
        <div className="flex items-center justify-between mt-2">
          <div className="min-w-0">
            <p className="text-[13px] font-bold text-text-primary truncate">
              {bestModel.name}
            </p>
            <p className="text-[11px] text-text-tertiary mt-0.5 truncate">
              {bestModel.provider}
            </p>
          </div>
          <span
            className="inline-block w-2 h-2 rounded-full shrink-0"
            style={{
              backgroundColor: getStatusColor(bestModel.status),
              boxShadow: `0 0 6px ${getStatusColor(bestModel.status)}`,
            }}
          />
        </div>
      </div>

      <div className="h-px bg-border-subtle" />

      <div className="space-y-3">
        <ZoneLabel>In the Feed</ZoneLabel>
        <IncidentFeed models={models} maxItems={4} />
      </div>
    </aside>
  );
}

function ZoneLabel({ children }: { children: string }) {
  return (
    <p className="text-[10px] text-text-tertiary uppercase tracking-[0.12em] font-bold">
      {children}
    </p>
  );
}

function HealthRow({
  label,
  count,
  color,
}: {
  label: string;
  count: number;
  color: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span
          className="inline-block w-1.5 h-1.5 rounded-full shrink-0"
          style={{ backgroundColor: color, boxShadow: `0 0 4px ${color}` }}
        />
        <span className="text-[12px] text-text-secondary">{label}</span>
      </div>
      <span
        className="text-[13px] font-bold tabular-nums"
        style={{ color }}
      >
        {count}
      </span>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[11px] text-text-tertiary">{label}</span>
      <span className="text-[12px] text-text-secondary font-mono tabular-nums">
        {value}
      </span>
    </div>
  );
}

function IncidentFeed({ models, maxItems }: { models: NIMModel[]; maxItems: number }) {
  const sorted = [...models].sort((a, b) => new Date(b.lastChecked).getTime() - new Date(a.lastChecked).getTime()).slice(0, maxItems);

  return (
    <div className="space-y-1.5">
      {sorted.map((m) => (
        <div key={m.id} className="flex items-start gap-2">
          <span
            className="inline-block w-1.5 h-1.5 rounded-full shrink-0 mt-1"
            style={{
              backgroundColor: getStatusColor(m.status),
              boxShadow: `0 0 4px ${getStatusColor(m.status)}`,
            }}
          />
          <div className="min-w-0">
            <p className="text-[11px] text-text-secondary truncate leading-tight">
              {m.name}
            </p>
            <p className="text-[10px] text-text-tertiary mt-0.5 font-mono tabular-nums">
              {formatTimeAgo(new Date(m.lastChecked))}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function getStatusColor(status: string): string {
  switch (status) {
    case "healthy":
      return "#10b981";
    case "busy":
      return "#f59e0b";
    case "jammed":
      return "#ef4444";
    default:
      return "#71717a";
  }
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  return `${Math.floor(seconds / 60)}m ago`;
}
