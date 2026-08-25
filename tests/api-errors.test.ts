import { describe, expect, it } from "vitest"

import {
  ERROR_CODES,
  apiErrorBody,
  invalidParameter,
  jsonError,
  methodNotAllowed,
  notFound,
  readOnlyMethodHandler,
  serverError,
  serviceUnavailable,
} from "@/lib/api/errors"
import { absoluteUrl } from "@/lib/site"

async function body(res: Response) {
  return (await res.json()) as { error: { code: string; message: string; hint: string; docs: string } }
}

describe("error envelope", () => {
  it("always carries a code, a message, a hint and a docs link", async () => {
    const responses = [
      notFound("/api/nope"),
      methodNotAllowed("POST", ["GET", "HEAD"]),
      invalidParameter("range", "1y", ["12h", "24h", "7d"]),
      serverError("Reading the fleet trend series"),
      serviceUnavailable("Database unreachable.", "Retry shortly."),
    ]
    for (const res of responses) {
      const { error } = await body(res)
      expect(ERROR_CODES).toContain(error.code)
      expect(error.message.length).toBeGreaterThan(10)
      expect(error.hint.length).toBeGreaterThan(10)
      expect(error.docs).toBe(absoluteUrl("/api"))
    }
  })

  it("is JSON, never HTML", async () => {
    const res = notFound("/api/nope")
    expect(res.headers.get("Content-Type")).toContain("application/json")
  })

  it("is never cached — a stale 500 outlives the outage it described", () => {
    expect(jsonError(500, "server_error", "x y z", "a b c").headers.get("Cache-Control")).toBe("no-store")
  })
})

describe("notFound", () => {
  it("names the path and points at the spec", async () => {
    const { error } = await body(notFound("/api/does-not-exist"))
    expect(error.code).toBe("not_found")
    expect(error.message).toContain("/api/does-not-exist")
    expect(error.hint).toContain(absoluteUrl("/openapi.json"))
  })
})

describe("methodNotAllowed", () => {
  it("returns 405 with an Allow header", async () => {
    const res = methodNotAllowed("DELETE", ["GET", "HEAD"])
    expect(res.status).toBe(405)
    expect(res.headers.get("Allow")).toBe("GET, HEAD")
    expect((await body(res)).error.code).toBe("method_not_allowed")
  })

  it("readOnlyMethodHandler reports the method that was actually used", async () => {
    const res = readOnlyMethodHandler(new Request("https://example.com/api/health", { method: "PUT" }))
    expect(res.status).toBe(405)
    expect((await body(res)).error.message).toContain("PUT")
  })
})

describe("invalidParameter", () => {
  it("names the parameter, what came in, and what is accepted", async () => {
    const res = invalidParameter("range", "1y", ["12h", "24h", "7d"])
    expect(res.status).toBe(400)
    const { error } = await body(res)
    expect(error.code).toBe("invalid_parameter")
    expect(error.message).toContain("range")
    expect(error.message).toContain("1y")
    expect(error.message).toContain("12h, 24h, 7d")
    expect(error.hint).toContain("range=12h")
  })
})

describe("apiErrorBody", () => {
  it("is a plain serialisable object", () => {
    expect(JSON.parse(JSON.stringify(apiErrorBody("not_found", "a message", "a hint")))).toEqual({
      error: { code: "not_found", message: "a message", hint: "a hint", docs: absoluteUrl("/api") },
    })
  })
})
