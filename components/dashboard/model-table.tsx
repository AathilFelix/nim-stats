"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusPill } from "@/components/dashboard/status-pill";
import { Sparkline } from "@/components/dashboard/sparkline";
import { UptimeBar } from "@/components/dashboard/sparkline";
import { cn } from "@/lib/utils";
import { type NIMModel } from "./mock-data";
import { formatTimeAgo } from "./mock-data";

interface ModelTableProps {
  models: NIMModel[];
}

export function ModelTable({ models }: ModelTableProps) {
  const sorted = [...models].sort((a, b) => {
    const order = { jammed: 0, busy: 1, healthy: 2 };
    return order[a.status] - order[b.status];
  });

  return (
    <div className="rounded-xl bg-zinc-900/60 border border-zinc-800/60 backdrop-blur-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-zinc-800/60 hover:bg-transparent">
            <TableHead className="text-zinc-500 font-medium text-xs uppercase tracking-wider h-12 px-5">
              Model
            </TableHead>
            <TableHead className="text-zinc-500 font-medium text-xs uppercase tracking-wider">
              Status
            </TableHead>
            <TableHead className="text-zinc-500 font-medium text-xs uppercase tracking-wider">
              TTFT
            </TableHead>
            <TableHead className="text-zinc-500 font-medium text-xs uppercase tracking-wider">
              Throughput
            </TableHead>
            <TableHead className="text-zinc-500 font-medium text-xs uppercase tracking-wider">
              Congestion
            </TableHead>
            <TableHead className="text-zinc-500 font-medium text-xs uppercase tracking-wider">
              Uptime
            </TableHead>
            <TableHead className="text-zinc-500 font-medium text-xs uppercase tracking-wider">
              Throughput (24h)
            </TableHead>
            <TableHead className="text-zinc-500 font-medium text-xs uppercase tracking-wider text-right">
              Last checked
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((model) => (
            <TableRow
              key={model.id}
              className={cn(
                "border-zinc-800/40 transition-colors group",
                model.status === "jammed" && "hover:bg-red-500/5",
                model.status === "healthy" && "hover:bg-emerald-500/3"
              )}
            >
              <TableCell className="px-5 py-4">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-semibold text-zinc-200 group-hover:text-white transition-colors">
                    {model.name}
                  </span>
                  <span className="text-xs text-zinc-600">{model.provider}</span>
                </div>
              </TableCell>
              <TableCell>
                <StatusPill status={model.status} />
              </TableCell>
              <TableCell>
                <span className={cn(
                  "text-sm font-mono tabular-nums",
                  model.ttft > 500 ? "text-amber-400" : model.ttft > 1000 ? "text-red-400" : "text-zinc-300"
                )}>
                  {model.ttft}
                  <span className="text-zinc-600 text-xs ml-0.5">ms</span>
                </span>
              </TableCell>
              <TableCell>
                <span className="text-sm font-mono tabular-nums text-zinc-300">
                  {model.throughput}
                  <span className="text-zinc-600 text-xs ml-0.5">tok/s</span>
                </span>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${model.congestion}%`,
                        backgroundColor: model.congestion > 80 ? "#ef4444" : model.congestion > 50 ? "#f59e0b" : "#10b981",
                      }}
                    />
                  </div>
                  <span className="text-xs text-zinc-500 w-8 tabular-nums">{model.congestion}%</span>
                </div>
              </TableCell>
              <TableCell>
                <UptimeBar uptime={model.uptime} />
              </TableCell>
              <TableCell>
                <Sparkline
                  data={model.throughputHistory}
                  color={model.status === "healthy" ? "#10b981" : model.status === "busy" ? "#f59e0b" : "#ef4444"}
                  height={28}
                />
              </TableCell>
              <TableCell className="text-right">
                <span className="text-xs text-zinc-600 font-mono">
                  {formatTimeAgo(model.lastChecked)}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
