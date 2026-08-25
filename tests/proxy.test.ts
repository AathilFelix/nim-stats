import { NextRequest } from "next/server"
import { describe, expect, it } from "vitest"

import { proxy } from "@/proxy"

const ORIGIN = "https://nimstats.aathil.com"

function request(path: string, init: { accept?: string; method?: string; headers?: Record<string, string> } = {}) {
  const headers = new Headers(init.headers ?? {})
  if (init.accept !== undefined) headers.set("accept", init.accept)
  return new NextRequest(new URL(path, ORIGIN), { method: init.method ?? "GET", headers })
}

/** The internal path a rewrite points at, or null when the response is not a rewrite. */
function rewriteTarget(res: Response): string | null {
  const url = res.headers.get("x-middleware-rewrite")
  return url ? new URL(url).pathname : null
}

describe("HTML branch", () => {
  it("passes a browser request through and adds Accept to Vary", () => {
    const res = proxy(request("/", { accept: "text/html,*/*;q=0.8" }))
    expect(res.status).toBe(200)
    expect(rewriteTarget(res)).toBeNull()
    expect(res.headers.get("Vary")).toBe("Accept")
  })

  it("treats a missing Accept header as HTML", () => {
    expect(rewriteTarget(proxy(request("/")))).toBeNull()
  })
})

describe("Markdown branch", () => {
  it("rewrites the homepage to the Markdown handler", () => {
    const res = proxy(request("/", { accept: "text/markdown" }))
    expect(rewriteTarget(res)).toBe("/api/markdown")
    expect(res.headers.get("Vary")).toBe("Accept")
  })

  it("rewrites a nested path", () => {
    expect(rewriteTarget(proxy(request("/about", { accept: "text/markdown" })))).toBe("/api/markdown/about")
  })

  it("honours the .md alias regardless of Accept", () => {
    expect(rewriteTarget(proxy(request("/discover.md", { accept: "text/html" })))).toBe("/api/markdown/discover")
    expect(rewriteTarget(proxy(request("/.md")))).toBe("/api/markdown")
  })

  it("rewrites an unknown path too, so 404s get a Markdown body", () => {
    expect(rewriteTarget(proxy(request("/nope", { accept: "text/markdown" })))).toBe("/api/markdown/nope")
  })
})

describe("406 branch", () => {
  it("rejects a client that accepts neither representation", async () => {
    const res = proxy(request("/", { accept: "application/pdf" }))
    expect(res.status).toBe(406)
    expect(res.headers.get("Vary")).toBe("Accept")
    expect(await res.text()).toContain("text/html, text/markdown")
  })
})

describe("bypasses", () => {
  it.each([
    "/api/health",
    "/_next/static/chunk.js",
    "/opengraph-image",
    "/twitter-image",
    "/agent-instructions.md",
    "/favicon.ico",
    "/globe.svg",
  ])("leaves %s untouched even with a hostile Accept", (path) => {
    const res = proxy(request(path, { accept: "application/pdf" }))
    expect(res.status).toBe(200)
    expect(rewriteTarget(res)).toBeNull()
  })

  it("never 406s an RSC payload request — that would break auto-refresh", () => {
    const rsc = proxy(request("/", { accept: "text/x-component", headers: { rsc: "1" } }))
    expect(rsc.status).toBe(200)
    expect(rewriteTarget(rsc)).toBeNull()

    const prefetch = proxy(request("/", { accept: "*/*", headers: { "next-router-prefetch": "1" } }))
    expect(prefetch.status).toBe(200)
  })

  it("does not negotiate non-GET requests", () => {
    const res = proxy(request("/", { accept: "application/pdf", method: "POST" }))
    expect(res.status).toBe(200)
  })
})
