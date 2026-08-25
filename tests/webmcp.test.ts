import { describe, expect, it } from "vitest"

import { buildWebMcpTools } from "@/components/agent/webmcp"
import { RELIABILITY_DAY_VALUES, TREND_RANGE_VALUES } from "@/lib/api/params"

// The WebMCP tool list is a public contract: an agent picks a tool from these
// names and descriptions alone. These assertions pin the parts it depends on.

describe("WebMCP tools", () => {
  const tools = buildWebMcpTools()

  it("exposes uniquely named, described tools", () => {
    expect(tools.length).toBeGreaterThan(0)
    const names = tools.map((t) => t.name)
    expect(new Set(names).size).toBe(names.length)
    for (const tool of tools) {
      expect(tool.name).toMatch(/^nim_[a-z_]+$/)
      expect(tool.description.length).toBeGreaterThan(40)
      expect(tool.inputSchema.type).toBe("object")
      expect(typeof tool.execute).toBe("function")
    }
  })

  it("declares the same parameter values the API enforces", () => {
    const props = (name: string) =>
      (tools.find((t) => t.name === name)!.inputSchema.properties ?? {}) as Record<
        string,
        { enum?: unknown[] }
      >
    expect(props("nim_fleet_trend").range.enum).toEqual(TREND_RANGE_VALUES)
    expect(props("nim_endpoint_reliability").days.enum).toEqual([...RELIABILITY_DAY_VALUES])
  })

  it("only reaches surfaces a browser can actually fetch unauthenticated", async () => {
    const requested: string[] = []
    const original = globalThis.fetch
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      requested.push(String(input))
      return new Response("ok", { status: 200 })
    }) as typeof fetch
    try {
      for (const tool of tools) await tool.execute({})
    } finally {
      globalThis.fetch = original
    }
    // Token-gated routes would 404 for an agent in a browser, so none may appear.
    for (const path of requested) {
      expect(path.startsWith("/")).toBe(true)
      expect(path).not.toMatch(/^\/api\/(models|providers|internal)|^\/api\/fleet\/(overview|quota|anomalies)/)
    }
    expect(requested).toContain("/api/health")
  })

  it("returns the response body as text content", async () => {
    const original = globalThis.fetch
    globalThis.fetch = (async () => new Response("# Fleet", { status: 200 })) as typeof fetch
    try {
      const result = await tools[0].execute({})
      expect(result.content).toEqual([{ type: "text", text: "# Fleet" }])
    } finally {
      globalThis.fetch = original
    }
  })
})
