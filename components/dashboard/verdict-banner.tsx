"use client";

import { type NIMModel } from "./mock-data";

interface VerdictBannerProps {
  models: NIMModel[];
}

export function VerdictBanner({ models }: VerdictBannerProps) {
  const bestModel = models.reduce((best, m) => (m.reliability >= best.reliability ? m : best), models[0]);
  const secondBest = models
    .filter((m) => m.id !== bestModel.id && m.status === "healthy")
    .sort((a, b) => b.reliability - a.reliability)[0];

  return (
    <div className="rounded-xl bg-zinc-900/60 border border-emerald-500/20 p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-[10px] text-emerald-400/70 uppercase tracking-widest font-semibold">
            Use now
          </p>
          <p className="text-lg font-semibold text-white tracking-tight">
            {bestModel.name}{" "}
            <span className="text-zinc-500 font-normal">({bestModel.provider})</span>
          </p>
        </div>
        <div className="flex items-center gap-2 pt-1">
          <div
            className="w-2 h-2 rounded-full"
            style={{
              backgroundColor: "#10b981",
              boxShadow: "0 0 6px #10b981",
            }}
          />
          <span className="text-[10px] text-emerald-400 font-medium uppercase tracking-widest">
            Healthy
          </span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Metric label="TTFT" value={`${bestModel.ttft}ms`} />
        <Metric label="Throughput" value={`${bestModel.throughput.toFixed(1)} tok/s`} />
        <Metric label="Congestion" value={`${bestModel.congestion}%`} />
        <Metric label="Uptime" value={`${bestModel.uptime.toFixed(2)}%`} />
      </div>

      {secondBest && (
        <p className="mt-4 text-[11px] text-zinc-500">
          Need higher quality?{" "}
          <span className="text-zinc-300">{secondBest.name}</span> for slightly slower but more reliable output.
        </p>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] text-zinc-600 uppercase tracking-widest font-medium mb-1">
        {label}
      </p>
      <p className="text-sm font-semibold text-zinc-200 tabular-nums tracking-tight">
        {value}
      </p>
    </div>
  );
}
