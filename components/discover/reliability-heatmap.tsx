"use client";

import { useMemo } from "react";
import { ShieldCheck, AlertTriangle, XCircle, Grid2x2 } from "lucide-react";
import type { NIMModel } from "../dashboard/mock-data";
import { PanelHeader } from "./ops-primitives";

interface ReliabilityHeatmapProps {
  models: NIMModel[];
}

function confidenceIcon(v: string): React.ElementType {
  if (v === "high_confidence") return ShieldCheck;
  if (v === "moderate_confidence") return AlertTriangle;
  return XCircle;
}

function confidenceColor(v: string): string {
  if (v === "high_confidence") return "var(--status-healthy)";
  if (v === "moderate_confidence") return "var(--status-warn)";
  return "var(--status-critical)";
}

function confidenceLabel(v: string): string {
  if (v === "high_confidence") return "High";
  if (v === "moderate_confidence") return "Moderate";
  return "Avoid";
}

export function ReliabilityHeatmap({ models }: ReliabilityHeatmapProps) {
  const rows = useMemo(() => {
    return [...models]
      .sort((a, b) => b.reliability - a.reliability)
      .map((m) => ({
        model: m,
        Icon: confidenceIcon(m.routingConfidence),
        color: confidenceColor(m.routingConfidence),
        label: confidenceLabel(m.routingConfidence),
        sessionScore: m.sessionReliability.score,
      }));
  }, [models]);

  if (!models.length) {
    return (
      <section className="ops-card">
        <PanelHeader label="Reliability Matrix" icon={Grid2x2} tone="info" />
        <div className="py-8 text-center text-text-tertiary body-xs">No data.</div>
      </section>
    );
  }

  return (
    <section className="ops-card">
      <PanelHeader
        label="Reliability Matrix"
        icon={Grid2x2}
        tone="info"
        meta={<span className="metric-xs">by routing confidence</span>}
      />

      <div className="panel-pad space-y-1.5">
        {rows.map(({ model, Icon, color, label, sessionScore }) => (
          <div
            key={model.id}
            className="flex items-center gap-2.5 py-1.5 px-2 rounded-lg transition-colors duration-150 hover:bg-[--surface-recessed] group"
          >
            {/* Confidence icon */}
            <Icon className="w-3.5 h-3.5 shrink-0" style={{ color }} />

            {/* Model name */}
            <span className="text-xs font-medium text-[--text-primary] truncate w-32 shrink-0">
              {model.name}
            </span>

            {/* Stacked bar — session reliability score */}
            <div className="flex-1 min-w-0">
              <div className="h-1.5 rounded-full bg-[--border-subtle] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${sessionScore}%`, background: color }}
                />
              </div>
            </div>

            {/* Reliability % */}
            <span className="text-xs font-mono tabular-nums text-[--text-primary] w-12 text-right shrink-0">
              {model.reliability}%
            </span>

            {/* Confidence label */}
            <span
              className="text-[10px] font-bold uppercase tracking-[0.06em] font-mono w-16 text-right shrink-0"
              style={{ color }}
            >
              {label}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
