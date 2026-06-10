import { classFromStatus, classifyWithCongestion, OperationalState } from "./errors"
import { probeModel } from "@/lib/config/nim"
import { prisma } from "@/lib/db/prisma"
import { prismaTransaction } from "@/lib/db/tx"
import { probe } from "./logger"
import type { Prisma } from "@prisma/client"

// 4xx statuses that mean "this endpoint doesn't serve chat completions" rather
// than "the endpoint is congested" — used to retire non-chat models.
const NON_CHAT_STATUS = new Set([400, 404, 405, 422])

export interface RunProbeOpts {
  modelId: string
  modelName: string
  timeoutMs?: number
}

interface StreamMeasurement {
  ttftMs: number
  latencyMs: number
  completionTokens: number
  throughput: number // tokens/sec during decode
}

// Read an OpenAI-style SSE chat-completion stream, measuring time-to-first-token
// and decode throughput from the actual generated tokens.
async function readProbeStream(res: Response, startTime: number): Promise<StreamMeasurement> {
  const reader = res.body!.getReader()
  const decoder = new TextDecoder()
  let buffer = ""
  let firstTokenAt = 0
  let content = ""
  let usageTokens = 0

  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split("\n")
    buffer = lines.pop() ?? ""
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed.startsWith("data:")) continue
      const data = trimmed.slice(5).trim()
      if (!data || data === "[DONE]") continue
      try {
        const json = JSON.parse(data)
        const delta = json.choices?.[0]?.delta?.content
        if (delta) {
          if (!firstTokenAt) firstTokenAt = performance.now()
          content += delta
        }
        const ct = json.usage?.completion_tokens
        if (typeof ct === "number") usageTokens = ct
      } catch {
        // ignore keep-alives / partial frames
      }
    }
  }

  const endTime = performance.now()
  const latencyMs = endTime - startTime
  const completionTokens = usageTokens || Math.max(1, Math.ceil(content.length / 4))
  const ttftMs = firstTokenAt ? firstTokenAt - startTime : latencyMs
  // End-to-end generation rate. Decode-only rate (tokens / (latency - ttft))
  // explodes when a server flushes the whole reply in one chunk (decodeMs ~ 0),
  // so measure tokens over total latency — stable and comparable across models.
  const throughput = (completionTokens / Math.max(1, latencyMs)) * 1000

  return { ttftMs, latencyMs, completionTokens, throughput }
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
  measurement: { tokensIn: number; tokensOut: number; throughput: number }
  success: boolean
  errorCode: string
  errorMessage?: string
  timeout: boolean
}

export async function runProbe(opts: RunProbeOpts): Promise<ProbeReturn | null> {
  const { modelId, modelName, timeoutMs = 15_000 } = opts
  const startTime = performance.now()
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const res = await probeModel(modelId, controller.signal)

    if (!res.ok) {
      // A 4xx "bad request / not found" means the model doesn't serve chat
      // completions. Retire it rather than logging a misleading "jammed" reading.
      if (NON_CHAT_STATUS.has(res.status)) {
        await res.body?.cancel().catch(() => {})
        await prisma.nIModel.update({ where: { id: modelId }, data: { isActive: false } }).catch(() => {})
        probe.info(`retired non-chat model: ${modelId}`, { modelId, status: res.status })
        return null
      }

      const errorCode = classFromStatus(res.status)
      const elapsed = performance.now() - startTime
      await res.body?.cancel().catch(() => {})
      probe.warn(`probe failed: ${modelId} -> ${res.status}`, {
        modelId, status: res.status, durationMs: Math.round(elapsed),
      })

      await prismaTransaction(async (tx) => {
        const prev = await tx.modelSampleLatest.findUnique({ where: { modelId }, select: { state: true } })
        await tx.modelSample.create({ data: {
          modelId, ttftMs: null, latencyMs: elapsed,
          tokensIn: 0, tokensOut: 0, throughput: 0,
          success: false, errorCode, errorMessage: `HTTP ${res.status}`,
          timeout: res.status === 504,
          congestion: 1, operationalState: "jammed",
        }})
        await tx.modelSampleLatest.upsert({
          where: { modelId },
          update: { lastProbeAt: new Date(), state: "jammed", ttftMs: null, throughput: null, latencyMs: elapsed, errorRate: 1, congestion: 1 },
          create: { modelId, lastProbeAt: new Date(), state: "jammed", latencyMs: elapsed, errorRate: 1, congestion: 1 },
        })
        await recordTransition(tx, modelId, modelName, (prev?.state as OperationalState) ?? null, OperationalState.jammed, ` (HTTP ${res.status})`)
      })

      return {
        modelId, modelName,
        timing: { ttftMs: 0, latencyMs: elapsed, startTime, endTime: performance.now() },
        measurement: { tokensIn: 0, tokensOut: 0, throughput: 0 },
        success: false, errorCode, errorMessage: `HTTP ${res.status}`,
        timeout: res.status === 504,
      }
    }

    const { ttftMs, latencyMs, completionTokens, throughput } = await readProbeStream(res, startTime)
    const endTime = performance.now()
    const tokensIn = 8

    probe.debug(`probe ok: ${modelId}`, {
      modelId, ttftMs: Math.round(ttftMs), latencyMs: Math.round(latencyMs),
      tokensOut: completionTokens, throughput: Math.round(throughput),
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
        measurement: { tokensIn, tokensOut: completionTokens, throughput },
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
    const code = "Network"
    const message = err instanceof Error ? err.message : "Unknown error"
    const timeout = controller.signal.aborted

    probe.error(`probe error: ${modelId}`, { modelId, error: message, durationMs: Math.round(elapsed) })

    await prismaTransaction(async (tx) => {
      const prev = await tx.modelSampleLatest.findUnique({ where: { modelId }, select: { state: true } })
      await tx.modelSample.create({ data: {
        modelId, ttftMs: null, latencyMs: elapsed,
        tokensIn: 0, tokensOut: 0, throughput: 0,
        success: false, errorCode: code, errorMessage: message,
        timeout, congestion: 1, operationalState: "jammed",
      }})
      await tx.modelSampleLatest.upsert({
        where: { modelId },
        update: { lastProbeAt: new Date(), state: "jammed", ttftMs: null, throughput: null, latencyMs: elapsed, errorRate: 1, congestion: 1 },
        create: { modelId, lastProbeAt: new Date(), state: "jammed", latencyMs: elapsed, errorRate: 1, congestion: 1 },
      })
      await recordTransition(tx, modelId, modelName, (prev?.state as OperationalState) ?? null, OperationalState.jammed, timeout ? " (timeout)" : " (network)")
    })

    return null
  } finally {
    clearTimeout(timer)
  }
}
