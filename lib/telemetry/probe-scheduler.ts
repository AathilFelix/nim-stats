import { getActiveModels } from "./model-registry"
import { runProbe } from "./probe-runner"
import { env } from "@/lib/config/env"
import { probe } from "./logger"

export const DEFAULT_CONCURRENCY = env.PROBE_CONCURRENCY
export const DEFAULT_MAX_RPM = env.PROBE_MAX_RPM

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

/**
 * Spaces request *starts* by a fixed interval so outbound calls never exceed
 * `rpm`, regardless of concurrency. Slot assignment is synchronous, so
 * concurrent acquirers get strictly sequential, non-overlapping slots —
 * the global start rate stays ≤ rpm even with many workers.
 */
class RateLimiter {
  private nextSlot = 0
  constructor(private readonly intervalMs: number) {}

  async acquire(): Promise<void> {
    const now = Date.now()
    const slot = Math.max(now, this.nextSlot)
    this.nextSlot = slot + this.intervalMs
    const wait = slot - now
    if (wait > 0) await sleep(wait)
  }
}

/**
 * Probe every active model once, capped at `maxRpm` outbound requests/min and
 * `concurrency` in-flight at a time. At 30 rpm a ~56-model fleet takes ~2 min;
 * node-cron `noOverlap` keeps cycles back-to-back without bursting.
 */
export async function runProbeCycle(
  maxRpm: number = env.PROBE_MAX_RPM,
  concurrency: number = env.PROBE_CONCURRENCY,
): Promise<{ models: number; succeeded: number; failed: number }> {
  const models = await getActiveModels()
  if (!models.length) {
    probe.debug("no active models to probe")
    return { models: 0, succeeded: 0, failed: 0 }
  }

  const rpm = Math.max(1, maxRpm)
  const intervalMs = Math.ceil(60_000 / rpm)
  const limiter = new RateLimiter(intervalMs)
  const workers = Math.max(1, Math.min(concurrency, models.length))

  probe.info("probe cycle start", { models: models.length, maxRpm: rpm, concurrency: workers })

  let succeeded = 0
  let failed = 0
  let index = 0

  // Each worker pulls the next model, but only after acquiring a rate slot, so
  // the combined start rate across all workers stays within `maxRpm`.
  async function worker(): Promise<void> {
    for (;;) {
      const i = index++
      if (i >= models.length) return
      await limiter.acquire()
      const m = models[i]
      try {
        const result = await runProbe({ modelId: m.id, modelName: m.name })
        if (result) succeeded++
        else failed++
      } catch {
        failed++
      }
    }
  }

  await Promise.all(Array.from({ length: workers }, () => worker()))

  probe.info("probe cycle complete", { models: models.length, succeeded, failed })
  return { models: models.length, succeeded, failed }
}
