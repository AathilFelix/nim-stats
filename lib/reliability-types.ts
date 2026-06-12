// Shared (client + server safe) shapes for the reliability breakdown that powers
// the uptime calendar, time-of-day heatmap and SLA tracker.

export interface DayUptime {
  /** YYYY-MM-DD (UTC). */
  date: string;
  total: number;
  ok: number;
  /** Success rate 0–100, or null when no samples that day. */
  uptime: number | null;
}

export interface HourBucket {
  /** Hour of day 0–23 (UTC). */
  hour: number;
  total: number;
  ok: number;
  avgTtft: number | null;
  avgLatency: number | null;
  /** Success rate 0–100, or null when no samples in that hour. */
  uptime: number | null;
}

export interface SlaWindow {
  total: number;
  ok: number;
  uptime: number | null;
}

export interface ModelReliability {
  id: string;
  name: string;
  provider: string;
  days: DayUptime[];
  hours: HourBucket[];
  sla: {
    d1: SlaWindow;
    d7: SlaWindow;
    d30: SlaWindow;
  };
}

export interface ReliabilityResponse {
  updatedAt: string;
  days: number;
  models: ModelReliability[];
}
