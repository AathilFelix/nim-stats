"use client";

import { useMemo } from "react";
import type { NIMModel } from "../dashboard/mock-data";
import {
  SurfaceCard,
  SectionLabel,
  MiniStatRow,
} from "./discover-primitives";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface ProviderRow {
  name: string;
  count: number;
  avgCongestion: number;
  avgUptime: number;
  degradedCount: number;
  grade: "A" | "B" | "C" | "D";
  routingConfidence: string;
  recoveryAvg: string;
}

const CONFIDENCE_TOKEN: Record<string, string> = {
  high_confidence: "text-emerald-600 dark:text-emerald-400",
  moderate_confidence: "text-amber-600 dark:text-amber-400",
  low_confidence: "text-red-600 dark:text-red-400",
};

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
        const avgUptime = Math.round(
          (group.reduce((s, m) => s + m.uptime, 0) / group.length) * 100,
        ) / 100;
        const degraded = group.filter((m) => m.status !== "healthy").length;
        let grade: ProviderRow["grade"] = "A";
        if (degraded >= 2 || avgCongestion > 60) grade = "D";
        else if (degraded > 0 || avgCongestion > 45) grade = "C";
        else if (avgCongestion > 30) grade = "B";

        const highCount = group.filter(
          (m) => m.routingConfidence === "high_confidence",
        ).length;
        const routingConfidence =
          highCount === group.length
            ? "high_confidence"
            : highCount > 0
              ? "moderate_confidence"
              : "low_confidence";

        const recovering = group.filter(
          (m) => m.congestionTrend === "improving" && m.status === "healthy",
        ).length;
        const recoveryAvg = `${recovering}/${group.length}`;

        return {
          name,
          count: group.length,
          avgCongestion,
          avgUptime,
          degradedCount: degraded,
          grade,
          routingConfidence,
          recoveryAvg,
        };
      })
      .sort((a, b) => a.grade.localeCompare(b.grade));
  }, [models]);

  if (!providers.length) {
    return <span className="text-muted-foreground text-xs">No provider data.</span>;
  }

  return (
    <SurfaceCard>
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <SectionLabel className="pl-0.5">Provider Intelligence</SectionLabel>
        <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground font-mono">
          {providers.length} providers
        </span>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="h-8">
              <TableHead className="w-8 text-center align-middle">
                <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-muted-foreground font-mono">
                  GRD
                </span>
              </TableHead>
              <TableHead className="min-w-[130px]">
                <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-muted-foreground font-mono">
                  Provider
                </span>
              </TableHead>
              <TableHead className="text-right w-14">
                <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-muted-foreground font-mono">
                  M
                </span>
              </TableHead>
              <TableHead className="text-right w-16">
                <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-muted-foreground font-mono">
                  Cong.
                </span>
              </TableHead>
              <TableHead className="text-right w-16">
                <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-muted-foreground font-mono">
                  Uptime
                </span>
              </TableHead>
              <TableHead className="text-right w-12">
                <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-muted-foreground font-mono">
                  Deg.
                </span>
              </TableHead>
              <TableHead className="w-[72px]">
                <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-muted-foreground font-mono">
                  Routing Trust
                </span>
              </TableHead>
              <TableHead className="w-[72px]">
                <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-muted-foreground font-mono">
                  Recovery
                </span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {providers.map((p) => {
              const confidenceClass =
                CONFIDENCE_TOKEN[p.routingConfidence] ?? "text-foreground";
              return (
                <TableRow key={p.name} className="h-9">
                  <TableCell className="text-center align-middle">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-sm text-[11px] font-bold font-mono border border-border bg-muted">
                      {p.grade}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs font-medium text-foreground truncate block">
                      {p.name}
                    </span>
                  </TableCell>
                  <TableCell className="text-right tabular-nums font-mono text-xs text-foreground">
                    {p.count}
                  </TableCell>
                  <TableCell className="text-right tabular-nums font-mono text-xs">
                    <span
                      className={
                        p.avgCongestion > 60
                          ? "text-destructive font-bold"
                          : p.avgCongestion > 45
                            ? "text-amber-600 dark:text-amber-400 font-bold"
                            : "text-foreground"
                      }
                    >
                      {p.avgCongestion}%
                    </span>
                  </TableCell>
                  <TableCell className="text-right tabular-nums font-mono text-xs text-foreground">
                    {p.avgUptime.toFixed(2)}%
                  </TableCell>
                  <TableCell className="text-right tabular-nums font-mono text-xs">
                    <span
                      className={
                        p.degradedCount > 0
                          ? "font-bold text-destructive"
                          : "text-foreground"
                      }
                    >
                      {p.degradedCount}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`block text-[10px] font-mono uppercase tracking-[0.06em] ${confidenceClass}`}
                    >
                      {p.routingConfidence.replace("_", " ")}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="block text-[11px] font-mono tabular-nums text-foreground">
                      {p.recoveryAvg}
                    </span>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </SurfaceCard>
  );
}
