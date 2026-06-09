"use client";

import type { StatusKey } from "@/lib/design-tokens";
import { statusColor, STATUS_GLOW_BASE } from "@/lib/design-tokens";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function SectionLabel({ children }: { children: string }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground font-mono">
      {children}
    </p>
  );
}

export function SurfaceCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-lg border border-border bg-card text-card-foreground shadow-sm ${className ?? ""}`}>
      {children}
    </div>
  );
}

export function StatusDotCircle({
  status,
  size = 6,
  className,
}: {
  status: StatusKey;
  size?: number;
  className?: string;
}) {
  const color = statusColor(status);
  return (
    <span
      aria-hidden
      className="inline-block rounded-full shrink-0"
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        boxShadow: `${STATUS_GLOW_BASE} ${color}`,
      }}
    />
  );
}

export function MetricPill({
  value,
  label,
  intent = "default",
}: {
  value: string;
  label: string;
  intent?: "default" | "good" | "muted";
}) {
  if (intent === "good") {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-md border cursor-pointer"
            style={{
              backgroundColor: "var(--surface-recessed)",
              borderColor: "var(--border-base)",
            }}
          >
            <span className="tabular-nums text-xs font-semibold text-foreground font-mono tracking-tight">
              {value}
            </span>
            <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-muted-foreground font-mono">
              {label}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent>{label}</TooltipContent>
      </Tooltip>
    );
  }

  return (
    <div
      className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-md border ${intent === "muted" ? "opacity-75" : ""}`}
      style={{
        backgroundColor: "var(--surface-recessed)",
        borderColor: "var(--border-subtle)",
      }}
    >
      <span className="tabular-nums text-xs font-semibold text-foreground font-mono tracking-tight">
        {value}
      </span>
      <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-muted-foreground font-mono">
        {label}
      </span>
    </div>
  );
}

export function MiniStatRow({
  label,
  value,
  warn = false,
}: {
  label: string;
  value: string;
  warn?: boolean;
}) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="text-[10px] uppercase tracking-[0.08em] text-muted-foreground font-mono">{label}</span>
      <span
        className={`tabular-nums text-xs font-semibold font-mono tracking-tight ${warn ? "text-destructive" : "text-foreground"}`}
      >
        {value}
      </span>
    </div>
  );
}

export function EmptyState({ message = "No data" }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-8 text-muted-foreground">
      <StatusDotCircle status="healthy" />
      <p className="text-xs font-mono">{message}</p>
    </div>
  );
}

export function GradeBadge({ grade }: { grade: string }) {
  return (
    <Badge
      variant={grade === "A" ? "default" : grade === "B" ? "secondary" : "destructive"}
      className="w-6 h-6 rounded-md text-xs font-bold shrink-0 p-0 inline-flex items-center justify-center"
    >
      {grade}
    </Badge>
  );
}

export function SeverityBadge({
  severity,
}: {
  severity: "critical" | "warning" | "info";
}) {
  const variantMap = {
    critical: "destructive",
    warning: "outline",
    info: "outline",
  } as const;
  return (
    <Badge
      variant={variantMap[severity]}
      style={
        severity === "warning"
          ? { color: "#f59e0b", borderColor: "rgba(245,158,11,0.3)", backgroundColor: "rgba(245,158,11,0.1)" }
          : severity === "info"
            ? { color: "#10b981", borderColor: "rgba(16,185,129,0.3)", backgroundColor: "rgba(16,185,129,0.1)" }
            : undefined
      }
    >
      {severity.toUpperCase()}
    </Badge>
  );
}
