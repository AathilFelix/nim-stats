import type {
  SessionReliability,
  SessionReliabilityState,
  VolatilityMeasure,
  Volatility,
  CongestionTrend,
  RoutingConfidence,
  QueuePressure,
  Incident,
  BestModelResult,
  FleetStateResult,
} from "./operational-types";
import type { NIMModel } from "../components/dashboard/mock-data";

function stddev(arr: number[]): number {
  if (arr.length < 2) return 0;
  const mean = arr.reduce((a: number, b: number) => a + b, 0) / arr.length;
  return Math.sqrt(arr.reduce((s: number, v: number) => s + (v - mean) ** 2, 0) / arr.length);
}

function fmtTime(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

export function computeSessionReliability(
  model: NIMModel & { timeoutRate?: number },
): SessionReliability {
  const { uptime, reliability, congestion } = model;
  const timeoutRate = model.timeoutRate ?? 1;
  const score = Math.round(
    uptime * 0.3 +
      reliability * 0.3 +
      Math.max(0, 100 - congestion) * 0.2 +
      Math.max(0, 100 - timeoutRate * 5) * 0.2,
  );
  let state: SessionReliabilityState;
  if (score >= 90) state = "stable";
  else if (score >= 75) state = "moderate_interruption_risk";
  else if (score >= 55) state = "unstable";
  else state = "avoid_for_long_sessions";
  return { score, state };
}

export function computeVolatility(
  model: NIMModel & { throughputHistory: number[]; latencyHistory: number[] },
): Volatility {
  const tVol = stddev(model.throughputHistory);
  const lVol = stddev(model.latencyHistory);
  const combined = Math.round(tVol * 0.6 + lVol * 0.4);
  let measure: VolatilityMeasure;
  if (combined < 5) measure = "stable";
  else if (combined < 15) measure = "fluctuating";
  else measure = "highly_unstable";
  return { measure, score: combined };
}

export function computeRecovery(model: Record<string, unknown>): string {
  const trend = model.congestionTrend as CongestionTrend | undefined;
  if (trend === "improving") return "recovered";
  if (trend === "rapidly_increasing") return "sustained degradation";
  if (trend === "worsening") return "recovering gradually";
  if (model.status === "jammed") return "unstable recovery pattern";
  return "stable";
}

export function computeCongestionTrend(
  model: NIMModel & { throughputHistory?: number[] },
): CongestionTrend {
  const hist = model.throughputHistory?.slice(-6) ?? [];
  if (hist.length < 2) return "stable";
  const recent = hist.slice(-3).reduce((a: number, b: number) => a + b, 0) / 3;
  const earlier = hist.slice(0, 3).reduce((a: number, b: number) => a + b, 0) / 3;
  const delta = (recent - earlier) / Math.max(earlier, 1);
  if (delta > 0.15) return "improving";
  if (delta < -0.15) return (model.congestion > 70 ? "rapidly_increasing" : "worsening") as CongestionTrend;
  return "stable";
}

export function computeRoutingConfidence(model: Record<string, unknown>): RoutingConfidence {
  const sRel = (model.sessionReliability as { score: number } | undefined)?.score ?? 50;
  const congestion = model.congestion as number;
  const uptime = model.uptime as number;
  const vol = (model.volatility as { score: number } | undefined)?.score ?? 10;
  const score =
    (100 - congestion) * 0.3 + uptime * 0.25 + Math.max(0, 100 - vol * 2) * 0.2 + sRel * 0.25;
  if (score >= 80) return "high_confidence";
  if (score >= 60) return "moderate_confidence";
  return "avoid_for_production";
}

export function computeTimeoutRate(model: NIMModel & { congestion: number; status: string }): number {
  const base = model.status === "jammed" ? 12 : model.status === "busy" ? 4 : 1;
  const cf = model.congestion / 100;
  return Math.round((base + cf * 8 + Math.random() * 2) * 10) / 10;
}

export function computeP95P99(model: NIMModel & { ttft: number; throughput: number }): { p95: number; p99: number } {
  const base = model.ttft;
  const spread = model.throughput < 30 ? 3 : model.throughput < 60 ? 2 : 1.5;
  return {
    p95: Math.round(base * spread * 0.6 + base * 0.4),
    p99: Math.round(base * spread * 0.9 + base * 0.2),
  };
}

export function computeQueuePressure(model: Record<string, unknown>): QueuePressure {
  const congestion = model.congestion as number;
  const timeoutRate = (model.timeoutRate as number) ?? 1;
  const score = congestion * 0.7 + timeoutRate * 10;
  if (score > 80) return "saturated";
  if (score > 45) return "elevated";
  return "low";
}

export function generateIncidents(
  model: NIMModel & { status: string; congestion: number; timeoutRate?: number; congestionTrend?: CongestionTrend },
  id: string,
): Incident[] {
  const incidents: Incident[] = [];
  const now = Date.now();
  const { status, congestion } = model;
  const tr = model.timeoutRate ?? 1;
  const ct = model.congestionTrend;

  if (status === "jammed") {
    incidents.push({
      id: `${id}-cr-1`,
      time: fmtTime(now - Math.random() * 600000),
      severity: "critical",
      message: `${model.name} congestion spike detected`,
      modelId: model.id,
    });
    incidents.push({
      id: `${id}-cr-2`,
      time: fmtTime(now - Math.random() * 1200000),
      severity: "critical",
      message: `${model.name} timeout rate elevated`,
      modelId: model.id,
    });
  }
  if (congestion > 50 && status !== "jammed") {
    incidents.push({
      id: `${id}-w-1`,
      time: fmtTime(now - Math.random() * 900000),
      severity: "warning",
      message: `${model.name} throughput degradation detected`,
      modelId: model.id,
    });
  }
  if (tr > 5) {
    incidents.push({
      id: `${id}-w-2`,
      time: fmtTime(now - Math.random() * 1800000),
      severity: "warning",
      message: `${model.name} timeout rate above threshold`,
      modelId: model.id,
    });
  }
  if (ct === "improving") {
    incidents.push({
      id: `${id}-i-1`,
      time: fmtTime(now - Math.random() * 600000),
      severity: "info",
      message: `${model.name} recovered after instability`,
      modelId: model.id,
    });
  }
  if (incidents.length === 0 && Math.random() > 0.4) {
    incidents.push({
      id: `${id}-i-2`,
      time: fmtTime(now - Math.random() * 2400000),
      severity: "info",
      message: `${model.name} routine health check passed`,
      modelId: model.id,
    });
  }
  return incidents.sort((a, b) => b.time.localeCompare(a.time));
}

export function enrichModel(model: NIMModel): Record<string, unknown> {
  const sessionRel = computeSessionReliability(model);
  const volatility = computeVolatility(model as NIMModel & { latencyHistory: number[] });
  const congestionTrend = computeCongestionTrend(model);
  const base: Record<string, unknown> = {
    ...model,
    sessionReliability: sessionRel,
    volatility,
    recovery: computeRecovery({ ...model, congestionTrend }),
    congestionTrend,
    routingConfidence: computeRoutingConfidence({ ...model, sessionReliability: sessionRel, volatility }),
    timeoutRate: computeTimeoutRate(model),
    p95Latency: computeP95P99(model).p95,
    p99Latency: computeP95P99(model).p99,
    queuePressure: computeQueuePressure({ ...model, sessionReliability: sessionRel }),
    incidents: generateIncidents({ ...model, congestionTrend }, model.id),
    latencyHistory: Array.from({ length: 20 }, () => Math.round(model.ttft * (0.7 + Math.random() * 0.8))),
  };
  return base;
}

export function computeFleetState(models: Record<string, unknown>[]): FleetStateResult {
  const jammed = models.filter((m) => (m.status as string) === "jammed").length;
  const avgCongestion = Math.round(models.reduce((s: number, m) => s + (m.congestion as number), 0) / models.length);
  const degraded = models.filter((m) => m.status !== "healthy").length;

  if (jammed >= 3)
    return {
      state: "partial_degradation",
      detail: `${jammed} models degraded across fleet`,
      degradedCount: degraded,
      avgCongestion,
      jammedCount: jammed,
    };
  if (avgCongestion > 55)
    return {
      state: "elevated_congestion",
      detail: `Average congestion at ${avgCongestion}% across fleet`,
      degradedCount: degraded,
      avgCongestion,
      jammedCount: jammed,
    };
  if (jammed > 0)
    return {
      state: "recovery_in_progress",
      detail: `${jammed} model recovering from degradation`,
      degradedCount: degraded,
      avgCongestion,
      jammedCount: jammed,
    };
  return {
    state: "healthy",
    detail: `All ${models.length} endpoints operating normally`,
    degradedCount: degraded,
    avgCongestion,
    jammedCount: jammed,
  };
}

export function findBestModel(models: Record<string, unknown>[]): BestModelResult {
  const sorted = models
    .filter(
      (m) => (m.routingConfidence as string) !== "avoid_for_production",
    )
    .sort((a, b) => routingScore(b) - routingScore(a));

  const best = sorted[0];
  if (!best)
    return { model: {}, reasons: ["All models currently degraded"], score: 0 } as BestModelResult;

  const reasons: string[] = [];
  if ((best.congestion as number) < 25) reasons.push(`Low congestion (${best.congestion}%)`);
  if ((best.sessionReliability as { state: string }).state === "stable")
    reasons.push("High session reliability");
  if (best.routingConfidence === "high_confidence") reasons.push("Routing confidence: high");
  if ((best.volatility as { measure: string }).measure === "stable") reasons.push("Stable throughput");
  if (best.queuePressure === "low") reasons.push("Low queue pressure");
  if ((best.uptime as number) > 99.9) reasons.push(`Excellent uptime (${best.uptime}%)`);
  if ((best.timeoutRate as number) < 1) reasons.push("Minimal timeout rate");
  if (reasons.length === 0) reasons.push("Best available option under current conditions");

  return { model: best, reasons, score: routingScore(best) };
}

function routingScore(m: Record<string, unknown>): number {
  const sRel = (m.sessionReliability as { score: number } | undefined)?.score ?? 50;
  const rw: Record<string, number> = { high_confidence: 90, moderate_confidence: 65, avoid_for_production: 30 };
  return (
    ((100 - (m.congestion as number)) * 0.3 +
      (m.uptime as number) * 0.25 +
      Math.max(0, 100 - ((m.volatility as { score: number } | undefined)?.score ?? 10) * 2) * 0.2 +
      sRel * 0.25) *
    (rw[(m.routingConfidence as string)] ?? 30) /
    100
  );
}

export function getAllIncidents(models: Record<string, unknown>[]): Incident[] {
  return models
    .flatMap((m) => {
      const incs = m.incidents as Incident[] | undefined;
      return incs ?? [];
    })
    .sort((a, b) => b.time.localeCompare(a.time))
    .slice(0, 20);
}
