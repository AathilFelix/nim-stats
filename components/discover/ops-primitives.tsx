"use client";

import type { ReactNode } from "react";
import { HorizontalSparkline } from "./horizontal-sparkline";
import { cn } from "@/lib/utils";

export type Tone = "healthy" | "warn" | "critical" | "info" | "neutral";

// Status colour never sets text (R16): every tone reads as ink. The sparkline
// stroke (TONE_VAR) and the state shapes carry the colour.
const TONE_TEXT: Record<Tone, string> = {
  healthy: "text-text-primary",
  warn: "text-text-primary",
  critical: "text-text-primary",
  info: "text-text-primary",
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
  className,
}: {
  label: string;
  meta?: ReactNode;
  icon?: React.ElementType;
  /** Accepted for call-site compatibility; headers no longer tint by tone. */
  tone?: Tone;
  className?: string;
}) {
  return (
    <div className={cn("hdiv", className)}>
      <div className="flex min-w-0 items-center gap-2.5">
        {Icon && <Icon className="h-4 w-4 shrink-0 text-text-muted" aria-hidden="true" />}
        <h2 className="heading-md truncate">{label}</h2>
      </div>
      {meta != null && (
        <div className="body-sm flex min-w-0 flex-wrap items-center gap-2 text-text-muted">{meta}</div>
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
  /** Which direction is "good"; announced to screen readers, never coloured. */
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
  const arrow = flat ? "—" : up ? "↑" : "↓";
  // Direction is the arrow plus a word for screen readers; whether it is good
  // or bad is the reader's call, so nothing is coloured.
  const good = flat ? null : goodWhen === "up" ? up : !up;

  return (
    <span className={cn("metric-xs inline-flex items-center gap-1 text-text-muted", className)}>
      <span aria-hidden="true">{arrow}</span>
      {Math.abs(value).toFixed(Math.abs(value) >= 10 ? 0 : 1)}
      {unit}
      <span className="sr-only">{good == null ? "no change" : good ? "better" : "worse"}</span>
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
        <span className="body-sm truncate text-text-muted">{label}</span>
        {delta}
      </div>
      <div className="flex items-baseline gap-1">
        <span className={cn("metric-xl", TONE_TEXT[tone])}>{display}</span>
        {unit && <span className="body-sm text-text-muted">{unit}</span>}
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
