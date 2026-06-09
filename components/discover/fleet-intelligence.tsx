"use client";

import { useMemo } from "react";
import type { NIMModel } from "../dashboard/mock-data";
import {
  StatusDotCircle,
  SurfaceCard,
  SectionLabel,
} from "./discover-primitives";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface Props {
  models: NIMModel[];
  incidents: Array<{ id: string; severity: string }>;
}

export function FleetIntelligence({ models, incidents }: Props) {
  const stats = useMemo(() => {
    const healthy = models.filter((m) => m.status === "healthy").length;
    const busy = models.filter((m) => m.status === "busy").length;
    const jammed = models.filter((m) => m.status === "jammed").length;
    const avgReliability =
      Math.round(
        models.reduce((acc, m) => acc + m.reliability, 0) / models.length,
      ) / 100;
    const avgCongestion = Math.round(
      models.reduce((acc, m) => acc + m.congestion, 0) / models.length,
    );
    const degraded = busy + jammed;
    const activeIncidents = incidents.filter(
      (i) => i.severity === "critical" || i.severity === "warning",
    ).length;

    const congestionState =
      avgCongestion > 60
        ? "Elevated"
        : avgCongestion > 35
          ? "Moderate"
          : "Nominal";

    return {
      healthy,
      degraded,
      avgReliability,
      avgCongestion,
      congestionState,
      activeIncidents,
      total: models.length,
    };
  }, [models, incidents]);

  return (
    <SurfaceCard className="px-3 py-2">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <StatusDotCircle status={stats.degraded > 0 ? "busy" : "healthy"} />
          <span
            className={cn(
              "text-[10px] font-bold uppercase tracking-[0.1em] font-mono",
              stats.degraded > 0
                ? "text-amber-600 dark:text-amber-400"
                : "text-emerald-600 dark:text-emerald-400",
            )}
          >
            {stats.degraded > 0 ? "Degraded" : "Fleet Healthy"}
          </span>
        </div>

        <Separator orientation="vertical" className="h-3" />

        <span className="text-[10px] font-mono tracking-tight text-foreground">
          <span className="text-muted-foreground mr-1.5">endpoints</span>
          <span className="font-semibold">{stats.total}</span>
        </span>

        <Separator orientation="vertical" className="h-3" />

        <span className="text-[10px] font-mono tracking-tight text-foreground">
          <span className="text-muted-foreground mr-1.5">reliability</span>
          <span className="font-semibold">{(stats.avgReliability * 100).toFixed(1)}%</span>
        </span>

        <Separator orientation="vertical" className="h-3" />

        <span className="text-[10px] font-mono tracking-tight text-foreground">
          <span className="text-muted-foreground mr-1.5">congestion</span>
          <span
            className={cn(
              "font-semibold",
              stats.avgCongestion > 60
                ? "text-red-600 dark:text-red-400"
                : stats.avgCongestion > 35
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-foreground",
            )}
          >
            {stats.congestionState}
          </span>
        </span>

        {stats.degraded > 0 && (
          <>
            <Separator orientation="vertical" className="h-3" />
            <span className="text-[10px] font-mono tracking-tight text-foreground">
              <span className="text-muted-foreground mr-1.5">degraded</span>
              <span className="font-semibold text-red-600 dark:text-red-400">
                {stats.degraded}
              </span>
            </span>
          </>
        )}

        {stats.activeIncidents > 0 && (
          <>
            <Separator orientation="vertical" className="h-3" />
            <span className="text-[10px] font-mono tracking-tight text-foreground">
              <span className="text-muted-foreground mr-1.5">incidents</span>
              <span className="font-semibold text-red-600 dark:text-red-400">
                {stats.activeIncidents}
              </span>
            </span>
          </>
        )}
      </div>
    </SurfaceCard>
  );
}
