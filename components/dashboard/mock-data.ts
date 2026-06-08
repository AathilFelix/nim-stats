export type ModelStatus = "healthy" | "busy" | "jammed";

export interface ReliabilityPoint {
  time: string;
  score: number;
}

export interface NIMModel {
  id: string;
  name: string;
  provider: string;
  status: ModelStatus;
  uptime: number;
  ttft: number;
  throughput: number;
  reliability: number;
  congestion: number;
  lastChecked: Date;
  reliabilityHistory: ReliabilityPoint[];
  throughputHistory: number[];
  sessionReliability: { score: number; state: string };
  volatility: { measure: string; score: number };
  recovery: string;
  congestionTrend: string;
  routingConfidence: string;
  timeoutRate: number;
  p95Latency: number;
  p99Latency: number;
  queuePressure: string;
  incidents: Array<{ id: string; time: string; severity: string; message: string; modelId?: string }>;
  latencyHistory: number[];
}

const seed = Date.now();
function rng(offset = 0) {
  return Math.abs(Math.sin(seed + offset)) % 1;
}

const now = Date.now();

function makeIncidents(id: string, name: string, status: string, congestion: number, timeoutRate: number): Array<{ id: string; time: string; severity: string; message: string }> {
  const incs: Array<{ id: string; time: string; severity: string; message: string }> = [];
  const t = now;
  if (status === "jammed") {
    incs.push({ id: `${id}-c1`, time: fmt(t - 300000 + Math.random() * 200000), severity: "critical", message: `${name} congestion spike detected` });
    incs.push({ id: `${id}-c2`, time: fmt(t - 1200000 + Math.random() * 600000), severity: "critical", message: `${name} timeout rate elevated` });
    incs.push({ id: `${id}-w1`, time: fmt(t - 1800000 + Math.random() * 900000), severity: "warning", message: `${name} throughput degradation on primary endpoint` });
  }
  if (congestion > 50 && status !== "jammed") {
    incs.push({ id: `${id}-w2`, time: fmt(t - 900000 + Math.random() * 500000), severity: "warning", message: `${name} elevated congestion detected` });
  }
  if (timeoutRate > 4) {
    incs.push({ id: `${id}-w3`, time: fmt(t - 1600000 + Math.random() * 800000), severity: "warning", message: `${name} request timeout frequency above threshold` });
  }
  if (status === "healthy" && congestion < 30) {
    incs.push({ id: `${id}-i1`, time: fmt(t - 700000 - Math.random() * 400000), severity: "info", message: `${name} recovered after brief instability` });
  }
  if (incs.length === 0 && Math.random() > 0.3) {
    incs.push({ id: `${id}-i2`, time: fmt(t - 2400000 + Math.random() * 1200000), severity: "info", message: `${name} routine health check passed` });
  }
  return incs.sort((a, b) => b.time.localeCompare(a.time));
}

function fmt(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

function latHist(ttft: number, spread: number): number[] {
  return Array.from({ length: 20 }, () => Math.round(ttft * (0.7 + Math.random() * spread)));
}

export const MODELS: NIMModel[] = [
  {
    id: "llama-4-maverick", name: "Llama 4 Maverick", provider: "Meta", status: "healthy", uptime: 99.97,
    ttft: 142, throughput: 89.3, reliability: 98, congestion: 23, lastChecked: new Date(now - 30000),
    reliabilityHistory: Array.from({ length: 24 }, (_, i) => ({ time: `${i}:00`, score: 96 + Math.random() * 4 })),
    throughputHistory: Array.from({ length: 24 }, () => 80 + Math.random() * 18),
    sessionReliability: { score: 91, state: "stable" }, volatility: { measure: "stable", score: 3 },
    recovery: "recovered", congestionTrend: "improving", routingConfidence: "high_confidence",
    timeoutRate: 0.5, p95Latency: 210, p99Latency: 380, queuePressure: "low",
    incidents: makeIncidents("llama-4-maverick", "Llama 4 Maverick", "healthy", 23, 0.5), latencyHistory: latHist(142, 0.8),
  },
  {
    id: "llama-3-3-70b", name: "Llama 3.3 70B", provider: "Meta", status: "healthy", uptime: 99.95,
    ttft: 118, throughput: 94.1, reliability: 99, congestion: 18, lastChecked: new Date(now - 45000),
    reliabilityHistory: Array.from({ length: 24 }, (_, i) => ({ time: `${i}:00`, score: 97 + Math.random() * 3 })),
    throughputHistory: Array.from({ length: 24 }, () => 85 + Math.random() * 12),
    sessionReliability: { score: 95, state: "stable" }, volatility: { measure: "stable", score: 2 },
    recovery: "stable", congestionTrend: "improving", routingConfidence: "high_confidence",
    timeoutRate: 0.3, p95Latency: 180, p99Latency: 290, queuePressure: "low",
    incidents: makeIncidents("llama-3-3-70b", "Llama 3.3 70B", "healthy", 18, 0.3), latencyHistory: latHist(118, 0.6),
  },
  {
    id: "llama-3-1-405b", name: "Llama 3.1 405B", provider: "Meta", status: "busy", uptime: 99.85,
    ttft: 340, throughput: 52.7, reliability: 94, congestion: 71, lastChecked: new Date(now - 60000),
    reliabilityHistory: Array.from({ length: 24 }, (_, i) => ({ time: `${i}:00`, score: 88 + Math.random() * 12 })),
    throughputHistory: Array.from({ length: 24 }, () => 40 + Math.random() * 20),
    sessionReliability: { score: 72, state: "moderate_interruption_risk" }, volatility: { measure: "fluctuating", score: 12 },
    recovery: "recovering gradually", congestionTrend: "worsening", routingConfidence: "moderate_confidence",
    timeoutRate: 3.1, p95Latency: 520, p99Latency: 1100, queuePressure: "elevated",
    incidents: makeIncidents("llama-3-1-405b", "Llama 3.1 405B", "busy", 71, 3.1), latencyHistory: latHist(340, 1.5),
  },
  {
    id: "mistral-large", name: "Mistral Large", provider: "Mistral", status: "healthy", uptime: 99.92,
    ttft: 165, throughput: 78.4, reliability: 96, congestion: 34, lastChecked: new Date(now - 15000),
    reliabilityHistory: Array.from({ length: 24 }, (_, i) => ({ time: `${i}:00`, score: 94 + Math.random() * 5 })),
    throughputHistory: Array.from({ length: 24 }, () => 70 + Math.random() * 15),
    sessionReliability: { score: 86, state: "stable" }, volatility: { measure: "stable", score: 4 },
    recovery: "recovered", congestionTrend: "improving", routingConfidence: "high_confidence",
    timeoutRate: 0.6, p95Latency: 215, p99Latency: 380, queuePressure: "low",
    incidents: makeIncidents("mistral-large", "Mistral Large", "healthy", 34, 0.6), latencyHistory: latHist(165, 0.7),
  },
  {
    id: "gemma-3-27b", name: "Gemma 3 27B", provider: "Google", status: "healthy", uptime: 99.99,
    ttft: 98, throughput: 102.2, reliability: 99, congestion: 12, lastChecked: new Date(now - 20000),
    reliabilityHistory: Array.from({ length: 24 }, (_, i) => ({ time: `${i}:00`, score: 98 + Math.random() * 2 })),
    throughputHistory: Array.from({ length: 24 }, () => 95 + Math.random() * 12),
    sessionReliability: { score: 98, state: "stable" }, volatility: { measure: "stable", score: 2 },
    recovery: "stable", congestionTrend: "stable", routingConfidence: "high_confidence",
    timeoutRate: 0.1, p95Latency: 140, p99Latency: 210, queuePressure: "low",
    incidents: [], latencyHistory: latHist(98, 0.5),
  },
  {
    id: "phi-4", name: "Phi-4", provider: "Microsoft", status: "busy", uptime: 99.78,
    ttft: 218, throughput: 61.5, reliability: 91, congestion: 58, lastChecked: new Date(now - 90000),
    reliabilityHistory: Array.from({ length: 24 }, (_, i) => ({ time: `${i}:00`, score: 88 + Math.random() * 10 })),
    throughputHistory: Array.from({ length: 24 }, () => 55 + Math.random() * 20),
    sessionReliability: { score: 62, state: "moderate_interruption_risk" }, volatility: { measure: "fluctuating", score: 14 },
    recovery: "unstable recovery pattern", congestionTrend: "worsening", routingConfidence: "moderate_confidence",
    timeoutRate: 4.5, p95Latency: 310, p99Latency: 580, queuePressure: "elevated",
    incidents: makeIncidents("phi-4", "Phi-4", "busy", 58, 4.5), latencyHistory: latHist(218, 1.2),
  },
  {
    id: "qwen-2-5-72b", name: "Qwen 2.5 72B", provider: "Alibaba", status: "healthy", uptime: 99.91,
    ttft: 156, throughput: 83.9, reliability: 97, congestion: 27, lastChecked: new Date(now - 35000),
    reliabilityHistory: Array.from({ length: 24 }, (_, i) => ({ time: `${i}:00`, score: 95 + Math.random() * 5 })),
    throughputHistory: Array.from({ length: 24 }, () => 78 + Math.random() * 12),
    sessionReliability: { score: 87, state: "stable" }, volatility: { measure: "stable", score: 3 },
    recovery: "stable", congestionTrend: "stable", routingConfidence: "high_confidence",
    timeoutRate: 0.4, p95Latency: 195, p99Latency: 340, queuePressure: "low",
    incidents: [], latencyHistory: latHist(156, 0.6),
  },
  {
    id: "deepseek-r1", name: "DeepSeek R1", provider: "DeepSeek", status: "jammed", uptime: 97.42,
    ttft: 1240, throughput: 12.3, reliability: 72, congestion: 96, lastChecked: new Date(now - 120000),
    reliabilityHistory: Array.from({ length: 24 }, (_, i) => ({ time: `${i}:00`, score: 60 + Math.random() * 35 })),
    throughputHistory: Array.from({ length: 24 }, () => 8 + Math.random() * 25),
    sessionReliability: { score: 35, state: "avoid_for_long_sessions" }, volatility: { measure: "highly_unstable", score: 28 },
    recovery: "sustained degradation", congestionTrend: "rapidly_increasing", routingConfidence: "avoid_for_production",
    timeoutRate: 15.2, p95Latency: 2100, p99Latency: 4500, queuePressure: "saturated",
    incidents: makeIncidents("deepseek-r1", "DeepSeek R1", "jammed", 96, 15.2), latencyHistory: latHist(1240, 2.5),
  },
  {
    id: "mixtral-8x7b", name: "Mixtral 8x7B", provider: "Mistral", status: "healthy", uptime: 99.88,
    ttft: 189, throughput: 71.6, reliability: 95, congestion: 39, lastChecked: new Date(now - 50000),
    reliabilityHistory: Array.from({ length: 24 }, (_, i) => ({ time: `${i}:00`, score: 92 + Math.random() * 6 })),
    throughputHistory: Array.from({ length: 24 }, () => 65 + Math.random() * 15),
    sessionReliability: { score: 85, state: "stable" }, volatility: { measure: "stable", score: 4 },
    recovery: "stable", congestionTrend: "stable", routingConfidence: "high_confidence",
    timeoutRate: 0.8, p95Latency: 240, p99Latency: 420, queuePressure: "low",
    incidents: [], latencyHistory: latHist(189, 0.8),
  },
  {
    id: "gemma-2-9b", name: "Gemma 2 9B", provider: "Google", status: "healthy", uptime: 99.96,
    ttft: 76, throughput: 118.4, reliability: 99, congestion: 15, lastChecked: new Date(now - 25000),
    reliabilityHistory: Array.from({ length: 24 }, (_, i) => ({ time: `${i}:00`, score: 97 + Math.random() * 3 })),
    throughputHistory: Array.from({ length: 24 }, () => 108 + Math.random() * 15),
    sessionReliability: { score: 98, state: "stable" }, volatility: { measure: "stable", score: 2 },
    recovery: "stable", congestionTrend: "stable", routingConfidence: "high_confidence",
    timeoutRate: 0.1, p95Latency: 120, p99Latency: 195, queuePressure: "low",
    incidents: [], latencyHistory: latHist(76, 0.5),
  },
];

export const LIVE_UPTIME_DATA = Array.from({ length: 30 }, (_, i) => ({
  time: `${30 - i}m ago`,
  allModels: 99.2 + Math.random() * 0.8,
  fastModels: 99.5 + Math.random() * 0.5,
}));

export function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  return `${Math.floor(seconds / 60)}m ago`;
}

export function getStatusColor(status: ModelStatus): string {
  switch (status) {
    case "healthy": return "#10b981";
    case "busy": return "#f59e0b";
    case "jammed": return "#ef4444";
  }
}

export function getStatusBg(status: ModelStatus): string {
  switch (status) {
    case "healthy": return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    case "busy": return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    case "jammed": return "bg-red-500/10 text-red-400 border-red-500/20";
  }
}
