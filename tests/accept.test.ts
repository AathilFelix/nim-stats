import { describe, expect, it } from "vitest"

import { appendVaryAccept, parseAccept, preferredType } from "@/lib/http/accept"

describe("parseAccept", () => {
  it("defaults q to 1 and lower-cases the media range", () => {
    expect(parseAccept("Text/Markdown")).toEqual([{ type: "text/markdown", q: 1, specificity: 2 }])
  })

  it("reads q-values and clamps them to [0,1]", () => {
    const [a, b, c] = parseAccept("text/html;q=0.5, text/markdown;q=9, text/plain;q=-3")
    expect(a.q).toBe(0.5)
    expect(b.q).toBe(1)
    expect(c.q).toBe(0)
  })

  it("ranks specificity: exact type > type/* > */*", () => {
    expect(parseAccept("text/html, text/*, */*").map((e) => e.specificity)).toEqual([2, 1, 0])
  })

  it("ignores empty entries from a trailing comma", () => {
    expect(parseAccept("text/html, ")).toHaveLength(1)
  })
})

describe("preferredType", () => {
  it("serves HTML when there is no Accept header", () => {
    expect(preferredType(null)).toBe("text/html")
    expect(preferredType("")).toBe("text/html")
  })

  it("serves HTML to a browser", () => {
    expect(
      preferredType("text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,*/*;q=0.8"),
    ).toBe("text/html")
  })

  it("serves Markdown when the agent asks for it", () => {
    expect(preferredType("text/markdown")).toBe("text/markdown")
  })

  it("ranks by q-value ahead of client order", () => {
    expect(preferredType("text/markdown;q=0.4, text/html;q=0.9")).toBe("text/html")
    expect(preferredType("text/html;q=0.4, text/markdown;q=0.9")).toBe("text/markdown")
  })

  it("breaks q ties on client order", () => {
    expect(preferredType("text/markdown, text/html")).toBe("text/markdown")
    expect(preferredType("text/html, text/markdown")).toBe("text/html")
  })

  it("lets a specific range override a wildcard regardless of q (RFC 9110 §12.5.1)", () => {
    // text/html is explicitly rejected; the wildcard must not resurrect it.
    expect(preferredType("text/html;q=0, */*")).toBe("text/markdown")
  })

  it("matches a subtype wildcard", () => {
    expect(preferredType("text/*")).toBe("text/html")
  })

  it("returns null when the client accepts nothing this origin produces", () => {
    expect(preferredType("application/pdf")).toBeNull()
    expect(preferredType("text/html;q=0, text/markdown;q=0")).toBeNull()
  })

  it("gives */* the server's preferred representation", () => {
    expect(preferredType("*/*")).toBe("text/html")
  })
})

describe("appendVaryAccept", () => {
  it("sets Vary when absent", () => {
    const h = new Headers()
    appendVaryAccept(h)
    expect(h.get("Vary")).toBe("Accept")
  })

  it("unions with existing tokens instead of clobbering them", () => {
    const h = new Headers({ Vary: "RSC, Accept-Encoding" })
    appendVaryAccept(h)
    expect(h.get("Vary")).toBe("RSC, Accept-Encoding, Accept")
  })

  it("is idempotent and case-insensitive", () => {
    const h = new Headers({ Vary: "accept, Accept-Encoding" })
    appendVaryAccept(h)
    expect(h.get("Vary")).toBe("accept, Accept-Encoding")
  })

  it("leaves Vary: * alone", () => {
    const h = new Headers({ Vary: "*" })
    appendVaryAccept(h)
    expect(h.get("Vary")).toBe("*")
  })
})
