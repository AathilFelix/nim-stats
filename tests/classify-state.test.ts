import { describe, expect, it } from "vitest"

import { DEFAULT_THRESHOLDS, OperationalState } from "@/lib/telemetry/errors"
import {
  decideState,
  failureKind,
  JAM_STREAK,
  RECOVER_STREAK,
  type WindowSample,
} from "@/lib/telemetry/state"

// Regression history:
//  - The busy bar was a 500ms MEAN TTFT. TTFT is measured from the collector
//    through NVIDIA's gateway, so endpoints that served every probe for hours sat
//    at 0.6-2s and were all labelled busy ("2 healthy" while 17 of 22 answered).
//  - 3 timeouts in 21 probes used to jam an endpoint that answered the other 18.
//  - A failed probe used to set "jammed" instantly with no history, while a
//    success was judged over ~21 probes, so the healthy count flipped on whichever
//    probe ran last. One decision function now serves both.

const t = { ...DEFAULT_THRESHOLDS }
const ok = (ttftMs = 1200): WindowSample => ({ ttftMs, success: true, timeout: false })
const fail = (timeout = false): WindowSample => ({ ttftMs: null, success: false, timeout })
/** A window, newest first. */
const win = (...parts: WindowSample[][]) => parts.flat()
const many = (n: number, f: () => WindowSample) => Array.from({ length: n }, f)

const H = OperationalState.healthy
const B = OperationalState.busy
const J = OperationalState.jammed

describe("decideState: TTFT", () => {
  it("calls a reliable endpoint with ~1.6s TTFT healthy", () => {
    const w = Array.from({ length: 21 }, (_, i) => ok(1200 + (i % 5) * 200))
    expect(decideState(w, H, t).state).toBe(H)
  })

  it("uses the median, so one slow cold start does not flip the state", () => {
    expect(decideState(win([ok(40_000)], many(20, () => ok(800))), H, t).state).toBe(H)
  })

  it("marks a consistently slow endpoint busy", () => {
    expect(decideState(many(21, () => ok(5000)), H, t).state).toBe(B)
  })

  it("ignores failed probes' missing TTFT", () => {
    // 4 failures spread through the window (no streak), the rest slow: busy from
    // the slow median, and the failures must not drag that median down.
    const w = win([fail()], many(3, () => ok(5000)), [fail()], many(3, () => ok(5000)), [fail()], many(3, () => ok(5000)), [fail()], many(3, () => ok(5000)))
    expect(decideState(w, B, t).state).toBe(B)
  })
})

describe("decideState: one failed probe is not an outage", () => {
  it("keeps a healthy endpoint healthy after a single failure", () => {
    const d = decideState(win([fail(true)], many(20, () => ok())), H, t)
    expect(d.state).toBe(H) // old behaviour: instantly jammed + critical incident
  })

  it("keeps it healthy after a single failure that is a timeout", () => {
    expect(decideState(win([fail(true)], many(10, () => ok())), H, t).state).toBe(H)
  })

  it("only calls it busy once failures repeat", () => {
    expect(decideState(win([fail()], many(2, () => ok()), [fail()], many(17, () => ok())), H, t).state).toBe(B)
  })

  it("does not jam on two consecutive failures", () => {
    expect(decideState(win(many(JAM_STREAK - 1, () => fail()), many(18, () => ok())), H, t).state).not.toBe(J)
  })
})

describe("decideState: jamming", () => {
  it("jams after a streak of consecutive failures, without waiting for the window to fill", () => {
    expect(decideState(win(many(JAM_STREAK, () => fail(true)), many(18, () => ok())), H, t).state).toBe(J)
  })

  it("jams an endpoint that fails most of the time even without a streak", () => {
    const w = Array.from({ length: 21 }, (_, i) => (i % 2 === 0 ? fail() : ok()))
    expect(decideState(w, B, t).state).toBe(J)
  })

  it("calls an endpoint that times out intermittently busy, not jammed", () => {
    const w = win([ok()], [fail(true)], [ok()], [fail(true)], [ok()], [fail(true)], many(15, () => ok(1500)))
    expect(decideState(w, H, t).state).toBe(B)
  })

  it("jams an endpoint that never answers", () => {
    expect(decideState(many(21, () => fail(true)), J, t).state).toBe(J)
  })

  it("does not call a brand-new endpoint's single failed probe healthy or busy", () => {
    expect(decideState([fail()], null, t).state).toBe(OperationalState.unknown)
  })
})

describe("decideState: recovery hysteresis", () => {
  it("stays jammed after one success following an outage", () => {
    const w = win([ok()], many(10, () => fail(true)), many(10, () => ok()))
    expect(decideState(w, J, t).state).toBe(J)
  })

  it("leaves jammed after enough consecutive successes", () => {
    const w = win(many(RECOVER_STREAK, () => ok()), many(3, () => fail(true)), many(16, () => ok()))
    expect(decideState(w, J, t).state).not.toBe(J)
  })

  it("stays jammed while the window is still mostly failures, even with a success streak", () => {
    const w = win(many(RECOVER_STREAK, () => ok()), many(19, () => fail(true)))
    expect(decideState(w, J, t).state).toBe(J)
  })
})

describe("decideState: congestion is absolute", () => {
  it("scores a steady fast endpoint low and a steady slow endpoint higher", () => {
    const fast = decideState(many(21, () => ok(100)), H, t).congestion
    const slow = decideState(many(21, () => ok(2900)), H, t).congestion
    // Relative scaling used to give both the same score.
    expect(fast).toBeLessThan(0.1)
    expect(slow).toBeGreaterThan(0.3)
  })

  it("does not swing on two samples", () => {
    const a = decideState([ok(300), ok(2800)], H, t).congestion
    const b = decideState([ok(300), ok(300)], H, t).congestion
    expect(Math.abs(a - b)).toBeLessThan(0.2)
  })

  it("reaches 1 for an endpoint that only fails", () => {
    expect(decideState(many(10, () => fail(true)), J, t).congestion).toBe(1)
  })

  it("reports the window's error rate", () => {
    expect(decideState(win(many(5, () => fail()), many(15, () => ok())), H, t).errorRate).toBeCloseTo(0.25)
  })
})

describe("failureKind", () => {
  it("separates not-callable, hung and erroring", () => {
    expect(failureKind({ timeout: false, errorMessage: "HTTP 404" })).toBe("unavailable")
    expect(failureKind({ timeout: false, errorMessage: "HTTP 410" })).toBe("unavailable")
    expect(failureKind({ timeout: true, errorMessage: "This operation was aborted" })).toBe("hung")
    expect(failureKind({ timeout: false, errorMessage: "HTTP 502" })).toBe("erroring")
    expect(failureKind({ timeout: false, errorMessage: "empty response" })).toBe("erroring")
    expect(failureKind({ timeout: false, errorMessage: "stream error: overloaded" })).toBe("erroring")
  })

  it("treats a gateway 504 as hung, not unavailable", () => {
    expect(failureKind({ timeout: true, errorMessage: "HTTP 504" })).toBe("hung")
  })
})
