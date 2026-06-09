"use client";

import { useMemo } from "react";
import type { NIMModel } from "../dashboard/mock-data";
import {
  SurfaceCard,
  SectionLabel,
  GradeBadge,
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
}

const GRADE_PALETTE: Record<string, string> = {
  A: "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400",
  B: "bg-sky-500/10 border-sky-500/30 text-sky-600 dark:text-sky-400",
  C: "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400",
  D: "bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400",
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
        const avgUptime =
          Math.round(
            (group.reduce((s, m) => s + m.uptime, 0) / group.length) * 100,
          ) / 100;
        const degraded = group.filter((m) => m.status !== "healthy").length;
        let grade: ProviderRow["grade"] = "A";
        if (degraded >= 2 || avgCongestion > 60) grade = "D";
        else if (degraded > 0 || avgCongestion > 45) grade = "C";
        else if (avgCongestion > 30) grade = "B";
        return {
          name,
          count: group.length,
          avgCongestion,
          avgUptime,
          degradedCount: degraded,
          grade,
        };
      })
      .sort((a, b) => a.grade.localeCompare(b.grade));
  }, [models]);

  if (!providers.length) {
    return <span className="text-muted-foreground text-xs">No provider data.</span>;
  }

  return (
    <SurfaceCard>
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <SectionLabel>Provider Intelligence</SectionLabel>
        <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground font-mono">
          {providers.length} providers
        </span>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-10 text-center align-middle">
                <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground font-mono">
                  GRD
                </span>
              </TableHead>
              <TableHead className="min-w-[140px]">
                <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground font-mono">
                  Provider
                </span>
              </TableHead>
              <TableHead className="text-right w-20">
                <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground font-mono">
                  Model
                </span>
              </TableHead>
              <TableHead className="text-right w-20">
                <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground font-mono">
                  Cong.
                </span>
              </TableHead>
              <TableHead className="text-right w-20">
                <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground font-mono">
                  Uptime
                </span>
              </TableHead>
              <TableHead className="text-right w-16">
                <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground font-mono">
                  Deg.
                </span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {providers.map((p) => {
              const palette = GRADE_PALETTE[p.grade] ?? GRADE_PALETTE.B;
              return (
                <TableRow key={p.name} className="h-12">
                  <TableCell className="text-center align-middle">
                    <GradeBadge grade={p.grade} />
                  </TableCell>
                  <TableCell>
                    <span className="font-semibold text-sm text-foreground">
                      {p.name}
                    </span>
                  </TableCell>
                  <TableCell className="text-right tabular-nums font-mono text-sm text-foreground">
                    {p.count}
                  </TableCell>
                  <TableCell className="text-right tabular-nums font-mono text-sm">
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
                  <TableCell className="text-right tabular-nums font-mono text-sm text-foreground">
                    {p.avgUptime.toFixed(2)}%
                  </TableCell>
                  <TableCell className="text-right">
                    <span
                      className={
                        p.degradedCount > 0
                          ? "font-bold text-destructive"
                          : "font-mono text-sm text-foreground"
                      }
                    >
                      {p.degradedCount}
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
