"use client";

import { useMemo } from "react";
import { CheckCircle2, Siren } from "lucide-react";
import type { NIMModel } from "../dashboard/mock-data";
import { SeverityLine, StatusDot } from "./discover-primitives";
import { PanelHeader } from "./ops-primitives";

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

function formatAge(iso: string): string {
  const age = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(age / 60000);
  if (mins < 1) return "Under 1m ago";
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
        time: (m.lastChecked instanceof Date ? m.lastChecked : new Date(m.lastChecked)).toISOString(),
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
      <section className="ops-card">
        <PanelHeader label="Incident timeline" icon={Siren} tone="healthy" />
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <CheckCircle2 className="mb-2 h-8 w-8 text-text-muted" aria-hidden="true" />
          <p className="mb-1 body-sm font-medium text-text-primary">All systems nominal</p>
          <p className="body-sm text-text-muted">No active incidents detected.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="ops-card">
      <PanelHeader
        label="Incident timeline"
        icon={Siren}
        tone="critical"
        meta={<span className="status-chip">{items.length} active</span>}
      />

      <div className="panel-pad space-y-1">
        {items.map((item) => {
          return (
            <SeverityLine key={item.id} severity={item.severity}>
              <div
                className="flex items-center gap-3 rounded-r-lg px-3 py-3 transition-colors duration-150 hover:bg-surface-recessed"
                style={{ opacity: ageOpacity(item.time) }}
                suppressHydrationWarning
              >
                <StatusDot status={item.severity === "critical" ? "jammed" : "busy"} size={10} />
                <div className="flex-1 min-w-0">
                  <div className="truncate body-sm text-text-primary">{item.message}</div>
                  <div className="mt-0.5 truncate font-mono text-xs text-text-muted">
                    {item.title} &middot; {item.provider}
                  </div>
                </div>
                <span className="shrink-0 font-mono text-xs text-text-muted" suppressHydrationWarning>
                  {formatAge(item.time)}
                </span>
              </div>
            </SeverityLine>
          );
        })}
      </div>
    </section>
  );
}
