"use client";

import type { Incident } from "@/lib/operational-types";
import { StatusDotCircle, SectionLabel } from "./discover-primitives";
import { SurfaceCard } from "./discover-primitives";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface Props {
  incidents: Incident[];
}

const SEVERITY_CONFIG = {
  critical: { color: "#ef4444", label: "CRIT" },
  warning: { color: "#f59e0b", label: "WARN" },
  info: { color: "#10b981", label: "INFO" },
} as const;

const SEVERITY_ORDER: Record<string, number> = {
  critical: 0,
  warning: 1,
  info: 2,
};

export function IncidentTimeline({ incidents }: Props) {
  const sorted = [...incidents]
    .sort((a, b) => (SEVERITY_ORDER[a.severity] ?? 2) - (SEVERITY_ORDER[b.severity] ?? 2) || b.time.localeCompare(a.time))
    .slice(0, 12);

  if (sorted.length === 0) {
    return (
      <SurfaceCard>
        <SectionLabel className="px-4 pt-3">Incident Timeline</SectionLabel>
        <div className="flex items-center justify-center gap-2 py-6 text-muted-foreground">
          <StatusDotCircle status="healthy" />
          <p className="text-xs font-mono">No incidents recorded in current window</p>
        </div>
      </SurfaceCard>
    );
  }

  return (
    <SurfaceCard>
      <SectionLabel className="px-4 pt-3">Incident Timeline</SectionLabel>
      <div className="divide-y divide-border">
        {sorted.map((inc) => {
          const sev = SEVERITY_CONFIG[inc.severity as keyof typeof SEVERITY_CONFIG] ?? SEVERITY_CONFIG.info;
          return (
            <div key={inc.id} className="flex items-center gap-3 px-4 py-2.5 transition-colors duration-150 hover:bg-muted/50">
              <StatusDotCircle
                status={
                  inc.severity === "critical"
                    ? "jammed"
                    : inc.severity === "warning"
                      ? "busy"
                      : "healthy"
                }
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs leading-snug font-medium text-foreground">{inc.message}</p>
                <p className="text-[11px] text-muted-foreground font-mono mt-0.5">{inc.time}</p>
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span
                    className="shrink-0 cursor-help"
                  >
                    <Badge variant="outline">{sev.label}</Badge>
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="font-mono text-[10px] uppercase tracking-[0.1em]">{inc.severity}: {inc.message}</p>
                </TooltipContent>
              </Tooltip>
            </div>
          );
        })}
      </div>
    </SurfaceCard>
  );
}
