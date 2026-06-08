"use client";

import { useMemo } from "react";
import { type NIMModel } from "./mock-data";

interface BestModelSpotlightProps {
  model: NIMModel;
}

function pseudoRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

export function BestModelSpotlight({ model }: BestModelSpotlightProps) {
  const bars = useMemo(() =>
    Array.from({ length: 48 }, (_, i) => {
      const val = 99.5 + pseudoRandom(i) * 0.5;
      const h = 20 + (val - 99) * 200;
      return {
        height: h,
        color: val > 99.9 ? "#10b981" : val > 99.5 ? "#f59e0b" : "#ef4444",
        opacity: 0.3 + (val - 99) * 30,
      };
    }),
  []);

  return (
    <div className="relative rounded-2xl overflow-hidden">
      <div
        className="absolute inset-0 rounded-2xl p-[1px]"
        style={{ background: "linear-gradient(135deg, #10b98120, #10b98105, #10b98120)" }}
      />
      <div className="relative bg-zinc-900/80 backdrop-blur-sm rounded-2xl p-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-[10px] text-emerald-400/70 uppercase tracking-[0.2em] font-semibold mb-1.5">
              Best Right Now
            </p>
            <h2 className="text-2xl font-bold text-white tracking-tight">{model.name}</h2>
            <p className="text-sm text-zinc-500 mt-0.5">{model.provider} · Free NIM</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <svg className="w-5 h-5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
          {[
            { label: "Throughput", value: model.throughput.toFixed(1), unit: "tok/s" },
            { label: "TTFT", value: `${model.ttft}`, unit: "ms" },
            { label: "Uptime", value: model.uptime.toFixed(2), unit: "%" },
            { label: "Reliability", value: `${model.reliability}`, unit: "/100" },
            { label: "Congestion", value: `${model.congestion}%`, invert: true },
          ].map((metric) => (
            <div key={metric.label} className="flex flex-col gap-1 p-3 rounded-lg bg-zinc-800/30 border border-zinc-800/50">
              <p className="text-[10px] text-zinc-600 uppercase tracking-widest font-medium">{metric.label}</p>
              <span className={cn("text-lg font-bold tabular-nums tracking-tight", metric.invert ? "text-amber-400" : "text-zinc-200")}>
                {metric.value}
                <span className="text-[11px] text-zinc-600 ml-0.5">{metric.unit}</span>
              </span>
            </div>
          ))}
        </div>

        <div>
          <p className="text-[10px] text-zinc-600 uppercase tracking-widest font-medium mb-2">Uptime Trend (24h)</p>
          <div className="flex gap-[2px] h-14 items-end">
            {bars.map((bar, i) => (
              <div
                key={i}
                className="flex-1 rounded-sm"
                style={{
                  height: `${bar.height}px`,
                  backgroundColor: bar.color,
                  opacity: bar.opacity,
                }}
              />
            ))}
          </div>
        </div>

        <div className="mt-5 flex items-center gap-3 text-xs text-zinc-500">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" style={{ boxShadow: "0 0 6px #10b981" }} />
          <span className="font-mono">
            Last checked {new Date(model.lastChecked).toLocaleTimeString()}
          </span>
        </div>
      </div>
    </div>
  );
}

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(" ");
}
