"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LIVE_UPTIME_DATA } from "./mock-data";

interface UptimeTrendChartProps {
  className?: string;
}

export function UptimeTrendChart({ className }: UptimeTrendChartProps) {
  return (
    <Card className={cn("bg-surface-card border-border-base", className)}>
      <CardHeader className="pb-4">
        <CardTitle className="text-sm text-text-tertiary font-medium uppercase tracking-wider">
          Global Uptime Trend
        </CardTitle>
        <p className="text-[11px] text-text-tertiary mt-0.5">
          Aggregate health of all {LIVE_UPTIME_DATA.length} tracked NIM endpoints
        </p>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex gap-[2px] h-16">
          {LIVE_UPTIME_DATA.map((point, i) => {
            const h = ((point.allModels - 98) / 2) * 100;
            const isWarning = point.allModels < 99.2;
            const isGood = point.allModels >= 99.4;
            return (
              <div
                key={i}
                className="flex-1 rounded-sm transition-all duration-300"
                style={{
                  height: `${Math.max(h, 8)}px`,
                  backgroundColor: isGood ? "#10b981" : isWarning ? "#f59e0b" : "#ef4444",
                  opacity: 0.25 + ((point.allModels - 98) / 2) * 0.75,
                  marginTop: `${64 - Math.max(h, 8)}px`,
                }}
              />
            );
          })}
        </div>
        <div className="flex justify-between mt-2 text-[10px] text-text-tertiary font-mono">
          <span>30m ago</span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            99.2 – 99.9%
          </span>
          <span>now</span>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-5 pt-4 border-t border-border-subtle">
          <StatRow label="Avg Uptime" value="99.87%" delta="+0.02%" />
          <StatRow label="Outages (24h)" value="0" delta="stable" />
          <StatRow label="Degraded" value="2" delta="of 10" warn />
        </div>
      </CardContent>
    </Card>
  );
}

function StatRow({ label, value, delta, warn }: { label: string; value: string; delta: string; warn?: boolean }) {
  return (
    <div>
      <p className="text-[10px] text-text-tertiary uppercase tracking-widest font-medium">{label}</p>
      <p className="text-lg font-bold text-text-secondary tabular-nums mt-0.5">{value}</p>
      <p className={cn("text-[11px] mt-0.5 font-medium", warn ? "text-amber-400" : "text-emerald-400")}>
        {delta}
      </p>
    </div>
  );
}

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(" ");
}
