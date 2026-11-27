"use client";

import { useMemo } from "react";
import { Activity } from "lucide-react";
import type { NIMModel } from "../dashboard/mock-data";
import { StatusDot, FleetBar } from "./discover-primitives";
import { Vital, Delta } from "./ops-primitives";

interface Props {
  models: NIMModel[];
}

/** Average a per-model history series index-by-index into one fleet series. */
function fleetSeries(series: number[][], len = 24): number[] {
  const valid = series.filter((s) => s.length > 1);
  if (!valid.length) return [];
  const n = Math.min(len, ...valid.map((s) => s.length));
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    let sum = 0;
    for (const s of valid) sum += s[s.length - n + i];
    out.push(sum / valid.length);
  }
  return out;
}

/** Percent change between the first and last point of a series. */
function pctDelta(series: number[]): number {
  if (series.length < 2) return 0;
  const first = series[0];
  const last = series[series.length - 1];
  if (!first) return 0;
  return ((last - first) / first) * 100;
}

export function FleetIntelligence({ models }: Props) {
  const f = useMemo(() => {
    const healthy = models.filter((m) => m.status === "healthy").length;
    const busy = models.filter((m) => m.status === "busy").length;
    const jammed = models.filter((m) => m.status === "jammed").length;
    const degraded = busy + jammed;

    const measuredTput = models.filter((m) => m.throughput > 0);
    const avgThroughput = measuredTput.length
      ? measuredTput.reduce((a, m) => a + m.throughput, 0) / measuredTput.length
      : 0;
    const withP95 = models.filter((m) => m.p95Latency > 0);
    const avgP95 = withP95.length ? withP95.reduce((a, m) => a + m.p95Latency, 0) / withP95.length : 0;
    const avgReliability = models.reduce((a, m) => a + m.reliability, 0) / models.length;
    const avgCongestion = models.reduce((a, m) => a + m.congestion, 0) / models.length;

    const tputSeries = fleetSeries(models.map((m) => m.throughputHistory));
    const relSeries = fleetSeries(models.map((m) => m.reliabilityHistory.map((p) => p.score)));
    const latSeries = fleetSeries(models.map((m) => m.latencyHistory));
    const congSeries = relSeries.map((s) => Math.max(0, 100 - s));

    return {
      healthy, busy, jammed, degraded, total: models.length,
      avgThroughput, avgP95, avgReliability, avgCongestion,
      tputSeries, relSeries, latSeries, congSeries,
      tputDelta: pctDelta(tputSeries),
      relDelta: relSeries.length > 1 ? relSeries[relSeries.length - 1] - relSeries[0] : 0,
      latDelta: pctDelta(latSeries),
      congDelta: congSeries.length > 1 ? congSeries[congSeries.length - 1] - congSeries[0] : 0,
    };
  }, [models]);

  const verdict =
    f.jammed > 0 ? { label: "Fleet degraded", tone: "critical" as const, status: "jammed" as const }
    : f.busy > 0 ? { label: "Fleet strained", tone: "warn" as const, status: "busy" as const }
    : { label: "Fleet nominal", tone: "healthy" as const, status: "healthy" as const };

  const relTone = f.avgReliability >= 99 ? "healthy" : f.avgReliability >= 97 ? "warn" : "critical";
  const congTone = f.avgCongestion < 35 ? "healthy" : f.avgCongestion < 60 ? "warn" : "critical";

  return (
    <section className="fleet-hero overflow-hidden">
      {/* Verdict strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 sm:px-6 border-b border-border-subtle">
        <div className="flex items-center gap-3">
          <StatusDot status={verdict.status} size={11} />
          <div className="flex flex-col">
            <span className="heading-md leading-tight text-text-primary">{verdict.label}</span>
            <span className="body-sm mt-0.5 text-text-muted">
              {f.healthy} of {f.total} endpoints operational
              {f.degraded > 0 ? ` · ${f.degraded} degraded` : ""}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <FleetBar healthy={f.healthy} busy={f.busy} jammed={f.jammed} className="w-32 sm:w-44" />
          <div className="hidden items-center gap-3 sm:flex">
            <Legend tone="healthy" value={f.healthy} />
            <Legend tone="warn" value={f.busy} />
            <Legend tone="critical" value={f.jammed} />
          </div>
          <span className="hidden items-center gap-1.5 lg:inline-flex pl-1">
            <Activity className="h-3.5 w-3.5 text-text-muted" aria-hidden="true" />
            <span className="label-sm text-text-muted">Live</span>
          </span>
        </div>
      </div>

      {/* Vitals grid */}
      <div className="grid grid-cols-2 divide-x divide-y divide-border-subtle sm:grid-cols-4 sm:divide-y-0">
        <div className="p-4 sm:p-5">
          <Vital
            label="Throughput"
            value={f.avgThroughput.toFixed(1)}
            unit="tok/s"
            tone="info"
            data={f.tputSeries}
            delta={<Delta value={f.tputDelta} unit="%" goodWhen="up" />}
          />
        </div>
        <div className="p-4 sm:p-5">
          <Vital
            label="P95 latency"
            value={Math.round(f.avgP95)}
            unit="ms"
            tone="neutral"
            data={f.latSeries}
            delta={<Delta value={f.latDelta} unit="%" goodWhen="down" />}
          />
        </div>
        <div className="p-4 sm:p-5">
          <Vital
            label="Reliability"
            value={`${f.avgReliability.toFixed(1)}%`}
            tone={relTone}
            data={f.relSeries}
            delta={<Delta value={f.relDelta} unit="pt" goodWhen="up" />}
          />
        </div>
        <div className="p-4 sm:p-5">
          <Vital
            label="Congestion"
            value={`${Math.round(f.avgCongestion)}%`}
            tone={congTone}
            data={f.congSeries}
            delta={<Delta value={f.congDelta} unit="pt" goodWhen="down" />}
          />
        </div>
      </div>
    </section>
  );
}

function Legend({ tone, value }: { tone: "healthy" | "warn" | "critical"; value: number }) {
  return (
    <span className="flex items-center gap-1.5 metric-xs text-text-primary">
      <StatusDot status={tone === "healthy" ? "healthy" : tone === "warn" ? "busy" : "jammed"} size={8} />
      {value}
    </span>
  );
}
