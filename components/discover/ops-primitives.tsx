"use client";

import type { ReactNode } from "react";
import { HorizontalSparkline } from "./horizontal-sparkline";
import { cn } from "@/lib/utils";

export type Tone = "healthy" | "warn" | "critical" | "info" | "neutral";

const TONE_TEXT: Record<Tone, string> = {
  healthy: "text-status-healthy",
  warn: "text-status-warn",
  critical: "text-status-critical",
  info: "text-status-info",
  neutral: "text-text-primary",
};

const TONE_VAR: Record<Tone, string> = {
  healthy: "var(--status-healthy)",
  warn: "var(--status-warn)",
  critical: "var(--status-critical)",
  info: "var(--status-info)",
  neutral: "var(--text-accent)",
};

/* ─────────────────────────────────────────────────────────────────── */
/*  PANEL HEADER — consistent hairline header for every ops panel        */
/* ─────────────────────────────────────────────────────────────────── */

export function PanelHeader({
  label,
  meta,
  icon: Icon,
  tone = "neutral",
  className,
}: {
  label: string;
  meta?: ReactNode;
  icon?: React.ElementType;
  tone?: Tone;
  className?: string;
}) {
  return (
    <div className={cn("hdiv", className)}>
      <div className="flex items-center gap-2.5 min-w-0">
        {Icon && <Icon className={cn("h-3.5 w-3.5 shrink-0", TONE_TEXT[tone === "neutral" ? "info" : tone])} />}
        <span className="section-label truncate">{label}</span>
      </div>
      {meta != null && (
        <div className="label-xs text-text-tertiary shrink-0 flex items-center gap-2">{meta}</div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  DELTA — directional change chip (▲ / ▼ / —)                          */
/* ─────────────────────────────────────────────────────────────────── */

export function Delta({
  value,
  unit,
  /** Which direction is "good" — colors the arrow accordingly. */
  goodWhen = "up",
  className,
}: {
  value: number;
  unit?: string;
  goodWhen?: "up" | "down";
  className?: string;
}) {
  const flat = Math.abs(value) < 0.05;
  const up = value > 0;
  const good = flat ? null : goodWhen === "up" ? up : !up;
  const arrow = flat ? "—" : up ? "▲" : "▼";
  const tone = good == null ? "text-text-tertiary" : good ? "text-status-healthy" : "text-status-critical";

  return (
    <span className={cn("metric-xs inline-flex items-center gap-0.5", tone, className)}>
      <span className="text-[0.6rem] leading-none">{arrow}</span>
      {Math.abs(value).toFixed(Math.abs(value) >= 10 ? 0 : 1)}
      {unit}
    </span>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  VITAL — KPI tile: big mono value, unit, sparkline, optional delta     */
/* ─────────────────────────────────────────────────────────────────── */

export function Vital({
  label,
  value,
  unit,
  data,
  tone = "neutral",
  delta,
  className,
}: {
  label: string;
  value: string | number;
  unit?: string;
  data?: number[];
  tone?: Tone;
  delta?: ReactNode;
  className?: string;
}) {
  const display =
    typeof value === "number" ? value.toLocaleString("en-US", { maximumFractionDigits: 1 }) : value;

  return (
    <div className={cn("flex flex-col gap-2 min-w-0", className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="label-xs text-text-tertiary truncate">{label}</span>
        {delta}
      </div>
      <div className="flex items-baseline gap-1">
        <span className={cn("metric-xl", TONE_TEXT[tone])}>{display}</span>
        {unit && <span className="metric-xs text-text-tertiary">{unit}</span>}
      </div>
      {data && data.length > 1 && (
        <HorizontalSparkline
          data={data}
          color={TONE_VAR[tone]}
          width={132}
          height={24}
          showDot
          className="w-full"
        />
      )}
    </div>
  );
}

export { TONE_VAR, TONE_TEXT };
