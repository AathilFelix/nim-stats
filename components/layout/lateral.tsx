"use client";

import { type NIMModel } from "../dashboard/mock-data";
import { IncidentFeed } from "../dashboard/incident-feed";
import { getStatusColor } from "../dashboard/mock-data";
import { cn } from "@/lib/utils";

interface LateralProps {
  models: NIMModel[];
  className?: string;
}

export function Lateral({ models, className }: LateralProps) {
  const healthy = models.filter((m) => m.status === "healthy").length;
  const busy = models.filter((m) => m.status === "busy").length;
  const jammed = models.filter((m) => m.status === "jammed").length;
  const avgThroughput = Math.round(models.reduce((acc, m) => acc + m.throughput, 0) / models.length);
  const avgUptime = (models.reduce((acc, m) => acc + m.uptime, 0) / models.length).toFixed(2);

  const bestModel = models.reduce((best, m) => (m.reliability >= best.reliability ? m : best), models[0]);

  return (
    <aside className={cn("w-full xl:w-[320px] flex flex-col gap-6", className)}>
      {/* Situation Summary */}
      <div className="space-y-4">
        <ZoneLabel>Situation</ZoneLabel>

        <div className="space-y-2">
          <HealthRow label="Healthy" count={healthy} color="emerald" />
          <HealthRow label="Busy" count={busy} color="amber" />
          {jammed > 0 && <HealthRow label="Jammed" count={jammed} color="red" />}
        </div>

        <div className="pt-3 border-t border-zinc-800/40 space-y-2">
          <StatRow label="avg throughput" value={`${avgThroughput} tok/s`} />
          <StatRow label="fleet uptime" value={`${avgUptime}%`} />
        </div>

        <div className="pt-3 border-t border-zinc-800/40">
          <p className="text-[10px] text-zinc-600 uppercase tracking-widest font-semibold mb-2">
            Recommended
          </p>
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-zinc-300 truncate">{bestModel.name}</p>
              <p className="text-[11px] text-zinc-600 truncate">{bestModel.provider}</p>
            </div>
            <StatusDot status={bestModel.status} />
          </div>
        </div>
      </div>

      <div className="h-px bg-zinc-800/40" />

      <div className="space-y-3">
        <ZoneLabel>In the Feed</ZoneLabel>
        <IncidentFeed models={models} maxItems={3} />
      </div>
    </aside>
  );
}

function ZoneLabel({ children }: { children: string }) {
  return (
    <p className="text-[10px] text-zinc-600 uppercase tracking-widest font-semibold">
      {children}
    </p>
  );
}

function HealthRow({ label, count, color }: { label: string; count: number; color: "emerald" | "amber" | "red" }) {
  const colors: Record<string, { dot: string; text: string }> = {
    emerald: { dot: "bg-emerald-400", text: "text-emerald-400" },
    amber: { dot: "bg-amber-400", text: "text-amber-400" },
    red: { dot: "bg-red-400", text: "text-red-400" },
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className={`w-1.5 h-1.5 rounded-full ${colors[color].dot}`} />
        <span className="text-xs text-zinc-400">{label}</span>
      </div>
      <span className={cn("text-sm font-semibold tabular-nums", colors[color].text)}>
        {count}
      </span>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[11px] text-zinc-600">{label}</span>
      <span className="text-xs text-zinc-400 tabular-nums">
        {value}
      </span>
    </div>
  );
}

function StatusDot({ status }: { status: string }) {
  const color = getStatusColor(status as any);
  return (
    <div
      className="w-2 h-2 rounded-full"
      style={{
        backgroundColor: color,
        boxShadow: `0 0 6px ${color}`,
      }}
    />
  );
}
