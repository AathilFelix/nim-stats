export type SessionReliabilityState =
  | "stable"
  | "moderate_interruption_risk"
  | "unstable"
  | "avoid_for_long_sessions";

export type VolatilityMeasure = "stable" | "fluctuating" | "highly_unstable";
export type CongestionTrend = "improving" | "worsening" | "stable" | "rapidly_increasing";
export type RoutingConfidence = "high_confidence" | "moderate_confidence" | "avoid_for_production";
export type QueuePressure = "low" | "elevated" | "saturated";

export interface SessionReliability {
  score: number;
  state: SessionReliabilityState;
}

export interface Volatility {
  measure: VolatilityMeasure;
  score: number;
}

export interface Incident {
  id: string;
  time: string;
  severity: "info" | "warning" | "critical";
  message: string;
  modelId?: string;
}

export interface BestModelResult {
  model: Record<string, unknown>;
  reasons: string[];
  score: number;
}

export interface FleetStateResult {
  state: "healthy" | "elevated_congestion" | "partial_degradation" | "recovery_in_progress";
  detail: string;
  degradedCount: number;
  avgCongestion: number;
  jammedCount: number;
}
