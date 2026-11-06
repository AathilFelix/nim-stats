// Decides an endpoint's operational state from its recent probes.
//
// ONE function, used for every probe whether it succeeded or failed. Before this,
// a success was classified over the last ~21 probes while a failure instantly
// set "jammed" (and opened a critical incident) with no history at all, so the
// fleet's healthy count depended on whether the most recent probe happened to
// fail, and a single dropped request logged a "degradation".
//
// Rules, in order:
//   jammed  - the last JAM_STREAK probes all failed, OR (with enough samples) at
//             least errorRateBusyMax of the window failed. Once jammed, an
//             endpoint stays jammed until RECOVER_STREAK probes in a row succeed
//             AND the window is back under the bar (hysteresis), so one lucky
//             probe does not flap it.
//   busy    - the median TTFT of successful probes is over ttftBusyMax, or at
//             least MIN_FAILURES_FOR_BUSY probes failed and the error rate is
//             over errorRateHealthyMax. A single failed probe is not enough.
//   healthy - everything else.
//
// `congestion` (0-1) is a display metric on ABSOLUTE terms: error share, timeout
// share and median TTFT as a fraction of the busy bar. The old score rescaled
// TTFT between a window's own min and max, so a steady 5s endpoint and a steady
// 100ms endpoint scored alike and two samples swung it by a quarter.

import { loadThresholds, OperationalState, type OperationalThresholds } from "./errors"

/** Consecutive failures that jam an endpoint (about 30 min at the 10-min cadence). */
export const JAM_STREAK = 3
/** Consecutive successes required to leave "jammed". */
export const RECOVER_STREAK = 2
/** A window needs this many probes before its error RATE can jam an endpoint. */
export const MIN_WINDOW_FOR_RATE = 4
/** Failed probes needed before the error rate alone makes an endpoint busy. */
export const MIN_FAILURES_FOR_BUSY = 2
/** Probes older than this are not evidence about the endpoint's current state. */
export const WINDOW_MAX_AGE_MS = 6 * 3_600_000
/** Window size, newest first, including the probe being recorded. */
export const WINDOW_SIZE = 21

export interface WindowSample {
  success: boolean
  timeout: boolean
  ttftMs: number | null
}

export interface StateDecision {
  state: OperationalState
  /** 0-1, absolute (see header). */
  congestion: number
  /** Share of the window that failed, 0-1. */
  errorRate: number
}

type Thresholds = Required<OperationalThresholds>

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b)
  const mid = sorted.length >> 1
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

const clamp01 = (n: number) => Math.max(0, Math.min(1, n))

/**
 * @param window newest first, INCLUDING the probe being recorded
 * @param prev   the endpoint's current stored state (null if never probed)
 */
export function decideState(
  window: WindowSample[],
  prev: OperationalState | null,
  thresholds: Thresholds = loadThresholds(),
): StateDecision {
  const n = window.length
  if (!n) return { state: OperationalState.unknown, congestion: 0, errorRate: 0 }

  const failures = window.filter((s) => !s.success).length
  const timeouts = window.filter((s) => s.timeout).length
  const errorRate = failures / n
  const timeoutRate = timeouts / n

  let streakFail = 0
  while (streakFail < n && !window[streakFail].success) streakFail++
  let streakOk = 0
  while (streakOk < n && window[streakOk].success) streakOk++

  // Only successful probes have a real TTFT; a failure's placeholder would drag
  // the figure down. Median, so one slow cold start doesn't flip the state.
  const ttfts = window.filter((s) => s.success).map((s) => s.ttftMs).filter((v): v is number => v != null)
  const typicalTtft = ttfts.length ? median(ttfts) : Infinity

  const congestion = clamp01(
    0.5 * errorRate + 0.15 * timeoutRate + 0.35 * (ttfts.length ? clamp01(typicalTtft / thresholds.ttftBusyMax) : 1),
  )
  const decide = (state: OperationalState): StateDecision => ({ state, congestion, errorRate })

  const rateEnough = n >= MIN_WINDOW_FOR_RATE
  const jamNow =
    streakFail >= JAM_STREAK ||
    (rateEnough && (errorRate >= thresholds.errorRateBusyMax || timeoutRate >= thresholds.timeoutRateBusyMax))

  if (prev === OperationalState.jammed) {
    const recovered = streakOk >= RECOVER_STREAK && errorRate < thresholds.errorRateBusyMax
    if (!recovered) return decide(OperationalState.jammed)
  } else if (jamNow) {
    return decide(OperationalState.jammed)
  }

  // No successful probe to judge TTFT by, but not jammed yet (e.g. the very first
  // probe failed): say nothing rather than call it healthy or busy.
  if (!ttfts.length) return decide(prev ?? OperationalState.unknown)

  if (
    typicalTtft > thresholds.ttftBusyMax ||
    (failures >= MIN_FAILURES_FOR_BUSY && errorRate >= thresholds.errorRateHealthyMax)
  ) {
    return decide(OperationalState.busy)
  }
  return decide(OperationalState.healthy)
}

// ── Failure taxonomy ─────────────────────────────────────────────────────────
// Three different things used to be one red "jammed" dot:
//   unavailable - the gateway says this key cannot call the model (404/410/…):
//                 it is listed but not served, which is not an outage.
//   hung        - the request got no reply inside the timeout.
//   erroring    - the endpoint answered with a server error, an error frame, or
//                 an empty stream.

export type FailureKind = "unavailable" | "hung" | "erroring"

/** Statuses meaning "this endpoint does not serve chat for us", not "it is down". */
export const NOT_CALLABLE_STATUSES: ReadonlySet<number> = new Set([400, 404, 405, 410, 422])

export function failureKind(f: { timeout: boolean; errorMessage?: string | null }): FailureKind {
  const m = /^HTTP (\d{3})$/.exec(f.errorMessage ?? "")
  if (m && NOT_CALLABLE_STATUSES.has(Number(m[1]))) return "unavailable"
  if (f.timeout) return "hung"
  return "erroring"
}
