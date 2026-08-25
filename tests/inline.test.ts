import { describe, expect, it } from "vitest"

import { stripInline, tokenizeInline } from "@/lib/markdown/inline"

describe("tokenizeInline", () => {
  it("returns plain text untouched", () => {
    expect(tokenizeInline("just words")).toEqual([{ kind: "text", value: "just words" }])
  })

  it("extracts links with their href", () => {
    expect(tokenizeInline("see [Aathil](https://aathil.com) now")).toEqual([
      { kind: "text", value: "see " },
      { kind: "link", value: "Aathil", href: "https://aathil.com" },
      { kind: "text", value: " now" },
    ])
  })

  it("extracts bold and code spans", () => {
    expect(tokenizeInline("**Healthy** and `Accept: text/markdown`")).toEqual([
      { kind: "strong", value: "Healthy" },
      { kind: "text", value: " and " },
      { kind: "code", value: "Accept: text/markdown" },
    ])
  })

  it("does not treat an underscore or asterisk inside a URL as markup", () => {
    const tokens = tokenizeInline("[x](https://e.com/a_b*c)")
    expect(tokens).toEqual([{ kind: "link", value: "x", href: "https://e.com/a_b*c" }])
  })

  it("leaves unmatched markup as literal text", () => {
    expect(tokenizeInline("**unclosed")).toEqual([{ kind: "text", value: "**unclosed" }])
  })

  it("handles several constructs in one string", () => {
    expect(tokenizeInline("a [b](/c) d **e** f `g`")).toHaveLength(6)
  })
})

describe("stripInline", () => {
  it("returns the visible text only", () => {
    expect(stripInline("see [Aathil](https://aathil.com) — **now** `here`")).toBe(
      "see Aathil — now here",
    )
  })
})
