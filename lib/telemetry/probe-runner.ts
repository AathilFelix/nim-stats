import { classFromStatus, ErrorCode, OperationalState } from "./errors"
import {
  decideState,
  failureKind,
  NOT_CALLABLE_STATUSES,
  WINDOW_MAX_AGE_MS,
  WINDOW_SIZE,
} from "./state"
import { probeModel } from "@/lib/config/nim"
import { prisma } from "@/lib/db/prisma"
import { prismaTransaction } from "@/lib/db/tx"
import { probe } from "./logger"
import { measureStream } from "./stream-measure"
import type { Prisma } from "@prisma/client"

// 4xx statuses that mean "this endpoint isn't callable for chat with this key"
// (not served, not deployed, end of life) rather than "the endpoint is congested".
// Used to retire such models. 410 is NVIDIA's end-of-life answer.
const NON_CHAT_STATUS = NOT_CALLABLE_STATUSES

// The `errorMessage` values written for the statuses above. A non-chat 4xx is
// the ONLY path that records these exact messages (every other failure writes a
// different status or a network message), so they double as a reliable marker
// for counting consecutive non-chat 4xx from sample history.
const NON_CHAT_MESSAGES = new Set([...NON_CHAT_STATUS].map((s) => `HTTP ${s}`))

// Retire a model only after this many CONSECUTIVE non-chat 4xx probes. A single
// stray 4xx (e.g. a model briefly undeployed upstream) must not permanently
// retire a genuine chat model — that erosion is what left prod at 26 active
// endpoints vs dev's 47. A real non-chat endpoint 4xxs on every probe, so it
// still retires within RETIRE_STRIKES cycles; a real chat model recovers first.
const RETIRE_STRIKES = 3

/** Prompt tokens of the fixed probe message; used only for the sample row. */
const PROBE_TOKENS_IN = 8

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
  kind?: string,
): Promise<void> {
  const spec = transitionIncident(prev, next, modelName, detail)
  if (!spec) return
  await tx.incident.create({
    data: { ...spec, modelId, modelName, metadata: { from: prev, to: next, ...(kind ? { kind } : {}) } },
  })
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

interface ProbeRecord {
  success: boolean
  latencyMs: number
  ttftMs: number | null
  tokensOut: number
  /** Decode tok/s; null when the reply was too short to measure honestly. */
  throughput: number | null
  timeout: boolean
  errorCode: ErrorCode
  errorMessage?: string
}

/**
 * Persist one probe — success or failure — and move the endpoint's state.
 *
 * Every outcome goes through the same path, and the state is decided over the
 * same recent window (see `decideState`), so a failure is judged with the same
 * evidence as a success instead of instantly jamming the endpoint.
 *
 * `quiet` suppresses the incident (the sample and state are still written). It is
 * used when this very probe retires a not-callable model: that is a catalog fact,
 * not an outage, and it would otherwise log a critical "degraded" per model.
 */
async function persistProbe(
  modelId: string,
  modelName: string,
  r: ProbeRecord,
  { quiet = false }: { quiet?: boolean } = {},
): Promise<void> {
  await prismaTransaction(async (tx) => {
    const prev = await tx.modelSampleLatest.findUnique({ where: { modelId }, select: { state: true } })
    const prevState = (prev?.state as OperationalState) ?? null

    // Recent evidence only: probes older than the window's max age (e.g. a model
    // paroled after two weeks) say nothing about its state now.
    const history = await tx.modelSample.findMany({
      where: { modelId, timestamp: { gte: new Date(Date.now() - WINDOW_MAX_AGE_MS) } },
      orderBy: { timestamp: "desc" },
      take: WINDOW_SIZE - 1,
      select: { success: true, timeout: true, ttftMs: true },
    })
    const decision = decideState(
      [{ success: r.success, timeout: r.timeout, ttftMs: r.ttftMs }, ...history],
      prevState,
    )

    await tx.modelSample.create({ data: {
      modelId, ttftMs: r.ttftMs, latencyMs: r.latencyMs,
      tokensIn: r.success ? PROBE_TOKENS_IN : 0,
      tokensOut: r.success ? r.tokensOut : 0,
      throughput: r.success ? r.throughput : 0,
      success: r.success, errorCode: r.errorCode, errorMessage: r.errorMessage ?? null,
      timeout: r.timeout,
      congestion: decision.congestion, operationalState: decision.state,
    }})

    const snapshot = {
      lastProbeAt: new Date(), state: decision.state,
      ttftMs: r.ttftMs, latencyMs: r.latencyMs,
      throughput: r.success ? r.throughput : null,
      congestion: decision.congestion, errorRate: decision.errorRate,
    }
    await tx.modelSampleLatest.upsert({
      where: { modelId },
      update: snapshot,
      create: { modelId, ...snapshot },
    })

    if (!quiet) {
      const kind = r.success ? undefined : failureKind(r)
      // "This operation was aborted" says nothing to a reader; a hang is a hang.
      const why = kind === "hung" ? "no reply before timeout" : (r.errorMessage ?? "no reply")
      const detail = kind ? ` (${kind}: ${why})` : ""
      await recordTransition(tx, modelId, modelName, prevState, decision.state, detail, kind)
    }
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

      // A 4xx like 400/404/405/410/422 means the endpoint isn't callable for
      // chat — but a single one can be transient. Retire only after
      // RETIRE_STRIKES consecutive such responses (this probe + recent history).
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

      // Always record the failure (so the strike history exists). Retirement, if
      // warranted, happens after the write.
      await persistProbe(modelId, modelName, {
        success: false, latencyMs: elapsed, ttftMs: null, tokensOut: 0, throughput: null,
        timeout: res.status === 504, errorCode, errorMessage: `HTTP ${res.status}`,
      }, { quiet: retire })

      if (retire) {
        await prisma.nIModel.update({ where: { id: modelId }, data: { isActive: false } }).catch(() => {})
        probe.info(`retired non-callable model after ${RETIRE_STRIKES} strikes: ${modelId}`, { modelId, status: res.status })
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
      const errorCode = m.outcome === "stream_error" ? ErrorCode.Server : ErrorCode.Unknown
      probe.warn(`probe failed: ${modelId} -> ${m.errorMessage}`, {
        modelId, outcome: m.outcome, durationMs: Math.round(m.latencyMs),
      })
      await persistProbe(modelId, modelName, {
        success: false, latencyMs: m.latencyMs, ttftMs: null, tokensOut: 0, throughput: null,
        timeout: false, errorCode, errorMessage: m.errorMessage ?? "bad stream",
      })
      return {
        modelId, modelName,
        timing: { ttftMs: 0, latencyMs: m.latencyMs, startTime, endTime },
        measurement: { tokensIn: 0, tokensOut: m.completionTokens, throughput: null },
        success: false, errorCode, errorMessage: m.errorMessage, timeout: false,
      }
    }

    // `ok` guarantees at least one token arrived, so TTFT is a real number.
    const ttftMs = m.ttftMs as number
    const { latencyMs, completionTokens } = m
    const throughput = m.decodeTps // null when the reply is too short to measure decode speed

    probe.debug(`probe ok: ${modelId}`, {
      modelId, ttftMs: Math.round(ttftMs),
      firstAnswerMs: m.firstAnswerMs == null ? null : Math.round(m.firstAnswerMs),
      latencyMs: Math.round(latencyMs), tokensOut: completionTokens,
      decodeTps: throughput == null ? null : Math.round(throughput),
    })

    await persistProbe(modelId, modelName, {
      success: true, latencyMs, ttftMs, tokensOut: completionTokens, throughput,
      timeout: false, errorCode: ErrorCode.none,
    })

    return {
      modelId, modelName,
      timing: { ttftMs, latencyMs, startTime, endTime },
      measurement: { tokensIn: PROBE_TOKENS_IN, tokensOut: completionTokens, throughput },
      success: true, errorCode: "none", timeout: false,
    }
  } catch (err) {
    const elapsed = performance.now() - startTime
    const message = err instanceof Error ? err.message : "Unknown error"
    const timeout = controller.signal.aborted

    probe.error(`probe error: ${modelId}`, { modelId, error: message, durationMs: Math.round(elapsed) })

    // A request that got no reply inside the timeout is a gateway timeout, not a
    // generic network fault; keep the two apart so "hung" is distinguishable.
    await persistProbe(modelId, modelName, {
      success: false, latencyMs: elapsed, ttftMs: null, tokensOut: 0, throughput: null,
      timeout, errorCode: timeout ? ErrorCode.GatewayTimeout : ErrorCode.Network, errorMessage: message,
    })

    return null
  } finally {
    clearTimeout(timer)
  }
}
