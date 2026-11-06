import { classFromStatus, classifyWithCongestion, ErrorCode, OperationalState } from "./errors"
import { probeModel } from "@/lib/config/nim"
import { prisma } from "@/lib/db/prisma"
import { prismaTransaction } from "@/lib/db/tx"
import { probe } from "./logger"
import { measureStream } from "./stream-measure"
import type { Prisma } from "@prisma/client"

// 4xx statuses that mean "this endpoint doesn't serve chat completions" rather
// than "the endpoint is congested" — used to retire non-chat models.
const NON_CHAT_STATUS = new Set([400, 404, 405, 422])

// The `errorMessage` values written for the statuses above. A non-chat 4xx is
// the ONLY path that records these exact messages (every other failure writes a
// different status or a network message), so they double as a reliable marker
// for counting consecutive non-chat 4xx from sample history.
const NON_CHAT_MESSAGES = new Set(["HTTP 400", "HTTP 404", "HTTP 405", "HTTP 422"])

// Retire a model only after this many CONSECUTIVE non-chat 4xx probes. A single
// stray 4xx (e.g. a model briefly undeployed upstream) must not permanently
// retire a genuine chat model — that erosion is what left prod at 26 active
// endpoints vs dev's 47. A real non-chat endpoint 4xxs on every probe, so it
// still retires within RETIRE_STRIKES cycles; a real chat model recovers first.
const RETIRE_STRIKES = 3

export interface RunProbeOpts {
  modelId: string
  modelName: string
  timeoutMs?: number
}

type IncidentSpec = { severity: string; eventType: string; message: string }

// Map a state transition to an incident, or null when nothing noteworthy changed.
function transitionIncident(
  prev: OperationalState | null,
  next: OperationalState,
  modelName: string,
  detail: string,
): IncidentSpec | null {
  if (prev == null || prev === next) return null
  if (next === OperationalState.jammed)
    return { severity: "critical", eventType: "degradation", message: `${modelName} degraded${detail}` }
  if (next === OperationalState.busy && prev === OperationalState.healthy)
    return { severity: "warning", eventType: "congestion", message: `${modelName} congestion rising` }
  if (next === OperationalState.healthy)
    return { severity: "info", eventType: "recovery", message: `${modelName} recovered to healthy` }
  if (next === OperationalState.busy && prev === OperationalState.jammed)
    return { severity: "info", eventType: "recovery", message: `${modelName} partially recovered` }
  return null
}

async function recordTransition(
  tx: Prisma.TransactionClient,
  modelId: string,
  modelName: string,
  prev: OperationalState | null,
  next: OperationalState,
  detail = "",
): Promise<void> {
  const spec = transitionIncident(prev, next, modelName, detail)
  if (!spec) return
  await tx.incident.create({ data: { ...spec, modelId, modelName, metadata: { from: prev, to: next } } })
}

type ProbeReturn = {
  modelId: string
  modelName: string
  timing: { ttftMs: number; latencyMs: number; startTime: number; endTime: number }
  measurement: { tokensIn: number; tokensOut: number; throughput: number | null }
  success: boolean
  errorCode: string
  errorMessage?: string
  timeout: boolean
}

/**
 * Persist a failed probe: one sample, the model's latest snapshot, and the state
 * transition. Shared by every failure path (HTTP error, bad stream, network) so
 * they cannot drift apart.
 */
async function recordFailure(
  modelId: string,
  modelName: string,
  f: { elapsedMs: number; errorCode: ErrorCode; errorMessage: string; timeout: boolean; detail: string },
): Promise<void> {
  await prismaTransaction(async (tx) => {
    const prev = await tx.modelSampleLatest.findUnique({ where: { modelId }, select: { state: true } })
    await tx.modelSample.create({ data: {
      modelId, ttftMs: null, latencyMs: f.elapsedMs,
      tokensIn: 0, tokensOut: 0, throughput: 0,
      success: false, errorCode: f.errorCode, errorMessage: f.errorMessage,
      timeout: f.timeout, congestion: 1, operationalState: "jammed",
    }})
    await tx.modelSampleLatest.upsert({
      where: { modelId },
      update: { lastProbeAt: new Date(), state: "jammed", ttftMs: null, throughput: null, latencyMs: f.elapsedMs, errorRate: 1, congestion: 1 },
      create: { modelId, lastProbeAt: new Date(), state: "jammed", latencyMs: f.elapsedMs, errorRate: 1, congestion: 1 },
    })
    await recordTransition(tx, modelId, modelName, (prev?.state as OperationalState) ?? null, OperationalState.jammed, f.detail)
  })
}

export async function runProbe(opts: RunProbeOpts): Promise<ProbeReturn | null> {
  const { modelId, modelName, timeoutMs = 15_000 } = opts
  const startTime = performance.now()
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const res = await probeModel(modelId, controller.signal)

    if (!res.ok) {
      const errorCode = classFromStatus(res.status)
      const elapsed = performance.now() - startTime
      await res.body?.cancel().catch(() => {})

      // A 4xx like 400/404/405/422 usually means the endpoint doesn't serve chat
      // completions — but a single one can be transient. Retire only after
      // RETIRE_STRIKES consecutive non-chat 4xx (this probe + recent history).
      let retire = false
      if (NON_CHAT_STATUS.has(res.status)) {
        const recent = await prisma.modelSample.findMany({
          where: { modelId }, orderBy: { timestamp: "desc" },
          take: RETIRE_STRIKES - 1, select: { success: true, errorMessage: true },
        })
        let strikes = 1 // this probe
        for (const s of recent) {
          if (!s.success && s.errorMessage && NON_CHAT_MESSAGES.has(s.errorMessage)) strikes++
          else break // any success or other failure breaks the streak
        }
        retire = strikes >= RETIRE_STRIKES
      }

      probe.warn(`probe failed: ${modelId} -> ${res.status}`, {
        modelId, status: res.status, durationMs: Math.round(elapsed),
      })

      // Always record the failure (so the strike history exists) and mark the
      // model jammed. Retirement, if warranted, happens after the write.
      await recordFailure(modelId, modelName, {
        elapsedMs: elapsed, errorCode, errorMessage: `HTTP ${res.status}`,
        timeout: res.status === 504, detail: ` (HTTP ${res.status})`,
      })

      if (retire) {
        await prisma.nIModel.update({ where: { id: modelId }, data: { isActive: false } }).catch(() => {})
        probe.info(`retired non-chat model after ${RETIRE_STRIKES} strikes: ${modelId}`, { modelId, status: res.status })
        return null
      }

      return {
        modelId, modelName,
        timing: { ttftMs: 0, latencyMs: elapsed, startTime, endTime: performance.now() },
        measurement: { tokensIn: 0, tokensOut: 0, throughput: 0 },
        success: false, errorCode, errorMessage: `HTTP ${res.status}`,
        timeout: res.status === 504,
      }
    }

    const m = await measureStream(res, startTime)
    const endTime = performance.now()

    // HTTP 200 alone is not service: an empty stream or an in-stream error frame
    // means the endpoint did not produce a reply. Count it as a failure rather
    // than as a healthy sample.
    if (m.outcome !== "ok") {
      probe.warn(`probe failed: ${modelId} -> ${m.errorMessage}`, {
        modelId, outcome: m.outcome, durationMs: Math.round(m.latencyMs),
      })
      await recordFailure(modelId, modelName, {
        elapsedMs: m.latencyMs,
        errorCode: m.outcome === "stream_error" ? ErrorCode.Server : ErrorCode.Unknown,
        errorMessage: m.errorMessage ?? "bad stream",
        timeout: false,
        detail: ` (${m.errorMessage})`,
      })
      return {
        modelId, modelName,
        timing: { ttftMs: 0, latencyMs: m.latencyMs, startTime, endTime },
        measurement: { tokensIn: 0, tokensOut: m.completionTokens, throughput: null },
        success: false,
        errorCode: m.outcome === "stream_error" ? ErrorCode.Server : ErrorCode.Unknown,
        errorMessage: m.errorMessage, timeout: false,
      }
    }

    // `ok` guarantees at least one token arrived, so TTFT is a real number.
    const ttftMs = m.ttftMs as number
    const { latencyMs, completionTokens } = m
    const throughput = m.decodeTps // null when the reply is too short to measure decode speed
    const tokensIn = 8

    probe.debug(`probe ok: ${modelId}`, {
      modelId, ttftMs: Math.round(ttftMs),
      firstAnswerMs: m.firstAnswerMs == null ? null : Math.round(m.firstAnswerMs),
      latencyMs: Math.round(latencyMs), tokensOut: completionTokens,
      decodeTps: throughput == null ? null : Math.round(throughput),
    })

    await prismaTransaction(async (tx) => {
      const prev = await tx.modelSampleLatest.findUnique({ where: { modelId }, select: { state: true } })

      const history = await tx.modelSample.findMany({
        where: { modelId },
        orderBy: { timestamp: "desc" },
        take: 20,
        select: { success: true, timeout: true, ttftMs: true },
      })

      // Classify over the just-measured probe plus recent history. Excluding the
      // current result makes a healthy cold-start probe classify as "unknown".
      const currentSample = {
        modelId, modelName,
        timing: { ttftMs, latencyMs, startTime, endTime },
        measurement: { tokensIn, tokensOut: completionTokens, throughput: throughput ?? 0 },
        success: true, errorCode: "none" as never, timeout: false,
      }
      const sampleProbeResults = [
        currentSample,
        ...history.map((s) => ({
          modelId, modelName,
          timing: { ttftMs: s.ttftMs ?? 0, latencyMs: 0, startTime: 0, endTime: 0 },
          measurement: { tokensIn: 0, tokensOut: 0, throughput: 0 },
          success: s.success, errorCode: "none" as never, timeout: s.timeout,
        })),
      ]

      const congestionResult = classifyWithCongestion(sampleProbeResults)

      await tx.modelSample.create({ data: {
        modelId, ttftMs, latencyMs,
        tokensIn, tokensOut: completionTokens, throughput,
        success: true, errorCode: "none", timeout: false,
        congestion: congestionResult.congestion,
        operationalState: congestionResult.state,
      }})

      await tx.modelSampleLatest.upsert({
        where: { modelId },
        update: {
          lastProbeAt: new Date(), state: congestionResult.state,
          ttftMs, latencyMs, throughput,
          congestion: congestionResult.congestion, errorRate: 0,
        },
        create: {
          modelId, lastProbeAt: new Date(), state: congestionResult.state,
          ttftMs, latencyMs, throughput,
          congestion: congestionResult.congestion, errorRate: 0,
        },
      })

      await recordTransition(tx, modelId, modelName, (prev?.state as OperationalState) ?? null, congestionResult.state)
    })

    return {
      modelId, modelName,
      timing: { ttftMs, latencyMs, startTime, endTime },
      measurement: { tokensIn, tokensOut: completionTokens, throughput },
      success: true, errorCode: "none", timeout: false,
    }
  } catch (err) {
    const elapsed = performance.now() - startTime
    const code = ErrorCode.Network
    const message = err instanceof Error ? err.message : "Unknown error"
    const timeout = controller.signal.aborted

    probe.error(`probe error: ${modelId}`, { modelId, error: message, durationMs: Math.round(elapsed) })

    await recordFailure(modelId, modelName, {
      elapsedMs: elapsed, errorCode: code, errorMessage: message, timeout,
      detail: timeout ? " (timeout)" : " (network)",
    })

    return null
  } finally {
    clearTimeout(timer)
  }
}
