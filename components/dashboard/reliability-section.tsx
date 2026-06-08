"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type NIMModel } from "./mock-data";

interface ReliabilitySectionProps {
  models: NIMModel[];
}

export function ReliabilitySection({ models }: ReliabilitySectionProps) {
  return (
    <Card className="bg-zinc-900/60 border-zinc-800/60 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-sm text-zinc-500 font-medium uppercase tracking-wider">
          Reliability & Uptime
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {models.map((model) => (
            <ModelReliabilityCard key={model.id} model={model} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ModelReliabilityCard({ model }: { model: NIMModel }) {
  const score = model.reliability;
  const color = score >= 95 ? "#10b981" : score >= 85 ? "#f59e0b" : "#ef4444";
  const maxBarWidth = 120;
  const barWidth = maxBarWidth * (score / 100);

  return (
    <div className="rounded-xl bg-zinc-800/30 border border-zinc-800/40 p-4 hover:border-zinc-700/50 hover:bg-zinc-800/50 transition-all duration-300 group">
      <div className="flex items-center justify-between mb-3">
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="text-sm font-semibold text-zinc-300 truncate group-hover:text-white transition-colors">
            {model.name}
          </span>
          <span className="text-[11px] text-zinc-600">{model.provider}</span>
        </div>
        <span
          className="text-lg font-bold tabular-nums"
          style={{ color }}
        >
          {score}
        </span>
      </div>
      <div className="h-1 bg-zinc-800 rounded-full overflow-hidden mb-3">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${barWidth}px`,
            backgroundColor: color,
            boxShadow: `0 0 8px ${color}30`,
          }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-zinc-600">
        <span className="font-mono">{model.uptime.toFixed(2)}% uptime</span>
        <span className="font-mono">{model.ttft}ms TTFT</span>
      </div>
    </div>
  );
}
