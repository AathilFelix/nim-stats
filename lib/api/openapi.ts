// The OpenAPI 3.1 description of the public NIM Stats API.
//
// This document is the API's contract and the source the /api reference page
// renders from — there is no separately authored prose to fall out of date. It
// describes exactly the endpoints that are reachable without credentials;
// token-gated internal routes are deliberately absent, because advertising an
// endpoint that answers 404 to everyone is worse than not listing it.
//
// Every operation carries a unique operationId, a description, typed
// parameters, and a response schema, which is what makes it usable as an
// LLM function-calling manifest without a human in the loop.

import { ERROR_CODES } from "@/lib/api/errors"
import {
  DEFAULT_RELIABILITY_DAYS,
  DEFAULT_TREND_RANGE,
  RELIABILITY_DAY_VALUES,
  TREND_RANGE_VALUES,
} from "@/lib/api/params"
import { README_URL, REPO_URL, SITE_NAME, SITE_URL, absoluteUrl } from "@/lib/site"

/** Bumped when a response shape changes incompatibly. */
export const OPENAPI_API_VERSION = "1.0.0"

type Json = string | number | boolean | null | Json[] | { [k: string]: Json }

const errorResponse = (description: string) => ({
  description,
  content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
})

export function buildOpenApiDocument(): Record<string, Json> {
  return {
    openapi: "3.1.0",
    info: {
      title: `${SITE_NAME} API`,
      version: OPENAPI_API_VERSION,
      summary: "Measured status of the free NVIDIA NIM inference endpoints.",
      description: [
        `Read-only JSON API behind ${SITE_NAME}. Every number it returns is a measurement taken by sending a real chat-completion request to a free NVIDIA NIM endpoint from outside NVIDIA's network — not a vendor-published status claim.`,
        "",
        "No authentication, no API key, no rate limit. Probes run on a roughly ten-minute cadence, so polling faster than that returns identical data; responses carry `Cache-Control` reflecting that.",
        "",
        `Every page of the site is also available as Markdown at its own URL via \`Accept: text/markdown\`, which is usually a better fit than this API when you want a summary rather than a series. See ${absoluteUrl("/llms.txt")}.`,
        "",
        `${SITE_NAME} is an independent project and is not affiliated with NVIDIA Corporation.`,
      ].join("\n"),
      contact: { name: `${SITE_NAME} issue tracker`, url: `${REPO_URL}/issues` },
      license: { name: "MIT", identifier: "MIT" },
    },
    externalDocs: {
      description: "Source, self-hosting instructions, and architecture notes",
      url: README_URL,
    },
    servers: [{ url: SITE_URL, description: "Production" }],
    // Explicitly no authentication. An empty root-level `security` is how
    // OpenAPI says "public" — without it, tooling and agents have to guess
    // whether they are missing a credential.
    security: [],
    tags: [
      { name: "status", description: "Liveness of the site and its collector." },
      { name: "fleet", description: "Aggregate measurements across the tracked endpoints." },
    ],
    paths: {
      "/api/health": {
        get: {
          operationId: "getHealth",
          tags: ["status"],
          summary: "Check that the API and its collector are alive",
          description:
            "Liveness probe. Confirms the API is serving and the telemetry database is reachable, and reports when the collector last recorded a probe. Use `lastProbeAt` to judge whether the fleet data elsewhere is fresh: a timestamp older than about twenty minutes means the collector has stalled, even though this endpoint still answers 200.",
          responses: {
            "200": {
              description: "The API is serving and the database is reachable.",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Health" },
                  example: {
                    status: "ok",
                    timestamp: "2026-08-25T15:06:14.702Z",
                    database: "connected",
                    lastProbeAt: "2026-08-25T15:02:39.239Z",
                  },
                },
              },
            },
            "405": errorResponse("The endpoint is read-only; use GET or HEAD."),
            "503": errorResponse("The telemetry database is unreachable."),
          },
        },
      },
      "/api/fleet/trend": {
        get: {
          operationId: "getFleetTrend",
          tags: ["fleet"],
          summary: "Get the fleet-wide performance time series",
          description:
            "Time series of fleet-wide averages — time to first token, throughput, and success rate — bucketed across the requested window. Bucket width is chosen per range so the series stays around 70–150 points: 10 minutes for `12h`, 20 minutes for `24h`, 2 hours for `7d`. Points are ordered oldest first. Use this to answer whether the fleet is getting better or worse, not to pick an individual endpoint.",
          parameters: [
            {
              name: "range",
              in: "query",
              required: false,
              description: "Window to aggregate over. Determines bucket width.",
              schema: {
                type: "string",
                enum: TREND_RANGE_VALUES,
                default: DEFAULT_TREND_RANGE,
              },
            },
          ],
          responses: {
            "200": {
              description: "The requested series.",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/TrendResponse" },
                  example: {
                    range: "12h",
                    data: [
                      { t: "2026-08-25T03:10:00.000Z", ttftMs: 1667, throughput: 32.9, successRate: 79.4 },
                    ],
                  },
                },
              },
            },
            "400": errorResponse("`range` was not one of the supported values."),
            "405": errorResponse("The endpoint is read-only; use GET or HEAD."),
            "500": errorResponse("The series could not be read."),
          },
        },
      },
      "/api/fleet/reliability": {
        get: {
          operationId: "getFleetReliability",
          tags: ["fleet"],
          summary: "Get per-endpoint uptime, time-of-day latency, and SLA windows",
          description:
            "Per-endpoint reliability breakdown: daily uptime for the requested window, a 24-bucket time-of-day profile of latency and success rate, and rolled-up 1-day, 7-day, and 30-day SLA figures. This is the heaviest endpoint here and the slowest-moving; cache it. Uptime fields are null where no samples exist for that bucket rather than zero, so absence of data is distinguishable from total failure.",
          parameters: [
            {
              name: "days",
              in: "query",
              required: false,
              description:
                "How many days of daily history to include. Restricted to an allowlist so callers cannot force arbitrarily expensive queries.",
              schema: {
                type: "integer",
                enum: [...RELIABILITY_DAY_VALUES],
                default: DEFAULT_RELIABILITY_DAYS,
              },
            },
          ],
          responses: {
            "200": {
              description: "The reliability breakdown for every tracked endpoint.",
              content: {
                "application/json": { schema: { $ref: "#/components/schemas/ReliabilityResponse" } },
              },
            },
            "400": errorResponse("`days` was not one of the supported values."),
            "405": errorResponse("The endpoint is read-only; use GET or HEAD."),
            "500": errorResponse("The breakdown could not be read."),
          },
        },
      },
    },
    components: {
      schemas: {
        Health: {
          type: "object",
          description: "Liveness of the API and its collector.",
          required: ["status", "timestamp", "database", "lastProbeAt"],
          properties: {
            status: { type: "string", const: "ok", description: "Always `ok` on a 200; failures answer 503 with an Error body." },
            timestamp: { type: "string", format: "date-time", description: "When this response was generated (UTC)." },
            database: { type: "string", const: "connected", description: "Telemetry database reachability." },
            lastProbeAt: {
              type: ["string", "null"],
              format: "date-time",
              description: "When the collector last recorded a sample, or null if it has never run.",
            },
          },
        },
        TrendResponse: {
          type: "object",
          description: "A fleet-wide time series over the requested window.",
          required: ["range", "data"],
          properties: {
            range: { type: "string", enum: TREND_RANGE_VALUES, description: "The window that was aggregated." },
            data: {
              type: "array",
              description: "Buckets ordered oldest first.",
              items: { $ref: "#/components/schemas/TrendPoint" },
            },
          },
        },
        TrendPoint: {
          type: "object",
          description: "Fleet-wide averages for one time bucket.",
          required: ["t", "ttftMs", "throughput", "successRate"],
          properties: {
            t: { type: "string", format: "date-time", description: "Bucket start (UTC)." },
            ttftMs: { type: "number", description: "Mean time to first token across the fleet, in milliseconds." },
            throughput: { type: "number", description: "Mean sustained decode throughput, in tokens per second." },
            successRate: { type: "number", minimum: 0, maximum: 100, description: "Percentage of probes that completed successfully." },
          },
        },
        ReliabilityResponse: {
          type: "object",
          description: "Per-endpoint reliability history across the fleet.",
          required: ["updatedAt", "days", "models"],
          properties: {
            updatedAt: { type: "string", format: "date-time", description: "When this breakdown was computed." },
            days: { type: "integer", description: "Length of the daily history window, in days." },
            models: { type: "array", items: { $ref: "#/components/schemas/ModelReliability" } },
          },
        },
        ModelReliability: {
          type: "object",
          description: "Reliability history for a single endpoint.",
          required: ["id", "name", "provider", "days", "hours", "sla"],
          properties: {
            id: { type: "string", description: "NIM model identifier, e.g. `meta/llama-3.1-8b-instruct`." },
            name: { type: "string", description: "Short model name." },
            provider: { type: "string", description: "Publishing organisation, e.g. `Meta`." },
            days: { type: "array", items: { $ref: "#/components/schemas/DayUptime" } },
            hours: {
              type: "array",
              description: "24 buckets, one per UTC hour of day, aggregated over the window.",
              items: { $ref: "#/components/schemas/HourBucket" },
            },
            sla: {
              type: "object",
              description: "Rolled-up success rates over fixed trailing windows.",
              required: ["d1", "d7", "d30"],
              properties: {
                d1: { $ref: "#/components/schemas/SlaWindow" },
                d7: { $ref: "#/components/schemas/SlaWindow" },
                d30: { $ref: "#/components/schemas/SlaWindow" },
              },
            },
          },
        },
        DayUptime: {
          type: "object",
          description: "Probe outcomes for one UTC day.",
          required: ["date", "total", "ok", "uptime"],
          properties: {
            date: { type: "string", format: "date", description: "YYYY-MM-DD (UTC)." },
            total: { type: "integer", description: "Probes attempted that day." },
            ok: { type: "integer", description: "Probes that completed successfully." },
            uptime: { type: ["number", "null"], minimum: 0, maximum: 100, description: "Success rate as a percentage, or null when no probes ran." },
          },
        },
        HourBucket: {
          type: "object",
          description: "Probe outcomes aggregated by UTC hour of day.",
          required: ["hour", "total", "ok", "avgTtft", "avgLatency", "uptime"],
          properties: {
            hour: { type: "integer", minimum: 0, maximum: 23, description: "Hour of day (UTC)." },
            total: { type: "integer", description: "Probes attempted in this hour across the window." },
            ok: { type: "integer", description: "Probes that completed successfully." },
            avgTtft: { type: ["number", "null"], description: "Mean time to first token in milliseconds, or null when no probes ran." },
            avgLatency: { type: ["number", "null"], description: "Mean end-to-end latency in milliseconds, or null when no probes ran." },
            uptime: { type: ["number", "null"], minimum: 0, maximum: 100, description: "Success rate as a percentage, or null when no probes ran." },
          },
        },
        SlaWindow: {
          type: "object",
          description: "Success rate over a fixed trailing window.",
          required: ["total", "ok", "uptime"],
          properties: {
            total: { type: "integer", description: "Probes attempted in the window." },
            ok: { type: "integer", description: "Probes that completed successfully." },
            uptime: { type: ["number", "null"], minimum: 0, maximum: 100, description: "Success rate as a percentage, or null when no probes ran." },
          },
        },
        Error: {
          type: "object",
          description: "Every non-2xx response from this API has this shape.",
          required: ["error"],
          properties: {
            error: {
              type: "object",
              required: ["code", "message", "hint", "docs"],
              properties: {
                code: { type: "string", enum: [...ERROR_CODES], description: "Stable machine-readable cause. Compare on this, not on `message`." },
                message: { type: "string", description: "What went wrong, in prose." },
                hint: { type: "string", description: "What to do about it." },
                docs: { type: "string", format: "uri", description: "Where the endpoints are documented." },
              },
            },
          },
        },
      },
    },
  }
}
