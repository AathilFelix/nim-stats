"use client";

import { useMemo } from "react";
import { Server } from "lucide-react";
import type { NIMModel } from "../dashboard/mock-data";
import {
  GradeBadge, MiniBar, SignalStrength,
} from "./discover-primitives";
import { PanelHeader } from "./ops-primitives";

interface ProviderRow {
  name: string;
  count: number;
  avgCongestion: number;
  avgUptime: number;
  degradedCount: number;
  grade: "A" | "B" | "C" | "D";
  routingLevel: 1 | 2 | 3;
  recoveryAvg: string;
}

function confidenceLevel(v: string): 1 | 2 | 3 {
  if (v === "high_confidence") return 3;
  if (v === "moderate_confidence") return 2;
  return 1;
}

function congColor(v: number): string {
  if (v > 60) return "var(--status-critical)";
  if (v > 45) return "var(--status-warn)";
  return "var(--status-healthy)";
}

function uptimeColor(v: number): string {
  if (v < 99.5) return "var(--status-critical)";
  if (v < 99.9) return "var(--status-warn)";
  return "var(--status-healthy)";
}

export function ProviderIntelligence({ models }: { models: NIMModel[] }) {
  const providers = useMemo(() => {
    const map = new Map<string, NIMModel[]>();
    models.forEach((m) => {
      const arr = map.get(m.provider) ?? [];
      arr.push(m);
      map.set(m.provider, arr);
    });
    return Array.from(map.entries())
      .map(([name, group]) => {
        const avgCongestion = Math.round(group.reduce((s, m) => s + m.congestion, 0) / group.length);
        const avgUptime = group.reduce((s, m) => s + m.uptime, 0) / group.length;
        const degraded = group.filter((m) => m.status !== "healthy").length;
        let grade: ProviderRow["grade"] = "A";
        if (degraded >= 2 || avgCongestion > 60) grade = "D";
        else if (degraded > 0 || avgCongestion > 45) grade = "C";
        else if (avgCongestion > 30) grade = "B";

        const levels = group.map((m) => confidenceLevel(m.routingConfidence));
        const avgLevel = Math.round(levels.reduce((a, b) => a + b, 0) / levels.length) as 1 | 2 | 3;

        const recovering = group.filter((m) => m.congestionTrend === "improving" && m.status === "healthy").length;
        return {
          name, count: group.length, avgCongestion,
          avgUptime: Math.round(avgUptime * 100) / 100,
          degradedCount: degraded, grade,
          routingLevel: avgLevel,
          recoveryAvg: `${recovering}/${group.length}`,
        };
      })
      .sort((a, b) => a.grade.localeCompare(b.grade));
  }, [models]);

  const totalDegraded = models.filter((m) => m.status !== "healthy").length;

  if (!providers.length) {
    return (
      <section className="ops-card">
        <PanelHeader label="Provider Intelligence" icon={Server} tone="info" />
        <div className="py-8 text-center text-text-tertiary body-xs">No provider data.</div>
      </section>
    );
  }

  return (
    <section className="ops-card">
      <PanelHeader
        label="Provider Intelligence"
        icon={Server}
        tone="info"
        meta={
          <span className="metric-xs">
            {providers.length} providers · {models.length} models{totalDegraded > 0 ? ` · ${totalDegraded} degraded` : ""}
          </span>
        }
      />

      {/* Column header */}
      <div className="grid grid-cols-[40px_1fr_40px_72px_72px_36px_48px_64px] gap-2 px-4 py-2 border-b border-border-subtle bg-surface-recessed">
        <span />
        <span className="text-xs font-bold uppercase tracking-[0.10em] text-[--text-tertiary] font-mono">Provider</span>
        <span className="text-right text-xs font-bold uppercase tracking-[0.10em] text-[--text-tertiary] font-mono">M</span>
        <span className="text-right text-xs font-bold uppercase tracking-[0.10em] text-[--text-tertiary] font-mono">Congestion</span>
        <span className="text-right text-xs font-bold uppercase tracking-[0.10em] text-[--text-tertiary] font-mono">Uptime</span>
        <span className="text-center text-xs font-bold uppercase tracking-[0.10em] text-[--text-tertiary] font-mono">Deg</span>
        <span className="text-center text-xs font-bold uppercase tracking-[0.10em] text-[--text-tertiary] font-mono">Route</span>
        <span className="text-right text-xs font-bold uppercase tracking-[0.10em] text-[--text-tertiary] font-mono">Recovery</span>
      </div>

      {/* Rows */}
      <div className="divide-y divide-border-subtle">
        {providers.map((p) => (
          <div key={p.name} className="grid grid-cols-[40px_1fr_40px_72px_72px_36px_48px_64px] gap-2 items-center px-4 py-2.5 transition-colors duration-150 hover:bg-surface-recessed border-l-2 border-transparent hover:border-l-[var(--text-accent)]">
            <GradeBadge grade={p.grade} />
            <span className="text-sm font-medium text-[--text-primary] truncate">{p.name}</span>
            <span className="text-right text-sm font-mono tabular-nums text-[--text-primary]">{p.count}</span>
            <div>
              <span className="text-sm font-mono tabular-nums text-[--text-primary]">{p.avgCongestion}%</span>
              <MiniBar value={p.avgCongestion} color={congColor(p.avgCongestion)} />
            </div>
            <div>
              <span className="text-sm font-mono tabular-nums text-[--text-primary]">{p.avgUptime.toFixed(2)}%</span>
              <MiniBar value={p.avgUptime} max={100} color={uptimeColor(p.avgUptime)} />
            </div>
            <span className={`text-center text-sm font-mono tabular-nums ${p.degradedCount > 0 ? "text-[--status-critical] font-semibold" : "text-[--text-primary]"}`}>
              {p.degradedCount}
            </span>
            <div className="flex justify-center">
              <SignalStrength level={p.routingLevel} />
            </div>
            <span className="text-right text-sm font-mono tabular-nums text-[--text-primary]">{p.recoveryAvg}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
