"use client";

import type { StatusKey } from "@/lib/design-tokens";
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
/*  The flat hairline panel                                             */
/* ─────────────────────────────────────────────────────────────────── */

export function SurfaceCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("ops-card", className)}>{children}</div>;
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
      <span className="metric-value flex items-center gap-2 text-xl tabular-nums text-text-primary">
        <StatusDot status={status} size={8} />
        <span>
          {typeof value === "number" ? value.toLocaleString("en-US", { maximumFractionDigits: 1 }) : value}
          {unit && <span className="ml-1 text-xs font-normal text-text-muted">{unit}</span>}
        </span>
      </span>
      <span className="body-sm text-text-muted">{label}</span>
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
      <span className="body-sm shrink-0 text-text-muted">{label}</span>
      <span className="cell-metric flex items-center gap-2 text-sm tabular-nums text-text-primary">
        {warn && <StatusDot status="busy" size={8} />}
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
        <span className="data-text text-sm text-text-muted">{message}</span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  GRADE BADGE — inline grade indicator                                 */
/* ─────────────────────────────────────────────────────────────────── */

export function GradeBadge({ grade }: { grade: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-xs border border-transparent bg-chip font-mono text-sm text-text-primary",
        grade === "A" && "border-primary bg-accent-soft",
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
  const word = { critical: "Critical", warning: "Warning", info: "Info" }[severity];
  return (
    <span className="status-chip">
      <StatusDot status={severity === "critical" ? "jammed" : severity === "warning" ? "busy" : "healthy"} size={8} />
      {word}
    </span>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  HUD PILL — compact facet metric (energy use, utilization, etc.)    */
/* ─────────────────────────────────────────────────────────────────── */

export function HUDPill({ label, value, status = "healthy" }: { label: string; value: string | number; status?: StatusKey }) {
  return (
    <div className="hud-block">
      <span className="metric-value flex items-center gap-2 text-base tabular-nums text-text-primary">
        <StatusDot status={status} size={8} />
        {typeof value === "number" ? value.toLocaleString("en-US", { maximumFractionDigits: 1 }) : value}
      </span>
      <span className="body-sm text-text-muted">{label}</span>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  STATUS PILL — fleet health badge                                     */
/* ─────────────────────────────────────────────────────────────────── */

export function StatusPill({ label, status, size = 8 }: { label: string; status: StatusKey; size?: number }) {
  return (
    <span className="status-chip">
      <StatusDot status={status} size={size} />
      {label}
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
