"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusPill } from "@/components/dashboard/status-pill";
import { Sparkline } from "@/components/dashboard/sparkline";
import { cn } from "@/lib/utils";
import type { NIMModel } from "./mock-data";
import { formatTimeAgo } from "./mock-data";

interface ModelTableProps {
  models: NIMModel[];
}

const COLS = [
  "Model",
  "Provider",
  "Status",
  "TTFT",
  "Throughput",
  "Congestion",
  "Uptime",
  "Session Rel.",
  "Volatility",
  "Timeout",
  "P95",
  "P99",
  "Recovery",
  "Queue",
  "Routing",
  "24h",
  "Checked",
];

export function ModelTable({ models }: ModelTableProps) {
  const sorted = [...models].sort((a, b) => {
    const order = { jammed: 0, busy: 1, healthy: 2 } as Record<string, number>;
    return order[a.status] - order[b.status];
  });

  const sRelColor = (s: { state: string } | undefined) => {
    switch (s?.state) {
      case "stable":
        return "text-emerald-400";
      case "moderate_interruption_risk":
        return "text-amber-400";
      default:
        return "text-red-400";
    }
  };

  const volColor = (m: string | undefined) => {
    switch (m) {
      case "stable":
        return "text-emerald-400";
      case "fluctuating":
        return "text-amber-400";
      default:
        return "text-red-400";
    }
  };

  const pressureColor = (p: string | undefined) => {
    switch (p) {
      case "low":
        return "text-emerald-400";
      case "elevated":
        return "text-amber-400";
      default:
        return "text-red-400";
    }
  };

  const routingColor = (r: string | undefined) => {
    switch (r) {
      case "high_confidence":
        return "text-emerald-400";
      case "moderate_confidence":
        return "text-amber-400";
      default:
        return "text-red-400";
    }
  };

  return (
    <div className="rounded-2xl border border-border-base overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-border-base">
              {COLS.map((col) => (
                <TableHead
                  key={col}
                  className="text-[10px] text-text-tertiary font-medium uppercase tracking-[0.08em] h-10 px-3 whitespace-nowrap"
                >
                  {col}
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
                    model.status === "jammed" && "hover:bg-red-500/[0.03]",
                    model.status === "healthy" && "hover:bg-surface-recessed",
                  )}
                >
                  <TableCell className="px-3 py-2.5">
                    <p className="text-[13px] font-semibold text-text-primary whitespace-nowrap">{model.name}</p>
                  </TableCell>
                  <TableCell className="px-3 py-2.5">
                    <span className="text-[11px] text-text-tertiary">{model.provider}</span>
                  </TableCell>
                  <TableCell className="px-3 py-2.5">
                    <StatusPill status={model.status} size="sm" />
                  </TableCell>
                  <TableCell className="px-3 py-2.5">
                    <span
                      className={`text-[12px] font-mono tabular-nums ${
                        model.ttft > 500 ? "text-amber-400" : model.ttft > 1000 ? "text-red-400" : "text-text-secondary"
                      }`}
                    >
                      {model.ttft}
                      <span className="text-text-tertiary text-[10px] ml-0.5">ms</span>
                    </span>
                  </TableCell>
                  <TableCell className="px-3 py-2.5">
                    <span className="text-[12px] font-mono tabular-nums text-text-secondary">
                      {model.throughput.toFixed(1)}
                      <span className="text-text-tertiary text-[10px] ml-0.5">tok/s</span>
                    </span>
                  </TableCell>
                  <TableCell className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-1 bg-border-subtle rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${model.congestion}%`,
                            backgroundColor: model.congestion > 80 ? "#ef4444" : model.congestion > 50 ? "#f59e0b" : "#10b981",
                          }}
                        />
                      </div>
                      <span className="text-[11px] text-text-tertiary w-7 tabular-nums">{model.congestion}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-3 py-2.5">
                    <span className="text-[12px] font-mono tabular-nums text-text-secondary">{model.uptime.toFixed(2)}%</span>
                  </TableCell>
                  <TableCell className="px-3 py-2.5">
                    <span className={`text-[11px] font-semibold tabular-nums ${sRelColor(sRel)}`}>
                      {sRel?.score ?? "—"}
                      <span className="text-[9px] text-text-tertiary ml-0.5">{(sRel?.state ?? "").replace(/_/g, " ")}</span>
                    </span>
                  </TableCell>
                  <TableCell className="px-3 py-2.5">
                    <span className={`text-[11px] font-medium ${volColor(vol?.measure)}`}>{vol?.measure ?? "—"}</span>
                  </TableCell>
                  <TableCell className="px-3 py-2.5">
                    <span
                      className={`text-[12px] font-mono tabular-nums ${
                        tRate > 5 ? "text-red-400" : tRate > 2 ? "text-amber-400" : "text-text-secondary"
                      }`}
                    >
                      {tRate.toFixed(1)}%
                    </span>
                  </TableCell>
                  <TableCell className="px-3 py-2.5">
                    <span
                      className={`text-[11px] font-mono tabular-nums ${
                        p95 > 500 ? "text-red-400" : p95 > 300 ? "text-amber-400" : "text-text-secondary"
                      }`}
                    >
                      {p95}
                      <span className="text-[9px] text-text-tertiary ml-0.5">ms</span>
                    </span>
                  </TableCell>
                  <TableCell className="px-3 py-2.5">
                    <span
                      className={`text-[11px] font-mono tabular-nums ${p99 > 1000 ? "text-red-400" : "text-text-secondary"}`}
                    >
                      {p99}
                      <span className="text-[9px] text-text-tertiary ml-0.5">ms</span>
                    </span>
                  </TableCell>
                  <TableCell className="px-3 py-2.5">
                    <span className="text-[11px] text-text-tertiary italic">{model.recovery as string}</span>
                  </TableCell>
                  <TableCell className="px-3 py-2.5">
                    <span className={`text-[11px] font-medium ${pressureColor(model.queuePressure as string)}`}>
                      {model.queuePressure as string}
                    </span>
                  </TableCell>
                  <TableCell className="px-3 py-2.5">
                    <span
                      className={`text-[11px] font-medium ${routingColor(model.routingConfidence as string)}`}
                    >
                      {(model.routingConfidence as string).replace(/_/g, " ")}
                    </span>
                  </TableCell>
                  <TableCell className="px-3 py-2.5">
                    <Sparkline
                      data={model.throughputHistory}
                      color={
                        model.status === "healthy"
                          ? "#10b981"
                          : model.status === "busy"
                            ? "#f59e0b"
                            : "#ef4444"
                      }
                      height={24}
                    />
                  </TableCell>
                  <TableCell className="px-3 py-2.5 text-right">
                    <span className="text-[10px] text-text-tertiary font-mono tabular-nums">{formatTimeAgo(model.lastChecked)}</span>
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
