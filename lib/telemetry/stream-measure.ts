// Measures one OpenAI-style SSE chat-completion stream.
//
// Kept separate from probe-runner so the rules that decide "did this endpoint
// actually serve a reply, and how fast?" are pure and unit-testable.
//
// Three things the old inline reader got wrong, all visible on the live site:
//  - Reasoning models stream `reasoning_content` before `content`. Listening only
//    for `content` reported TTFT as the whole latency (and, for a reply that is
//    entirely reasoning inside the token cap, as the end of the stream).
//  - A 200 with no tokens was recorded as healthy: the token count was floored at
//    1 (`Math.max(1, …)`), inventing a token out of nothing.
//  - Throughput divided a <=32-token reply by TOTAL latency, so it mostly measured
//    TTFT — and gave classifier models that emit 1–2 tokens meaningless numbers.

/** Below this many generated tokens a decode rate is dominated by noise. */
export const MIN_DECODE_TOKENS = 16

/** Decode intervals shorter than this mean the reply arrived in one flush. */
const MIN_DECODE_WINDOW_MS = 50

export type StreamOutcome = "ok" | "empty" | "stream_error"

export interface StreamMeasurement {
  outcome: StreamOutcome
  /** Why the stream is not "ok" (stream_error only). */
  errorMessage?: string
  /** Start → first token of ANY kind (content or reasoning). Null if no token arrived. */
  ttftMs: number | null
  /** Start → first user-visible `content` token. Null for pure-reasoning / empty replies. */
  firstAnswerMs: number | null
  /** Start → stream end. */
  latencyMs: number
  /** Provider-reported when available, else estimated from characters. 0 when empty. */
  completionTokens: number
  /** Tokens per second between the first and last token. Null when it cannot be measured honestly. */
  decodeTps: number | null
}

interface Frame {
  error?: unknown
  object?: unknown
  message?: unknown
  choices?: Array<{ delta?: { content?: unknown; reasoning_content?: unknown; reasoning?: unknown } }>
  usage?: { completion_tokens?: unknown }
}

function errorText(json: Frame): string | null {
  const err = json.error
  if (err != null) {
    if (typeof err === "string") return err
    const msg = (err as { message?: unknown }).message
    return typeof msg === "string" ? msg : "unknown error"
  }
  if (json.object === "error") return typeof json.message === "string" ? json.message : "unknown error"
  return null
}

export async function measureStream(
  res: Response,
  startTime: number,
  now: () => number = () => performance.now(),
): Promise<StreamMeasurement> {
  const reader = res.body!.getReader()
  const decoder = new TextDecoder()
  let buffer = ""
  let firstTokenAt = 0
  let lastTokenAt = 0
  let firstAnswerAt = 0
  let chars = 0
  let usageTokens = 0
  let streamError: string | null = null

  const handleLine = (line: string): void => {
    const trimmed = line.trim()
    if (!trimmed.startsWith("data:")) return
    const data = trimmed.slice(5).trim()
    if (!data || data === "[DONE]") return
    let json: Frame
    try {
      json = JSON.parse(data)
    } catch {
      return // keep-alives / partial frames
    }
    const err = errorText(json)
    if (err && !streamError) streamError = err

    const delta = json.choices?.[0]?.delta
    const answer = delta?.content
    const reasoning = delta?.reasoning_content ?? delta?.reasoning
    const hasAnswer = typeof answer === "string" && answer.length > 0
    const hasReasoning = typeof reasoning === "string" && reasoning.length > 0
    if (hasAnswer || hasReasoning) {
      const t = now()
      if (!firstTokenAt) firstTokenAt = t
      lastTokenAt = t
      if (hasAnswer && !firstAnswerAt) firstAnswerAt = t
      chars += (hasAnswer ? (answer as string).length : 0) + (hasReasoning ? (reasoning as string).length : 0)
    }
    const ct = json.usage?.completion_tokens
    if (typeof ct === "number") usageTokens = ct
  }

  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split("\n")
    buffer = lines.pop() ?? ""
    for (const line of lines) handleLine(line)
  }
  // A final frame without a trailing newline would otherwise be dropped.
  buffer += decoder.decode()
  if (buffer) handleLine(buffer)

  const endTime = now()
  const latencyMs = endTime - startTime
  const gotTokens = firstTokenAt > 0
  const completionTokens = gotTokens ? usageTokens || Math.max(1, Math.ceil(chars / 4)) : 0

  let decodeTps: number | null = null
  if (gotTokens && completionTokens >= MIN_DECODE_TOKENS) {
    const windowMs = lastTokenAt - firstTokenAt
    if (windowMs >= MIN_DECODE_WINDOW_MS) decodeTps = ((completionTokens - 1) / windowMs) * 1000
  }

  const base = {
    ttftMs: gotTokens ? firstTokenAt - startTime : null,
    firstAnswerMs: firstAnswerAt ? firstAnswerAt - startTime : null,
    latencyMs,
    completionTokens,
    decodeTps,
  }

  // An error frame is a failure even if some tokens streamed before it.
  if (streamError) return { ...base, outcome: "stream_error", errorMessage: `stream error: ${streamError}` }
  if (!gotTokens) return { ...base, outcome: "empty", errorMessage: "empty response" }
  return { ...base, outcome: "ok" }
}
