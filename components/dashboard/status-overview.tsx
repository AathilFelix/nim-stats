"use client";

import { type NIMModel } from "./mock-data";

export function StatusOverview({ models }: { models: NIMModel[] }) {
  const topThroughput = [...models].sort((a, b) => b.throughput - a.throughput)[0];
  const lowestCongestion = [...models].sort((a, b) => a.congestion - b.congestion)[0];
  const mostReliable = [...models].sort((a, b) => b.reliability - a.reliability)[0];
  const lowestTTFT = [...models].sort((a, b) => a.ttft - b.ttft)[0];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <MiniStatusCard label="Fastest Now" value={lowestTTFT.name} sub={`${lowestTTFT.ttft}ms TTFT`} />
      <MiniStatusCard label="Highest Throughput" value={topThroughput.name} sub={`${topThroughput.throughput} tok/s`} />
      <MiniStatusCard label="Least Congested" value={lowestCongestion.name} sub={`${lowestCongestion.congestion}% load`} />
      <MiniStatusCard label="Most Reliable" value={mostReliable.name} sub={`${mostReliable.reliability}/100 score`} />
    </div>
  );
}

function MiniStatusCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-xl bg-zinc-900/40 border border-zinc-800/40 p-4 hover:border-zinc-700/50 hover:bg-zinc-900/60 transition-all duration-300 group cursor-default">
      <p className="text-[10px] text-zinc-600 uppercase tracking-widest font-semibold mb-2">{label}</p>
      <p className="text-sm font-semibold text-zinc-300 group-hover:text-white transition-colors truncate">{value}</p>
      <p className="text-[11px] text-zinc-500 font-mono mt-0.5">{sub}</p>
      <div className="mt-2.5 h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
    </div>
  );
}
