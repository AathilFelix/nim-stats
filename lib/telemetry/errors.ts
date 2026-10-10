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

// TTFT is measured end to end from the collector (a GitHub runner), through
// NVIDIA's API gateway and queue, so it carries a floor well above raw model
// latency. Endpoints that served every probe for hours sit at a median of
// ~0.1–2.2s; the old 500ms busy bar labelled almost all of them "busy" and left
// the dashboard showing 2 healthy out of 17 serving. 3s on the MEDIAN marks the
// genuinely slow ones without one cold-start outlier tipping a model over.
//
// Jammed means failing MOST of the time. At 20% errors / 10% timeouts, three
// 15s timeouts in ~3.5h jammed an endpoint that answered the other 18 probes,
// so "busy" never appeared and intermittent endpoints read as dead. Busy now
// covers anything still answering most probes; timeouts are also errors, so
// the timeout bar matches the error bar instead of sitting below it.
export const DEFAULT_THRESHOLDS: OperationalThresholds = {
 ttftHealthyMax: 150,
 ttftBusyMax: 3000,
 errorRateHealthyMax: 0.05,
 errorRateBusyMax: 0.5,
 timeoutRateBusyMax: 0.5,
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

// parseFloat, not parseInt: the rate thresholds are fractions, and parseInt
// turned "0.1" into 0, which failed the > 0 check and silently fell back.
function readEnvNumber(key: string, fallback: number): number {
 const raw = process.env[key]
 if (raw == null) return fallback
 const n = Number.parseFloat(raw)
 if (Number.isFinite(n) && n > 0) return n
 return fallback
}

export function loadThresholds(): Thresholds {
 if (cached) return cached
 cached = {
  ttftHealthyMax: readEnvNumber("TTFT_HEALTHY_MAX", DEFAULT_THRESHOLDS.ttftHealthyMax),
  ttftBusyMax: readEnvNumber("TTFT_BUSY_MAX", DEFAULT_THRESHOLDS.ttftBusyMax),
  errorRateHealthyMax: readEnvNumber("ERROR_RATE_HEALTHY_MAX", DEFAULT_THRESHOLDS.errorRateHealthyMax),
  errorRateBusyMax: readEnvNumber("ERROR_RATE_BUSY_MAX", DEFAULT_THRESHOLDS.errorRateBusyMax),
  timeoutRateBusyMax: readEnvNumber("TIMEOUT_RATE_BUSY_MAX", DEFAULT_THRESHOLDS.timeoutRateBusyMax),
 }
 return cached
}

function median(values: number[]): number {
 const sorted = [...values].sort((a, b) => a - b)
 const mid = sorted.length >> 1
 return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
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

 // Only successful probes have a real TTFT; a failure's placeholder 0 would
 // drag the figure down. Median, so one slow cold start doesn't flip the state.
 const ttfts = samples
  .filter((s) => s.success)
  .map((s) => s.ttftMs)
  .filter((v): v is number => v != null)
 const typicalTtft = ttfts.length ? median(ttfts) : Infinity

 if (congestionScore >= 0.65 || errorRate >= t.errorRateBusyMax || timeoutRate >= t.timeoutRateBusyMax) {
  return OperationalState.jammed
 }
 if (typicalTtft > t.ttftBusyMax || congestionScore >= 0.35 || errorRate >= t.errorRateHealthyMax) {
  return OperationalState.busy
 }
 return OperationalState.healthy
}

export function computeCongestionScore(samples: ProbeResult[]): number {
 if (!samples.length) return 1.0

 const n = samples.length
 const errorFraction = samples.filter((s) => !s.success).length / n
 const timeoutFraction = samples.filter((s) => s.timeout).length / n
 const ttfts = samples.filter((s) => s.success).map((s) => s.timing.ttftMs).filter((v): v is number => v != null)
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
