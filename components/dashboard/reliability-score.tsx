"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkline } from "@/components/dashboard/sparkline";
import { type NIMModel } from "./mock-data";

interface ReliabilityScoreProps {
  model: NIMModel;
}

export function ReliabilityScore({ model }: ReliabilityScoreProps) {
  const score = model.reliability;
  const color = score >= 95 ? "#10b981" : score >= 85 ? "#f59e0b" : "#ef4444";
  const circumference = 2 * Math.PI * 36;
  const offset = circumference - (score / 100) * circumference;

  return (
    <Card className="bg-zinc-900/60 border-zinc-800/60 backdrop-blur-sm p-6">
      <CardHeader className="p-0">
        <CardTitle className="text-sm text-zinc-500 font-medium uppercase tracking-wider">
          {model.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 mt-4">
        <div className="flex items-center gap-6">
          <div className="relative">
            <svg width="84" height="84" viewBox="0 0 84 84">
              <circle
                cx="42" cy="42" r="36"
                fill="none"
                stroke="#27272a"
                strokeWidth="5"
              />
              <circle
                cx="42" cy="42" r="36"
                fill="none"
                stroke={color}
                strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                transform="rotate(-90 42 42)"
                className="transition-all duration-700"
                style={{
                  filter: `drop-shadow(0 0 4px ${color}40)`,
                }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-bold tabular-nums" style={{ color }}>
                {score}
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Uptime</p>
            <p className="text-base font-semibold text-zinc-200 tabular-nums font-mono">{model.uptime.toFixed(2)}%</p>
            <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium mt-1">TTFT</p>
            <p className="text-base font-semibold text-zinc-200 tabular-nums font-mono">
              {model.ttft}
              <span className="text-zinc-600 text-xs"> ms</span>
            </p>
          </div>
        </div>
        <div className="mt-5">
          <p className="text-[10px] text-zinc-600 uppercase tracking-widest font-medium mb-2">
            24h Reliability
          </p>
          <div className="flex justify-center">
            <Sparkline
              data={model.reliabilityHistory.map(p => p.score)}
              color={color}
              height={32}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
