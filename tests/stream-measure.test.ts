import { describe, expect, it } from "vitest"

import { measureStream, MIN_DECODE_TOKENS } from "@/lib/telemetry/stream-measure"

// Fixtures mirror what integrate.api.nvidia.com actually streams, captured while
// reviewing the live dashboard:
//  - nemotron-3-nano-omni: only `reasoning_content` inside the 32-token cap
//  - nemotron-3-ultra:     reasoning first (4.3s), `content` later (9.7s)
//  - llama-guard-4:        2 tokens, content only
//  - nemoguard-topic-control: HTTP 200, stream carries no tokens at all

const DONE = "[DONE]"
const content = (s: string) => ({ choices: [{ delta: { content: s } }] })
const reasoning = (s: string) => ({ choices: [{ delta: { reasoning_content: s } }] })
const usage = (n: number) => ({ choices: [], usage: { completion_tokens: n } })

/** An SSE Response; each item is a JSON frame, "[DONE]", or `{ raw }` verbatim text. */
function sse(...frames: Array<unknown>): Response {
  const enc = new TextEncoder()
  return new Response(
    new ReadableStream<Uint8Array>({
      start(c) {
        for (const f of frames) {
          const text =
            f === DONE ? "data: [DONE]\n\n"
            : f && typeof f === "object" && "raw" in f ? (f as { raw: string }).raw
            : `data: ${JSON.stringify(f)}\n\n`
          c.enqueue(enc.encode(text))
        }
        c.close()
      },
    }),
  )
}

/**
 * A fake clock that returns `times` in order. measureStream reads it once per
 * token-bearing frame (in order), then once more for the end of the stream.
 */
function clock(...times: number[]) {
  let i = 0
  return () => times[Math.min(i++, times.length - 1)]
}

describe("measureStream", () => {
  it("counts reasoning tokens toward TTFT and reports the answer time separately", async () => {
    const m = await measureStream(
      sse(reasoning("think"), reasoning("more"), content("Throughput"), usage(32), DONE),
      0,
      clock(4_300, 6_000, 9_650, 12_550),
    )
    expect(m.outcome).toBe("ok")
    expect(m.ttftMs).toBe(4_300) // the old reader waited for `content` and said 9_650
    expect(m.firstAnswerMs).toBe(9_650)
    expect(m.latencyMs).toBe(12_550)
    expect(m.completionTokens).toBe(32)
  })

  it("treats an all-reasoning reply as served, with a real TTFT", async () => {
    const m = await measureStream(sse(reasoning("a"), reasoning("b"), usage(32), DONE), 0, clock(400, 450, 520))
    expect(m.outcome).toBe("ok")
    expect(m.ttftMs).toBe(400) // old behaviour: TTFT = whole latency (520)
    expect(m.firstAnswerMs).toBeNull()
  })

  it("fails an HTTP 200 stream with no tokens, without inventing one", async () => {
    const m = await measureStream(sse(DONE), 0, clock(270))
    expect(m.outcome).toBe("empty")
    expect(m.errorMessage).toBe("empty response")
    expect(m.completionTokens).toBe(0) // old behaviour floored this at 1
    expect(m.ttftMs).toBeNull()
    expect(m.decodeTps).toBeNull()
  })

  it("fails a stream that sends an error frame, even after some tokens", async () => {
    const m = await measureStream(
      sse(content("ok"), { error: { message: "upstream overloaded" } }, DONE),
      0,
      clock(100, 300),
    )
    expect(m.outcome).toBe("stream_error")
    expect(m.errorMessage).toContain("upstream overloaded")
  })

  it("parses a final frame that has no trailing newline", async () => {
    const m = await measureStream(sse({ raw: `data: ${JSON.stringify(content("hi"))}` }), 0, clock(90, 95))
    expect(m.outcome).toBe("ok")
    expect(m.ttftMs).toBe(90)
  })

  it("reports no decode rate for a short classifier reply", async () => {
    const m = await measureStream(sse(content("safe"), usage(2), DONE), 0, clock(320, 350))
    expect(m.outcome).toBe("ok")
    expect(m.completionTokens).toBe(2)
    expect(m.decodeTps).toBeNull() // old behaviour: 2 tokens / total latency
  })

  it("measures decode rate between first and last token, not over total latency", async () => {
    const m = await measureStream(
      sse(content("a"), content("b"), usage(MIN_DECODE_TOKENS * 2), DONE),
      0,
      clock(1_000, 2_000, 2_050),
    )
    // 31 inter-token intervals over a 1000ms window = 31 tok/s. Dividing 32 tokens
    // by the 2050ms total would say ~15.6 and blame decode for the slow TTFT.
    expect(m.decodeTps).toBeCloseTo(31, 5)
  })

  it("reports no decode rate when the whole reply arrives in one flush", async () => {
    const m = await measureStream(sse(content("a"), usage(32), DONE), 0, clock(800, 805))
    expect(m.decodeTps).toBeNull()
  })
})
