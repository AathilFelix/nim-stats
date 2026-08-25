"use client"

import { useEffect } from "react"

import { RELIABILITY_DAY_VALUES, TREND_RANGE_VALUES } from "@/lib/api/params"
import { SITE_NAME } from "@/lib/site"

// WebMCP (https://webmachinelearning.github.io/webmcp/) — exposes this site's
// read-only capabilities as tools to an agent driving the browser, so it can
// answer "which free NIM endpoint should I call?" from the open tab instead of
// scraping the DOM.
//
// Every tool is a thin wrapper over a surface that already exists and is
// already public: the Markdown representation of a page, or an unauthenticated
// API route. Nothing here is a new capability, and nothing mutates state — an
// agent can call any of it as often as it likes without side effects. The
// internal API routes (models, providers, overview, quota, anomalies) are
// deliberately absent: they are token-gated, and a browser has no token.
//
// The API is an origin-trial experiment in Chrome and absent everywhere else,
// so registration is entirely feature-detected and failure is silent.

type ToolResult = { content: Array<{ type: "text"; text: string }> }

type ToolDefinition = {
  name: string
  description: string
  inputSchema: Record<string, unknown>
  execute: (args: Record<string, unknown>) => Promise<ToolResult>
}

type ModelContext = {
  provideContext?: (context: { tools: ToolDefinition[] }) => void | Promise<void>
}

const NO_INPUT = { type: "object", properties: {}, additionalProperties: false } as const

const text = (body: string): ToolResult => ({ content: [{ type: "text", text: body }] })

/** Fetch a same-origin surface and hand the agent whatever it returned. */
async function fetchText(path: string, accept: string): Promise<ToolResult> {
  const res = await fetch(path, { headers: { Accept: accept } })
  const body = await res.text()
  if (!res.ok) return text(`Request to ${path} failed with HTTP ${res.status}.\n\n${body}`)
  return text(body)
}

/** Exported for the unit test, which pins the shape of what agents see. */
export function buildWebMcpTools(): ToolDefinition[] {
  return [
    {
      name: "nim_fleet_status",
      description:
        "Current status of every tracked free NVIDIA NIM endpoint — state, uptime, time-to-first-token, throughput and congestion — plus the best endpoint to call right now. Returns the fleet overview page as Markdown.",
      inputSchema: NO_INPUT,
      execute: () => fetchText("/.md", "text/markdown"),
    },
    {
      name: "nim_rank_endpoints",
      description:
        "The same fleet ranked by lowest latency and highest throughput, broken down by provider. Use when choosing between endpoints rather than checking one.",
      inputSchema: NO_INPUT,
      execute: () => fetchText("/discover.md", "text/markdown"),
    },
    {
      name: "nim_fleet_trend",
      description:
        "Fleet-wide time series of time-to-first-token, throughput and success rate. Use to tell a transient blip from a sustained regression.",
      inputSchema: {
        type: "object",
        properties: {
          range: {
            type: "string",
            enum: TREND_RANGE_VALUES,
            description: "Window to summarise. Defaults to 12h.",
          },
        },
        additionalProperties: false,
      },
      execute: (args) => {
        const range = String(args.range ?? TREND_RANGE_VALUES[0])
        return fetchText(`/api/fleet/trend?range=${encodeURIComponent(range)}`, "application/json")
      },
    },
    {
      name: "nim_endpoint_reliability",
      description:
        "Per-endpoint uptime history, time-of-day latency and SLA windows. Use to judge whether an endpoint is dependable over time, not just up right now.",
      inputSchema: {
        type: "object",
        properties: {
          days: {
            type: "integer",
            enum: RELIABILITY_DAY_VALUES,
            description: "Lookback window in days. Defaults to 90.",
          },
        },
        additionalProperties: false,
      },
      execute: (args) => {
        const days = Number(args.days ?? 90)
        return fetchText(`/api/fleet/reliability?days=${days}`, "application/json")
      },
    },
    {
      name: "nim_health",
      description: `Liveness of ${SITE_NAME} and its measurement collector, including when the last probe ran. Use to check how fresh the other tools' answers are.`,
      inputSchema: NO_INPUT,
      execute: () => fetchText("/api/health", "application/json"),
    },
  ]
}

export function WebMcpTools() {
  useEffect(() => {
    const modelContext = (navigator as Navigator & { modelContext?: ModelContext }).modelContext
    if (typeof modelContext?.provideContext !== "function") return
    try {
      // Fire-and-forget: the spec allows a promise, and there is nothing useful
      // to do with a rejection on a page that works fine without any of this.
      void Promise.resolve(modelContext.provideContext({ tools: buildWebMcpTools() })).catch(() => {})
    } catch {
      // An older or partial implementation. Not worth a console message.
    }
  }, [])

  return null
}
