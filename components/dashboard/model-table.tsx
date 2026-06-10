"use client";

import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusPill } from "@/components/dashboard/status-pill";
import { Sparkline } from "@/components/dashboard/sparkline";
import { cn } from "@/lib/utils";
import type { NIMModel } from "./mock-data";
import { formatTimeAgo } from "./mock-data";

interface ModelTableProps {
  models: NIMModel[];
}

const COLS = [
  { label: "Model", sticky: true },
  { label: "Provider", hideSm: true },
  { label: "Status" },
  { label: "TTFT" },
  { label: "Throughput" },
  { label: "Congestion" },
  { label: "Uptime" },
  { label: "Session Rel.", hideSm: true },
  { label: "Volatility", hideSm: true },
  { label: "Timeout", hideSm: true },
  { label: "P95", hideSm: true },
  { label: "P99", hideSm: true },
  { label: "Recovery", hideSm: true },
  { label: "Queue", hideSm: true },
  { label: "Routing", hideSm: true },
  { label: "24h", hideMd: true },
  { label: "Checked", hideSm: true },
];

export function ModelTable({ models }: ModelTableProps) {
  const sorted = [...models].sort((a, b) => {
    const order = { jammed: 0, busy: 1, healthy: 2 } as Record<string, number>;
    return order[a.status] - order[b.status];
  });

  const sRelColor = (s: { state: string } | undefined) => {
    switch (s?.state) {
      case "stable": return "text-emerald-400";
      case "moderate_interruption_risk": return "text-amber-400";
      default: return "text-red-400";
    }
  };

  const volColor = (m: string | undefined) => {
    switch (m) {
      case "stable": return "text-emerald-400";
      case "fluctuating": return "text-amber-400";
      default: return "text-red-400";
    }
  };

  const pressureColor = (p: string | undefined) => {
    switch (p) {
      case "low": return "text-emerald-400";
      case "elevated": return "text-amber-400";
      default: return "text-red-400";
    }
  };

  const routingColor = (r: string | undefined) => {
    switch (r) {
      case "high_confidence": return "text-emerald-400";
      case "moderate_confidence": return "text-amber-400";
      default: return "text-red-400";
    }
  };

  return (
    <div className="rounded-lg border border-border-base overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableCaption className="sr-only">
            NVIDIA NIM endpoint status and reliability metrics
          </TableCaption>
          <TableHeader>
            <TableRow className="border-border-base">
              {COLS.map((col) => (
                <TableHead
                  key={col.label}
                  scope="col"
                  className={cn(
                    "label-xs text-text-tertiary h-10 px-3 whitespace-nowrap",
                    col.sticky && "sticky left-0 z-10 bg-surface-card",
                    col.hideSm && "hidden md:table-cell",
                    col.hideMd && "hidden lg:table-cell",
                  )}
                >
                  {col.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((model) => {
              const sRel = model.sessionReliability as { score: number; state: string };
              const vol = model.volatility as { measure: string; score: number };
              const tRate = model.timeoutRate as number;
              const p95 = model.p95Latency as number;
              const p99 = model.p99Latency as number;
              return (
                <TableRow
                  key={model.id}
                  className={cn(
                    "border-border-subtle transition-colors",
                    "active:bg-surface-elevated",
                    model.status === "jammed" && "hover:bg-red-500/[0.03]",
                    model.status === "healthy" && "hover:bg-surface-recessed",
                  )}
                >
                  <TableCell className="px-3 py-2.5 sm:py-2.5 sticky left-0 z-10 bg-surface-card">
                    <p className="body-md font-semibold text-text-primary whitespace-nowrap">{model.name}</p>
                  </TableCell>
                  <TableCell className="px-3 py-2.5 hidden md:table-cell">
                    <span className="body-sm text-text-tertiary">{model.provider}</span>
                  </TableCell>
                  <TableCell className="px-3 py-2.5">
                    <StatusPill status={model.status} size="sm" />
                  </TableCell>
                  <TableCell className="px-3 py-2.5">
                    <span className={`metric-sm ${model.ttft > 1000 ? "text-red-400" : model.ttft > 500 ? "text-amber-400" : "text-text-secondary"}`}>
                      {model.ttft}<span className="text-text-tertiary metric-xs ml-0.5">ms</span>
                    </span>
                  </TableCell>
                  <TableCell className="px-3 py-2.5">
                    <span className="metric-sm text-text-secondary">
                      {model.throughput.toFixed(1)}<span className="text-text-tertiary metric-xs ml-0.5">tok/s</span>
                    </span>
                  </TableCell>
                  <TableCell className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-1 bg-border-subtle rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-(--status-healthy)"
                          style={{
                            width: `${model.congestion}%`,
                            backgroundColor: model.congestion > 80 ? "var(--status-critical)" : model.congestion > 50 ? "var(--status-warn)" : "var(--status-healthy)",
                          }}
                        />
                      </div>
                      <span className="body-sm text-text-tertiary w-7">{model.congestion}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-3 py-2.5">
                    <span className="metric-sm text-text-secondary">{model.uptime.toFixed(2)}%</span>
                  </TableCell>
                  <TableCell className="px-3 py-2.5 hidden md:table-cell">
                    <span className={`body-sm font-semibold ${sRelColor(sRel)}`}>
                      {sRel?.score ?? "—"}
                      <span className="metric-xs text-text-tertiary ml-0.5">{(sRel?.state ?? "").replace(/_/g, " ")}</span>
                    </span>
                  </TableCell>
                  <TableCell className="px-3 py-2.5 hidden md:table-cell">
                    <span className={`body-sm font-medium ${volColor(vol?.measure)}`}>{vol?.measure ?? "—"}</span>
                  </TableCell>
                  <TableCell className="px-3 py-2.5 hidden md:table-cell">
                    <span className={`metric-sm ${tRate > 5 ? "text-red-400" : tRate > 2 ? "text-amber-400" : "text-text-secondary"}`}>
                      {tRate.toFixed(1)}%
                    </span>
                  </TableCell>
                  <TableCell className="px-3 py-2.5 hidden md:table-cell">
                    <span className={`body-sm ${p95 > 500 ? "text-red-400" : p95 > 300 ? "text-amber-400" : "text-text-secondary"}`}>
                      {p95}<span className="metric-xs text-text-tertiary ml-0.5">ms</span>
                    </span>
                  </TableCell>
                  <TableCell className="px-3 py-2.5 hidden md:table-cell">
                    <span className={`body-sm ${p99 > 1000 ? "text-red-400" : "text-text-secondary"}`}>
                      {p99}<span className="metric-xs text-text-tertiary ml-0.5">ms</span>
                    </span>
                  </TableCell>
                  <TableCell className="px-3 py-2.5 hidden md:table-cell">
                    <span className="body-sm text-text-tertiary italic">{model.recovery as string}</span>
                  </TableCell>
                  <TableCell className="px-3 py-2.5 hidden md:table-cell">
                    <span className={`body-sm font-medium ${pressureColor(model.queuePressure as string)}`}>
                      {model.queuePressure as string}
                    </span>
                  </TableCell>
                  <TableCell className="px-3 py-2.5 hidden md:table-cell">
                    <span className={`body-sm font-medium ${routingColor(model.routingConfidence as string)}`}>
                      {(model.routingConfidence as string).replace(/_/g, " ")}
                    </span>
                  </TableCell>
                  <TableCell className="px-3 py-2.5 hidden lg:table-cell">
                    <Sparkline
                      data={model.throughputHistory}
                      color={
                        model.status === "healthy"
                          ? "var(--status-healthy)"
                          : model.status === "busy"
                            ? "var(--status-warn)"
                            : "var(--status-critical)"
                      }
                      height={24}
                    />
                  </TableCell>
                  <TableCell className="px-3 py-2.5 text-right hidden md:table-cell">
                    <span className="metric-xs text-text-tertiary">{formatTimeAgo(model.lastChecked)}</span>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
