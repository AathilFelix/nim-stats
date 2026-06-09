"use client";

import type { StatusKey } from "@/lib/design-tokens";
import { statusColor, STATUS_GLOW_BASE } from "@/lib/design-tokens";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export function SectionLabel({
  children,
  className,
}: {
  children: string;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground font-mono",
        className,
      )}
    >
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
    <div className={cn("rounded-lg border border-border bg-card text-card-foreground shadow-sm", className)}>
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
      className={cn("inline-block rounded-full shrink-0", className)}
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
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-0.5 px-2 py-1 rounded-md border",
        "border-border bg-muted",
        intent === "muted" && "opacity-60",
        intent === "good" && "border-emerald-500/30 bg-emerald-500/5",
      )}
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
        className={cn(
          "tabular-nums text-xs font-semibold font-mono tracking-tight",
          warn ? "text-destructive" : "text-foreground",
        )}
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
      variant={
        grade === "A"
          ? "default"
          : grade === "B"
            ? "secondary"
            : grade === "C"
              ? "outline"
              : "destructive"
      }
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
  return <Badge variant={variantMap[severity]}>{severity.toUpperCase()}</Badge>;
}
