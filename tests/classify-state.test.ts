import { describe, expect, it } from "vitest"

import { classifyState, DEFAULT_THRESHOLDS, OperationalState } from "@/lib/telemetry/errors"

// Regression: the busy bar was a 500ms MEAN TTFT. TTFT is measured from the
// collector through NVIDIA's gateway, so endpoints that served every probe for
// hours sat at 0.6–2s and were all labelled busy — the dashboard read
// "2 healthy" while 17 of 22 endpoints were answering. Failed probes also fed a
// placeholder TTFT of 0 into the average.

const t = { ...DEFAULT_THRESHOLDS }
const ok = (ttftMs: number) => ({ ttftMs, success: true, errorCode: "none", timeout: false })
const fail = (timeout = false) => ({ ttftMs: 0, success: false, errorCode: "Network", timeout })

describe("classifyState", () => {
  it("calls a reliable endpoint with ~1.6s TTFT healthy", () => {
    const samples = Array.from({ length: 21 }, (_, i) => ok(1200 + (i % 5) * 200))
    expect(classifyState(samples, 0.05, t)).toBe(OperationalState.healthy)
  })

  it("uses the median, so one slow cold start does not flip the state", () => {
    const samples = [ok(40_000), ...Array.from({ length: 20 }, () => ok(800))]
    expect(classifyState(samples, 0.05, t)).toBe(OperationalState.healthy)
  })

  it("marks a consistently slow endpoint busy", () => {
    const samples = Array.from({ length: 21 }, () => ok(5000))
    expect(classifyState(samples, 0.05, t)).toBe(OperationalState.busy)
  })

  it("ignores failed probes' placeholder TTFT", () => {
    // Without the success filter, the zeros pull the median under the bar.
    const samples = [...Array.from({ length: 11 }, () => fail()), ...Array.from({ length: 10 }, () => ok(5000))]
    expect(classifyState(samples, 0.3, { ...t, errorRateBusyMax: 1, errorRateHealthyMax: 1 })).toBe(OperationalState.busy)
  })

  // Regression: 3 timeouts in 21 probes used to jam an endpoint that answered
  // the other 18, so intermittent endpoints read as dead and "busy" never showed.
  it("calls an endpoint that times out intermittently busy, not jammed", () => {
    const samples = [...Array.from({ length: 8 }, () => fail(true)), ...Array.from({ length: 13 }, () => ok(1500))]
    expect(classifyState(samples, 0.4, t)).toBe(OperationalState.busy)
  })

  it("jams an endpoint that fails most of the time", () => {
    const samples = [...Array.from({ length: 12 }, () => fail(true)), ...Array.from({ length: 9 }, () => ok(1500))]
    expect(classifyState(samples, 0.44, t)).toBe(OperationalState.jammed)
  })

  it("jams an endpoint that never answers", () => {
    expect(classifyState(Array.from({ length: 21 }, () => fail(true)), 0.6, t)).toBe(OperationalState.jammed)
  })
})
