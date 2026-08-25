import { describe, expect, it } from "vitest"

import { ERROR_CODES } from "@/lib/api/errors"
import { OPENAPI_API_VERSION, buildOpenApiDocument } from "@/lib/api/openapi"
import {
  DEFAULT_RELIABILITY_DAYS,
  DEFAULT_TREND_RANGE,
  RELIABILITY_DAY_VALUES,
  TREND_RANGE_VALUES,
} from "@/lib/api/params"
import { buildApiReference, typeLabel } from "@/lib/api/reference"
import { SITE_URL } from "@/lib/site"

type AnyRecord = Record<string, unknown>

const doc = buildOpenApiDocument() as AnyRecord
const paths = doc.paths as Record<string, AnyRecord>
const schemas = (doc.components as AnyRecord).schemas as Record<string, AnyRecord>
const operations = Object.entries(paths).flatMap(([path, item]) =>
  Object.entries(item).map(([method, op]) => ({ path, method, op: op as AnyRecord })),
)

describe("document shape", () => {
  it("is OpenAPI 3.1 and serialises to valid JSON", () => {
    expect(doc.openapi).toBe("3.1.0")
    expect(() => JSON.parse(JSON.stringify(doc))).not.toThrow()
  })

  it("carries the info block agents read for identity", () => {
    const info = doc.info as AnyRecord
    expect(info.title).toBe("NIM Stats API")
    expect(info.version).toBe(OPENAPI_API_VERSION)
    expect(String(info.description).length).toBeGreaterThan(200)
    expect((info.contact as AnyRecord).url).toContain("github.com")
    expect((info.license as AnyRecord).name).toBe("MIT")
  })

  it("declares itself unauthenticated rather than leaving tooling to guess", () => {
    // An empty root-level `security` is how OpenAPI spells "public". Redocly's
    // recommended ruleset fails the document without it.
    expect(doc.security).toEqual([])
    expect((doc.components as AnyRecord).securitySchemes).toBeUndefined()
  })

  it("points at the production origin and the source repository", () => {
    expect((doc.servers as AnyRecord[])[0].url).toBe(SITE_URL)
    expect(String((doc.externalDocs as AnyRecord).url)).toContain("github.com")
  })
})

describe("operations", () => {
  it("documents exactly the endpoints that are reachable without a token", () => {
    // Token-gated internal routes are deliberately absent: advertising an
    // endpoint that 404s for everyone is worse than not listing it.
    expect(Object.keys(paths).sort()).toEqual([
      "/api/fleet/reliability",
      "/api/fleet/trend",
      "/api/health",
    ])
  })

  it("gives every operation a unique operationId", () => {
    const ids = operations.map((o) => String(o.op.operationId))
    expect(ids).toEqual(["getHealth", "getFleetTrend", "getFleetReliability"])
    expect(new Set(ids).size).toBe(ids.length)
  })

  it("gives every operation a summary and a substantive description", () => {
    for (const { op } of operations) {
      expect(String(op.summary).length).toBeGreaterThan(10)
      expect(String(op.description).length).toBeGreaterThan(120)
      expect(Array.isArray(op.tags)).toBe(true)
    }
  })

  it("types every response and declares the error envelope on each failure", () => {
    for (const { op } of operations) {
      const responses = op.responses as Record<string, AnyRecord>
      const ok = responses["200"]
      const schema = ((ok.content as AnyRecord)["application/json"] as AnyRecord).schema as AnyRecord
      expect(String(schema.$ref)).toMatch(/^#\/components\/schemas\//)

      const failures = Object.keys(responses).filter((s) => Number(s) >= 400)
      expect(failures.length).toBeGreaterThan(0)
      for (const status of failures) {
        const body = (responses[status].content as AnyRecord)["application/json"] as AnyRecord
        expect((body.schema as AnyRecord).$ref).toBe("#/components/schemas/Error")
      }
    }
  })

  it("declares parameter enums that match what the routes actually enforce", () => {
    const range = ((paths["/api/fleet/trend"].get as AnyRecord).parameters as AnyRecord[])[0]
    expect((range.schema as AnyRecord).enum).toEqual(TREND_RANGE_VALUES)
    expect((range.schema as AnyRecord).default).toBe(DEFAULT_TREND_RANGE)

    const days = ((paths["/api/fleet/reliability"].get as AnyRecord).parameters as AnyRecord[])[0]
    expect((days.schema as AnyRecord).enum).toEqual([...RELIABILITY_DAY_VALUES])
    expect((days.schema as AnyRecord).default).toBe(DEFAULT_RELIABILITY_DAYS)
  })
})

describe("schemas", () => {
  it("resolves every $ref used anywhere in the document", () => {
    const refs = [...JSON.stringify(doc).matchAll(/"\$ref":"#\/components\/schemas\/([^"]+)"/g)].map(
      (m) => m[1],
    )
    expect(refs.length).toBeGreaterThan(5)
    for (const ref of refs) expect(schemas).toHaveProperty(ref)
  })

  it("describes every property of every schema", () => {
    for (const [name, schema] of Object.entries(schemas)) {
      expect(String(schema.description).length, `${name} description`).toBeGreaterThan(10)
      for (const [field, def] of Object.entries((schema.properties ?? {}) as Record<string, AnyRecord>)) {
        expect(String(def.description).length, `${name}.${field}`).toBeGreaterThan(5)
      }
    }
  })

  it("models nullable measurement fields as unions, so no data reads as zero", () => {
    const day = (schemas.DayUptime.properties as Record<string, AnyRecord>).uptime
    expect(day.type).toEqual(["number", "null"])
    const hour = (schemas.HourBucket.properties as Record<string, AnyRecord>).avgTtft
    expect(hour.type).toEqual(["number", "null"])
  })

  it("keeps the Error schema's codes in sync with the ones the API emits", () => {
    const code = ((schemas.Error.properties as AnyRecord).error as AnyRecord)
    const props = (code.properties as Record<string, AnyRecord>).code
    expect(props.enum).toEqual([...ERROR_CODES])
  })
})

describe("buildApiReference", () => {
  const reference = buildApiReference(doc)

  it("flattens every operation with its parameters and responses", () => {
    expect(reference.operations.map((o) => o.operationId)).toEqual([
      "getHealth",
      "getFleetTrend",
      "getFleetReliability",
    ])
    const trend = reference.operations.find((o) => o.operationId === "getFleetTrend")!
    expect(trend.method).toBe("GET")
    expect(trend.parameters[0]).toMatchObject({ name: "range", required: false, enum: TREND_RANGE_VALUES })
    expect(trend.responses.map((r) => r.status)).toEqual(["200", "400", "405", "500"])
    expect(trend.responses[0].schema).toBe("TrendResponse")
    expect(trend.responses[1].schema).toBe("Error")
  })

  it("flattens schema fields with their required flags", () => {
    const point = reference.schemas.find((s) => s.name === "TrendPoint")!
    expect(point.fields.map((f) => f.name)).toEqual(["t", "ttftMs", "throughput", "successRate"])
    expect(point.fields.every((f) => f.required)).toBe(true)
  })
})

describe("typeLabel", () => {
  it("renders scalars, unions, arrays, refs and consts", () => {
    expect(typeLabel({ type: "string" })).toBe("string")
    expect(typeLabel({ type: ["number", "null"] })).toBe("number | null")
    expect(typeLabel({ type: "array", items: { $ref: "#/components/schemas/TrendPoint" } })).toBe("TrendPoint[]")
    expect(typeLabel({ $ref: "#/components/schemas/Health" })).toBe("Health")
    expect(typeLabel({ type: "string", const: "ok" })).toBe('"ok"')
    expect(typeLabel(undefined)).toBe("unknown")
  })
})
