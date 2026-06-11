"use client";

import type { StatusKey } from "@/lib/design-tokens";
import { STATUS_TEXT } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/* ─────────────────────────────────────────────────────────────────── */
/*  SECTION LABEL                                                       */
/* ─────────────────────────────────────────────────────────────────── */

export function SectionLabel({ children, className }: { children: string; className?: string }) {
  return (
    <p className={cn("section-label", className)}>{children}</p>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  DIVIDER WITH DOT — breaks sections with a breathing-room line      */
/* ─────────────────────────────────────────────────────────────────── */

export function DividerDot({ className }: { className?: string }) {
  return (
    <div className={cn("accent-sep", className)} />
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  OPS SURFACE CARD                                                    */
/*  The new monolith container — dark recessed surface, bracket option */
/* ─────────────────────────────────────────────────────────────────── */

export function SurfaceCard({
  children,
  className,
  bracketed = false,
  scanline = false,
}: {
  children: React.ReactNode;
  className?: string;
  bracketed?: boolean;
  scanline?: boolean;
}) {
  return (
    <div
      className={cn(
        "ops-card",
        bracketed && "ops-card--bracketed",
        scanline && "ops-scanline",
        className
      )}
    >
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  STATUS DOT with glow, animated for critical/warn, with size option */
/* ─────────────────────────────────────────────────────────────────── */

export function StatusDot({
  status,
  size = 7,
  className,
}: {
  status: StatusKey;
  size?: number;
  className?: string;
}) {
  const variantMap: Record<StatusKey, string> = {
    healthy: "status-dot--healthy",
    busy: "status-dot--warn",
    jammed: "status-dot--critical",
  };

  return (
    <span
      aria-hidden
      className={cn("status-dot", variantMap[status], className)}
      style={{
        width: size,
        height: size,
        animationDuration: status === "jammed" ? "1.6s" : status === "busy" ? "2.2s" : "3s",
      }}
    />
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  METRIC BLOCK                                                         */
/*  One stat with value, label, optional status-bar and accent-color    */
/* ─────────────────────────────────────────────────────────────────── */

export function MetricBlock({
  value,
  label,
  unit,
  status = "healthy",
  showBar = false,
  barFraction,
  className,
}: {
  value: string | number;
  label: string;
  unit?: string;
  status?: StatusKey;
  showBar?: boolean;
  barFraction?: number;
  className?: string;
}) {
  return (
    <div className={cn("hud-block", className)}>
      <span
        className={cn(
          "metric-value text-xl tabular-nums",
          STATUS_TEXT[status === "healthy" ? "healthy" : status],
          status === "jammed" && "text-[--status-critical]"
        )}
      >
        {typeof value === "number" ? value.toLocaleString("en-US", { maximumFractionDigits: 1 }) : value}
        {unit && (
          <span className="text-xs ml-1 opacity-65 font-normal">{unit}</span>
        )}
      </span>
      <span className="text-xs font-medium text-[--text-tertiary] tracking-[0.05em] uppercase">
        {label}
      </span>
      {showBar && barFraction !== undefined && (
        <div className="severity-bar mt-1">
          <span
            style={{
              width: `${Math.min(100, Math.max(0, barFraction * 100))}%`,
              background: `var(--status-${status === "healthy" ? "healthy" : status === "busy" ? "warn" : "critical"})`,
            }}
          />
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  MINI STAT ROW — compact inline key-value pairs                       */
/* ─────────────────────────────────────────────────────────────────── */

export function MiniStatRow({ label, value, warn = false }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-0.5">
      <span className="text-xs uppercase tracking-[0.08em] text-[--text-tertiary] data-text shrink-0">
        {label}
      </span>
      <span
        className={cn(
          "cell-metric text-sm tabular-nums tracking-tight",
          warn ? "text-[--status-critical] font-semibold" : "text-[--text-primary]"
        )}
      >
        {value}
      </span>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  EMPTY STATE                                                         */
/* ─────────────────────────────────────────────────────────────────── */

export function EmptyState({ message = "No data", status = "healthy" as StatusKey }: { message?: string; status?: StatusKey }) {
  return (
    <div className="empty-state">
      <div className="flex items-center gap-2">
        <StatusDot status={status} size={6} />
        <span className="data-text text-sm text-[--text-tertiary]">{message}</span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  GRADE BADGE — bracket-style inline grade indicator                  */
/* ─────────────────────────────────────────────────────────────────── */

export function GradeBadge({ grade }: { grade: string }) {
  const colorMap: Record<string, string> = {
    A: "color-[--status-healthy]",
    B: "color-[--status-warn]",
    C: "color-[--status-info]",
    D: "color-[--status-critical]",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center w-5 h-5 rounded text-sm font-bold font-mono shrink-0 border",
        colorMap[grade] || "color-[--text-tertiary]",
        grade === "A" && "bg-[--status-healthy]/[0.08] border-[--status-healthy]/[0.20]"
      )}
    >
      {grade}
    </span>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  SEVERITY BADGE — small inline severity chip                          */
/* ─────────────────────────────────────────────────────────────────── */

export function SeverityBadge({ severity }: { severity: "critical" | "warning" | "info" }) {
  const map: Record<string, string> = {
    critical: "status-chip--critical",
    warning: "status-chip--degraded",
    info: "status-chip--info",
  };
  return (
    <span className={cn("status-chip", map[severity])}>
      <StatusDot status={severity === "critical" ? "jammed" : severity === "warning" ? "busy" : "healthy"} size={5} />
      {severity.toUpperCase()}
    </span>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  HUD PILL — compact facet metric (energy use, utilization, etc.)    */
/* ─────────────────────────────────────────────────────────────────── */

export function HUDPill({ label, value, status = "healthy" }: { label: string; value: string | number; status?: StatusKey }) {
  return (
    <div className="hud-block">
      <span className={cn("metric-value text-base tabular-nums", STATUS_TEXT[status === "healthy" ? "healthy" : status])}>
        {typeof value === "number" ? value.toLocaleString("en-US", { maximumFractionDigits: 1 }) : value}
      </span>
      <span className="text-xs font-medium text-[--text-tertiary] tracking-[0.06em] uppercase">
        {label}
      </span>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  STATUS PILL — fleet health badge                                     */
/* ─────────────────────────────────────────────────────────────────── */

export function StatusPill({ label, status, size = 7 }: { label: string; status: StatusKey; size?: number }) {
  const chipVar: Record<StatusKey, string> = {
    healthy: "status-chip--healthy",
    busy: "status-chip--degraded",
    jammed: "status-chip--critical",
  };
  const staticText: Record<StatusKey, string> = {
    healthy: "text-[--status-healthy]",
    busy: "text-[--status-warn]",
    jammed: "text-[--status-critical]",
  };

  return (
    <span className={cn("status-chip", chipVar[status])}>
      <StatusDot status={status} size={size} />
      <span className={cn("text-xs font-semibold tracking-[0.06em]", staticText[status])}>{label}</span>
    </span>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  MINI BAR — inline percentage bar for table cells                    */
/* ─────────────────────────────────────────────────────────────────── */

export function MiniBar({
  value,
  max = 100,
  color = "var(--text-accent)",
  className,
}: {
  value: number;
  max?: number;
  color?: string;
  className?: string;
}) {
  return (
    <div className={cn("mini-bar", className)}>
      <span style={{ width: `${Math.min(100, (value / max) * 100)}%`, background: color }} />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  RANK BADGE — numbered rank indicator for leaderboards                */
/* ─────────────────────────────────────────────────────────────────── */

export function RankBadge({
  rank,
  className,
}: {
  rank: number;
  className?: string;
}) {
  return (
    <span className={cn("rank-badge", rank <= 3 && "rank-badge--top", className)}>
      {rank}
    </span>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  SEVERITY LINE — left-border severity accent for incident rows        */
/* ─────────────────────────────────────────────────────────────────── */

export function SeverityLine({
  severity,
  children,
  className,
}: {
  severity: "critical" | "warning" | "info";
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("severity-line", `severity-line--${severity}`, className)}>
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  SIGNAL STRENGTH — 3-segment routing confidence indicator             */
/* ─────────────────────────────────────────────────────────────────── */

export function SignalStrength({
  level,
  className,
}: {
  level: 1 | 2 | 3;
  className?: string;
}) {
  return (
    <span className={cn("signal-bar", `signal-bar--${level}`, className)} aria-hidden>
      <span /><span /><span />
    </span>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  FLEET COMPOSITION BAR — horizontal split of fleet health              */
/* ─────────────────────────────────────────────────────────────────── */

export function FleetBar({
  healthy,
  busy,
  jammed,
  className,
}: {
  healthy: number;
  busy: number;
  jammed: number;
  className?: string;
}) {
  const total = healthy + busy + jammed || 1;
  return (
    <div className={cn("fleet-bar", className)} aria-label={`Fleet: ${healthy} healthy, ${busy} busy, ${jammed} jammed`}>
      <span style={{ width: `${(healthy / total) * 100}%`, background: "var(--status-healthy)" }} />
      <span style={{ width: `${(busy / total) * 100}%`, background: "var(--status-warn)" }} />
      <span style={{ width: `${(jammed / total) * 100}%`, background: "var(--status-critical)" }} />
    </div>
  );
}

// Re-export for consumers
export { cn };
