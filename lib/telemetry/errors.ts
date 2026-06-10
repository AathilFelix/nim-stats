export enum ErrorCode {
 none = "none",
 RateLimit = "RateLimit",
 Server = "Server",
 BadGateway = "BadGateway",
 ServiceUnavailable = "ServiceUnavailable",
 GatewayTimeout = "GatewayTimeout",
 Network = "Network",
 Unknown = "Unknown",
}

export enum OperationalState {
 healthy = "healthy",
 busy = "busy",
 jammed = "jammed",
 unknown = "unknown",
}

export interface OperationalThresholds {
 ttftHealthyMax: number
 ttftBusyMax: number
 errorRateHealthyMax: number
 errorRateBusyMax: number
 timeoutRateBusyMax: number
}

export const DEFAULT_THRESHOLDS: OperationalThresholds = {
 ttftHealthyMax: 150,
 ttftBusyMax: 500,
 errorRateHealthyMax: 0.05,
 errorRateBusyMax: 0.20,
 timeoutRateBusyMax: 0.10,
}

export interface ProbeTiming {
 ttftMs: number
 latencyMs: number
 startTime: number
 endTime: number
}

export interface ProbeMeasurement {
 tokensIn: number
 tokensOut: number
 throughput: number
}

export interface ProbeResult {
 modelId: string
 modelName: string
 timing: ProbeTiming
 measurement: ProbeMeasurement
 success: boolean
 errorCode: ErrorCode
 errorMessage?: string
 timeout: boolean
}

export interface AggregateResult {
 count: number
 avgTtftMs: number | null
 avgLatencyMs: number | null
 avgThroughput: number | null
 avgCongestion: number | null
 successRate: number | null
 errorRate: number | null
 timeoutRate: number | null
 p50TtftMs: number | null
 p95TtftMs: number | null
 p99TtftMs: number | null
 minTtftMs: number | null
 maxTtftMs: number | null
}

export function classFromStatus(status: number | undefined): ErrorCode {
 if (!status) return ErrorCode.Network
 switch (status) {
  case 429: return ErrorCode.RateLimit
  case 400: return ErrorCode.BadGateway
  case 503: return ErrorCode.ServiceUnavailable
  case 504: return ErrorCode.GatewayTimeout
  case 500:
  case 502:
   return ErrorCode.Server
  default:
   return ErrorCode.Unknown
 }
}

export function classFromError(err: unknown): { code: ErrorCode; message: string } {
 if (err instanceof Error) {
  const lower = err.message.toLowerCase()
  if (lower.includes("fetch failed") || lower.includes("econnreset")) {
   return { code: ErrorCode.Network, message: err.message }
  }
  if (lower.includes("abort")) return { code: ErrorCode.Unknown, message: "Request aborted" }
  if (lower.includes("timeout")) return { code: ErrorCode.GatewayTimeout, message: err.message }
  return { code: ErrorCode.Unknown, message: err.message }
 }
 return { code: ErrorCode.Unknown, message: "Unknown error" }
}

type Thresholds = Required<OperationalThresholds>

let cached: Thresholds | null = null

function readEnvInt(key: string, fallback: number): number {
 const raw = process.env[key]
 if (raw == null) return fallback
 const n = Number.parseInt(raw, 10)
 if (Number.isFinite(n) && n > 0) return n
 return fallback
}

export function loadThresholds(): Thresholds {
 if (cached) return cached
 cached = {
  ttftHealthyMax: readEnvInt("TTFT_HEALTHY_MAX", DEFAULT_THRESHOLDS.ttftHealthyMax),
  ttftBusyMax: readEnvInt("TTFT_BUSY_MAX", DEFAULT_THRESHOLDS.ttftBusyMax),
  errorRateHealthyMax: readEnvInt("ERROR_RATE_HEALTHY_MAX", DEFAULT_THRESHOLDS.errorRateHealthyMax),
  errorRateBusyMax: readEnvInt("ERROR_RATE_BUSY_MAX", DEFAULT_THRESHOLDS.errorRateBusyMax),
  timeoutRateBusyMax: readEnvInt("TIMEOUT_RATE_BUSY_MAX", DEFAULT_THRESHOLDS.timeoutRateBusyMax),
 }
 return cached
}

export function classifyState(
 samples: Array<{
  ttftMs: number | null
  success: boolean
  errorCode: string
  timeout: boolean
 }>,
 congestionScore: number,
 thresholds?: Thresholds
): OperationalState {
 const t = thresholds ?? cached ?? loadThresholds()

 if (!samples.length) return OperationalState.unknown

 const n = samples.length
 const errorRate = samples.filter((s) => !s.success).length / n
 const timeoutRate = samples.filter((s) => s.timeout).length / n

 const ttfts = samples.map((s) => s.ttftMs).filter((v): v is number => v != null)
 const avgTtft = ttfts.length ? ttfts.reduce((a: number, b: number) => a + b, 0) / ttfts.length : Infinity

 if (congestionScore >= 0.65 || errorRate >= t.errorRateBusyMax || timeoutRate >= t.timeoutRateBusyMax) {
  return OperationalState.jammed
 }
 if (avgTtft > t.ttftBusyMax || congestionScore >= 0.35 || errorRate >= t.errorRateHealthyMax) {
  return OperationalState.busy
 }
 return OperationalState.healthy
}

export function computeCongestionScore(samples: ProbeResult[]): number {
 if (!samples.length) return 1.0

 const n = samples.length
 const errorFraction = samples.filter((s) => !s.success).length / n
 const timeoutFraction = samples.filter((s) => s.timeout).length / n
 const ttfts = samples.map((s) => s.timing.ttftMs).filter((v): v is number => v != null)
 const minTtft = ttfts.length ? Math.min(...ttfts) : 0
 const maxTtft = ttfts.length ? Math.max(...ttfts) : 0
 const avgTtft = ttfts.length ? ttfts.reduce((a: number, b: number) => a + b, 0) / ttfts.length : 0
 const range = maxTtft - minTtft || 1
 const normalizedTtft = range > 0 ? Math.min(1, Math.max(0, (avgTtft - minTtft) / range)) : 0

 const errorNoise = computeErrorNoise(samples.map((s) => s.success))
 const score =
  errorFraction * 0.35 +
  timeoutFraction * 0.25 +
  normalizedTtft * 0.25 +
  (1 - errorNoise) * 0.15

 return Math.max(0, Math.min(1, score))
}

function computeErrorNoise(successes: boolean[]): number {
 if (successes.length < 2) return 0.5
 let transitions = 0
 for (let i = 1; i < successes.length; i++) {
  if (successes[i] !== successes[i - 1]) transitions++
 }
 return 1 - transitions / (successes.length - 1)
}

export function classifyWithCongestion(
 samples: ProbeResult[],
 thresholds?: Thresholds
): { state: OperationalState; congestion: number } {
 const congestion = computeCongestionScore(samples)
 const simplified = samples.map((s) => ({
  ttftMs: s.timing.ttftMs,
  success: s.success,
  errorCode: s.errorCode,
  timeout: s.timeout,
 }))
 const state = classifyState(simplified, congestion, thresholds)
 return { state, congestion }
}
