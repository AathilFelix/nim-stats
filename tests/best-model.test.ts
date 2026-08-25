import { describe, expect, it } from "vitest"

import { findBestModel } from "@/lib/operational-engine"

// Regression: when every endpoint is `avoid_for_production`, findBestModel
// returns `{ model: {} }` — an empty object, which is truthy. The dashboard's
// recommendation panel treated that as a real model and crashed rendering
// `humanize(undefined)`, taking the whole homepage prerender down with it.
// The contract is pinned here so the panel's guard stays correct.

const model = (over: Record<string, unknown> = {}) => ({
  name: "llama", provider: "meta", status: "jammed",
  congestion: 90, uptime: 40, timeoutRate: 30, ttft: 900, throughput: 5,
  sessionReliability: { score: 10, state: "degrading" },
  volatility: { measure: "volatile", score: 80 },
  routingConfidence: "avoid_for_production",
  queuePressure: "saturated",
  ...over,
})

describe("findBestModel", () => {
  it("returns an empty model object when nothing qualifies", () => {
    const result = findBestModel([model(), model()])
    expect(result.model).toEqual({})
    expect(Object.keys(result.model)).toHaveLength(0)
    expect(result.reasons).toEqual(["All models currently degraded"])
  })

  it("returns an empty model object for an empty fleet", () => {
    expect(findBestModel([]).model).toEqual({})
  })

  it("picks a qualifying endpoint and always gives at least one reason", () => {
    const good = model({
      name: "good", status: "healthy", congestion: 10, uptime: 99.99, timeoutRate: 0.1,
      sessionReliability: { score: 95, state: "stable" },
      volatility: { measure: "stable", score: 5 },
      routingConfidence: "high_confidence", queuePressure: "low",
    })
    const result = findBestModel([model(), good])
    expect(result.model.name).toBe("good")
    expect(result.reasons.length).toBeGreaterThan(0)
    expect(result.model.queuePressure).toBeDefined()
  })
})
