"use client";

import { type NIMModel } from "./mock-data";
import { getStatusColor } from "./mock-data";
import { cn } from "@/lib/utils";

interface IncidentFeedProps {
  models: NIMModel[];
  maxItems?: number;
}

export function IncidentFeed({ models, maxItems = 3 }: IncidentFeedProps) {
  const incidents = models
    .filter((m) => m.status !== "healthy" || m.congestion > 50)
    .sort((a, b) => b.lastChecked.getTime() - a.lastChecked.getTime())
    .slice(0, maxItems);

  if (incidents.length === 0) {
    return (
      <p className="text-[11px] text-zinc-700">No incidents in the last 30m</p>
    );
  }

  return (
    <div className="space-y-2.5">
      {incidents.map((model) => (
        <IncidentEntry key={model.id} model={model} />
      ))}
    </div>
  );
}

function IncidentEntry({ model }: { model: NIMModel }) {
  const color = getStatusColor(model.status);
  const changeType = getChangeType(model);
  const timeAgo = formatTimeAgo(model.lastChecked);

  return (
    <button
      className="w-full text-left group"
      aria-label={`${model.name}: ${changeType} ${timeAgo}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-xs text-zinc-300 group-hover:text-white transition-colors truncate">
            {model.name}
          </p>
          <p className="text-[10px] text-zinc-600 mt-0.5">
            {changeType} · {timeAgo}
          </p>
        </div>
        <div className="flex items-center gap-1.5 pt-0.5">
          <div
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: color, boxShadow: `0 0 4px ${color}` }}
          />
        </div>
      </div>
    </button>
  );
}

function getChangeType(model: NIMModel): string {
  switch (model.status) {
    case "jammed":
      return "Degraded";
    case "busy":
      return "Elevated load";
    case "healthy":
      if (model.congestion > 50) return "Rising congestion";
      return "Monitoring";
    default:
      return "Status change";
  }
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s`;
  return `${Math.floor(seconds / 60)}m`;
}
