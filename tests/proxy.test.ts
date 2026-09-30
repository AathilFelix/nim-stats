import { NextRequest } from "next/server"
import { describe, expect, it } from "vitest"

import { config, proxy } from "@/proxy"

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

  it("carries the discovery links plus this page's Markdown twin", () => {
    const res = proxy(request("/", { accept: "text/html" }))
    const header = res.headers.get("Link") ?? ""
    // Set here rather than left to next.config.ts: React's own preload Link
    // header replaces the config's on an HTML render.
    expect(header).toContain('</.well-known/api-catalog>; rel="api-catalog"')
    expect(header).toContain('</openapi.json>; rel="service-desc"')
  })

  it("advertises this page's Markdown twin with a Link header", () => {
    const home = proxy(request("/", { accept: "text/html" }))
    expect(home.headers.get("Link")).toContain('</.md>; rel="alternate"')

    const about = proxy(request("/about", { accept: "text/html" }))
    expect(about.headers.get("Link")).toContain('</about.md>; rel="alternate"')
    expect(about.headers.get("Link")).toContain('type="text/markdown"')
  })
})

describe("Markdown branch", () => {
  it("rewrites the homepage to the Markdown handler", () => {
    const res = proxy(request("/", { accept: "text/markdown" }))
    expect(rewriteTarget(res)).toBe("/api/markdown")
    expect(res.headers.get("Vary")).toBe("Accept")
    expect(res.headers.get("Link")).toContain('rel="api-catalog"')
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
    "/.well-known/api-catalog",
    "/.well-known/ai-catalog.json",
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

// The matcher decides whether the proxy function runs at all — on Vercel every
// match is a billed invocation, even when the page is a CDN hit. Evaluated the
// way Next compiles `has` values (anchored RegExp).
describe("matcher", () => {
  const acceptRules = config.matcher.flatMap((m) =>
    "has" in m && m.has ? m.has.filter((h) => h.key === "accept").map((h) => new RegExp(`^${h.value}$`)) : [],
  )
  const wakesProxy = (accept: string) => acceptRules.some((re) => re.test(accept))

  it("lets browsers and generic clients skip the proxy", () => {
    for (const accept of [
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      "text/html",
      "*/*",
      "text/*",
    ]) {
      expect(wakesProxy(accept), accept).toBe(false)
    }
  })

  it("routes Markdown negotiation and HTML-rejecting clients to the proxy", () => {
    expect(wakesProxy("text/markdown")).toBe(true)
    expect(wakesProxy("text/markdown, text/html;q=0.5")).toBe(true)
    expect(wakesProxy("application/json")).toBe(true)
  })

  it("never wakes the proxy for RSC requests", () => {
    for (const m of config.matcher) {
      if ("has" in m && m.has) expect(m.missing).toContainEqual({ type: "header", key: "rsc" })
    }
  })
})
