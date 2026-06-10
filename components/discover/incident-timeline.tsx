"use client";

import { useMemo } from "react";
import { AlertOctagon, AlertTriangle, Info, CheckCircle2 } from "lucide-react";
import type { NIMModel } from "../dashboard/mock-data";
import { SurfaceCard, SectionLabel, SeverityLine } from "./discover-primitives";
import { cn } from "@/lib/utils";

type Severity = "critical" | "warning" | "info";

interface TimelineItem {
  id: string;
  severity: Severity;
  title: string;
  provider: string;
  time: string;
  status: string;
  message: string;
}

function severityIcon(severity: Severity): React.ElementType {
  if (severity === "critical") return AlertOctagon;
  if (severity === "warning") return AlertTriangle;
  return Info;
}

function severityColor(severity: Severity): string {
  if (severity === "critical") return "text-[--status-critical]";
  if (severity === "warning") return "text-[--status-warn]";
  return "text-[--status-info]";
}

function formatAge(iso: string): string {
  const age = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(age / 60000);
  if (mins < 1) return "< 1m ago";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function ageOpacity(iso: string): number {
  const age = Date.now() - new Date(iso).getTime();
  const mins = age / 60000;
  if (mins < 10) return 1;
  if (mins < 60) return 0.8;
  if (mins < 240) return 0.6;
  return 0.4;
}

export function IncidentTimeline({ models }: { models: NIMModel[] }) {
  const items: TimelineItem[] = useMemo(() => {
    const out: TimelineItem[] = [];
    models.forEach((m) => {
      const sev: Severity = m.status === "jammed" ? "critical" : m.status === "busy" ? "warning" : "info";
      if (sev === "info") return;
      out.push({
        id: m.id,
        severity: sev,
        title: m.name,
        provider: m.provider,
        time: new Date(Date.now() - m.lastChecked.getTime()).toISOString(),
        status: m.status,
        message: m.status === "jammed"
          ? "Congestion spike detected — consider failover"
          : "Throughput degradation on primary endpoint",
      });
    });
    return out.sort((a, b) => {
      const order: Record<Severity, number> = { critical: 0, warning: 1, info: 2 };
      return order[a.severity] - order[b.severity];
    });
  }, [models]);

  if (!items.length) {
    return (
      <SurfaceCard className="p-4">
        <div className="flex items-center justify-between mb-3">
          <SectionLabel>Incident Timeline</SectionLabel>
        </div>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <CheckCircle2 className="w-8 h-8 text-[--status-healthy] mb-2" />
          <p className="text-sm font-medium text-[--status-healthy] mb-1">All systems nominal</p>
          <p className="text-xs font-mono text-[--text-tertiary]">No active incidents detected.</p>
        </div>
      </SurfaceCard>
    );
  }

  return (
    <SurfaceCard className="p-4">
      <div className="flex items-center justify-between mb-3">
        <SectionLabel>Incident Timeline</SectionLabel>
        <span className="text-xs font-bold uppercase tracking-[0.10em] text-[--status-critical] font-mono">
          {items.length} active
        </span>
      </div>

      <div className="space-y-1">
        {items.map((item) => {
          const Icon = severityIcon(item.severity);
          return (
            <SeverityLine key={item.id} severity={item.severity}>
              <div
                className="flex items-center gap-2.5 py-2.5 px-3 transition-colors duration-150 hover:bg-[--surface-recessed] rounded-r-lg"
                style={{ opacity: ageOpacity(item.time) }}
              >
                <Icon className={cn("w-3.5 h-3.5 shrink-0", severityColor(item.severity))} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-[--text-primary] truncate">{item.message}</div>
                  <div className="text-[10px] font-mono text-[--text-tertiary] mt-0.5">
                    {item.title} &middot; {item.provider}
                  </div>
                </div>
                <span className="text-xs font-mono text-[--text-tertiary] shrink-0">
                  {formatAge(item.time)}
                </span>
              </div>
            </SeverityLine>
          );
        })}
      </div>
    </SurfaceCard>
  );
}
