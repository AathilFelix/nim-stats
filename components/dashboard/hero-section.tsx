"use client";

import { Card, CardContent } from "@/components/ui/card";
import { type NIMModel } from "./mock-data";

interface HeroSectionProps {
  models: NIMModel[];
}

export function HeroSection({ models }: HeroSectionProps) {
  const healthy = models.filter(m => m.status === "healthy").length;
  const busy = models.filter(m => m.status === "busy").length;
  const jammed = models.filter(m => m.status === "jammed").length;
  const avgThroughput = Math.round(models.reduce((acc, m) => acc + m.throughput, 0) / models.length);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <div className="w-3.5 h-3.5 bg-emerald-400 rounded-sm" style={{ clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)" }} />
          </div>
          <span className="text-sm font-semibold text-zinc-400 tracking-wide">
            NIM Stats
          </span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight leading-[1.1]">
          NVIDIA NIM<br />
          <span className="text-zinc-600">free endpoints</span>
        </h1>
        <p className="text-base text-zinc-500 max-w-lg leading-relaxed mt-2">
          Real-time status and reliability metrics for every free model.<br />
          Know what&apos;s fast, what&apos;s jammed, before you ask.
        </p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="bg-zinc-900/40 border-zinc-800/40 p-4">
          <CardContent className="p-0 flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-white tabular-nums">{healthy}/{models.length}</p>
              <p className="text-[11px] text-zinc-500 uppercase tracking-wider font-medium mt-1">Healthy</p>
            </div>
            <div className="w-2 h-2 rounded-full bg-emerald-400" style={{ boxShadow: "0 0 8px #10b981" }} />
          </CardContent>
        </Card>
        {busy > 0 && (
          <Card className="bg-zinc-900/40 border-zinc-800/40 p-4">
            <CardContent className="p-0 flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-amber-400 tabular-nums">{busy}</p>
                <p className="text-[11px] text-zinc-500 uppercase tracking-wider font-medium mt-1">Busy</p>
              </div>
              <div className="w-2 h-2 rounded-full bg-amber-400" style={{ boxShadow: "0 0 8px #f59e0b" }} />
            </CardContent>
          </Card>
        )}
        {jammed > 0 && (
          <Card className="bg-zinc-900/40 border-zinc-800/40 p-4">
            <CardContent className="p-0 flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-red-400 tabular-nums">{jammed}</p>
                <p className="text-[11px] text-zinc-500 uppercase tracking-wider font-medium mt-1">Jammed</p>
              </div>
              <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" style={{ boxShadow: "0 0 8px #ef4444" }} />
            </CardContent>
          </Card>
        )}
        <Card className="bg-zinc-900/40 border-zinc-800/40 p-4">
          <CardContent className="p-0">
            <p className="text-2xl font-bold text-white tabular-nums">{avgThroughput}</p>
            <p className="text-[11px] text-zinc-500 uppercase tracking-wider font-medium mt-1">
              Avg tok/s
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
