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
}

export const MODELS: NIMModel[] = [
  {
    id: "llama-4-maverick",
    name: "Llama 4 Maverick",
    provider: "Meta",
    status: "healthy",
    uptime: 99.97,
    ttft: 142,
    throughput: 89.3,
    reliability: 98,
    congestion: 23,
    lastChecked: new Date(Date.now() - 30_000),
    reliabilityHistory: Array.from({ length: 24 }, (_, i) => ({ time: `${i}:00`, score: 96 + Math.random() * 4 })),
    throughputHistory: Array.from({ length: 24 }, () => 80 + Math.random() * 18),
  },
  {
    id: "llama-3-3-70b",
    name: "Llama 3.3 70B",
    provider: "Meta",
    status: "healthy",
    uptime: 99.95,
    ttft: 118,
    throughput: 94.1,
    reliability: 99,
    congestion: 18,
    lastChecked: new Date(Date.now() - 45_000),
    reliabilityHistory: Array.from({ length: 24 }, (_, i) => ({ time: `${i}:00`, score: 97 + Math.random() * 3 })),
    throughputHistory: Array.from({ length: 24 }, () => 85 + Math.random() * 12),
  },
  {
    id: "llama-3-1-405b",
    name: "Llama 3.1 405B",
    provider: "Meta",
    status: "busy",
    uptime: 99.85,
    ttft: 340,
    throughput: 52.7,
    reliability: 94,
    congestion: 71,
    lastChecked: new Date(Date.now() - 60_000),
    reliabilityHistory: Array.from({ length: 24 }, (_, i) => ({ time: `${i}:00`, score: 88 + Math.random() * 12 })),
    throughputHistory: Array.from({ length: 24 }, () => 40 + Math.random() * 20),
  },
  {
    id: "mistral-large",
    name: "Mistral Large",
    provider: "Mistral",
    status: "healthy",
    uptime: 99.92,
    ttft: 165,
    throughput: 78.4,
    reliability: 96,
    congestion: 34,
    lastChecked: new Date(Date.now() - 15_000),
    reliabilityHistory: Array.from({ length: 24 }, (_, i) => ({ time: `${i}:00`, score: 94 + Math.random() * 5 })),
    throughputHistory: Array.from({ length: 24 }, () => 70 + Math.random() * 15),
  },
  {
    id: "gemma-3-27b",
    name: "Gemma 3 27B",
    provider: "Google",
    status: "healthy",
    uptime: 99.99,
    ttft: 98,
    throughput: 102.2,
    reliability: 99,
    congestion: 12,
    lastChecked: new Date(Date.now() - 20_000),
    reliabilityHistory: Array.from({ length: 24 }, (_, i) => ({ time: `${i}:00`, score: 98 + Math.random() * 2 })),
    throughputHistory: Array.from({ length: 24 }, () => 95 + Math.random() * 12),
  },
  {
    id: "phi-4",
    name: "Phi-4",
    provider: "Microsoft",
    status: "busy",
    uptime: 99.78,
    ttft: 218,
    throughput: 61.5,
    reliability: 91,
    congestion: 58,
    lastChecked: new Date(Date.now() - 90_000),
    reliabilityHistory: Array.from({ length: 24 }, (_, i) => ({ time: `${i}:00`, score: 88 + Math.random() * 10 })),
    throughputHistory: Array.from({ length: 24 }, () => 55 + Math.random() * 20),
  },
  {
    id: "qwen-2-5-72b",
    name: "Qwen 2.5 72B",
    provider: "Alibaba",
    status: "healthy",
    uptime: 99.91,
    ttft: 156,
    throughput: 83.9,
    reliability: 97,
    congestion: 27,
    lastChecked: new Date(Date.now() - 35_000),
    reliabilityHistory: Array.from({ length: 24 }, (_, i) => ({ time: `${i}:00`, score: 95 + Math.random() * 5 })),
    throughputHistory: Array.from({ length: 24 }, () => 78 + Math.random() * 12),
  },
  {
    id: "deepseek-r1",
    name: "DeepSeek R1",
    provider: "DeepSeek",
    status: "jammed",
    uptime: 97.42,
    ttft: 1240,
    throughput: 12.3,
    reliability: 72,
    congestion: 96,
    lastChecked: new Date(Date.now() - 120_000),
    reliabilityHistory: Array.from({ length: 24 }, (_, i) => ({ time: `${i}:00`, score: 60 + Math.random() * 35 })),
    throughputHistory: Array.from({ length: 24 }, () => 8 + Math.random() * 25),
  },
  {
    id: "mixtral-8x7b",
    name: "Mixtral 8x7B",
    provider: "Mistral",
    status: "healthy",
    uptime: 99.88,
    ttft: 189,
    throughput: 71.6,
    reliability: 95,
    congestion: 39,
    lastChecked: new Date(Date.now() - 50_000),
    reliabilityHistory: Array.from({ length: 24 }, (_, i) => ({ time: `${i}:00`, score: 92 + Math.random() * 6 })),
    throughputHistory: Array.from({ length: 24 }, () => 65 + Math.random() * 15),
  },
  {
    id: "gemma-2-9b",
    name: "Gemma 2 9B",
    provider: "Google",
    status: "healthy",
    uptime: 99.96,
    ttft: 76,
    throughput: 118.4,
    reliability: 99,
    congestion: 15,
    lastChecked: new Date(Date.now() - 25_000),
    reliabilityHistory: Array.from({ length: 24 }, (_, i) => ({ time: `${i}:00`, score: 97 + Math.random() * 3 })),
    throughputHistory: Array.from({ length: 24 }, () => 108 + Math.random() * 15),
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
