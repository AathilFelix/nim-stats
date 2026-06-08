"use client";

import { type NIMModel } from "./mock-data";
import { Card, CardContent } from "@/components/ui/card";

interface QuickStatsProps {
  models: NIMModel[];
}

export function QuickStats({ models }: QuickStatsProps) {
  const healthy = models.filter((m) => m.status === "healthy").length;
  const busy = models.filter((m) => m.status === "busy").length;
  const jammed = models.filter((m) => m.status === "jammed").length;
  const avgThroughput = Math.round(models.reduce((acc, m) => acc + m.throughput, 0) / models.length);
  const avgUptime = (models.reduce((acc, m) => acc + m.uptime, 0) / models.length).toFixed(2);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <StatCard label="Healthy" value={`${healthy}/${models.length}`} color="emerald" />
      {busy > 0 && <StatCard label="Busy" value={String(busy)} color="amber" />}
      {jammed > 0 && <StatCard label="Jammed" value={String(jammed)} color="red" />}
      <StatCard label="Avg throughput" value={`${avgThroughput} tok/s`} color="zinc" />
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color: "emerald" | "amber" | "red" | "zinc" }) {
  const colors: Record<string, { dot: string; text: string }> = {
    emerald: { dot: "bg-emerald-400", text: "text-emerald-400" },
    amber: { dot: "bg-amber-400", text: "text-amber-400" },
    red: { dot: "bg-red-400", text: "text-red-400" },
    zinc: { dot: "bg-zinc-400", text: "text-white" },
  };

  return (
    <Card className="bg-zinc-900/40 border-zinc-800/40">
      <CardContent className="p-4 flex items-center justify-between">
        <div>
          <p className="text-2xl font-bold tabular-nums tracking-tight text-white">{value}</p>
          <p className="text-[11px] text-zinc-500 uppercase tracking-wider font-medium mt-1">{label}</p>
        </div>
        <div className={`w-2 h-2 rounded-full ${colors[color].dot}`} style={color === "emerald" ? { boxShadow: "0 0 8px #10b981" } : color === "amber" ? { boxShadow: "0 0 8px #f59e0b" } : color === "red" ? { boxShadow: "0 0 8px #ef4444" } : undefined} />
      </CardContent>
    </Card>
  );
}
