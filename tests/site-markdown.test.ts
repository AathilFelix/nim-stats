import { describe, expect, it } from "vitest"

import { ABOUT_PAGE, CONTACT_PAGE, PRIVACY_PAGE } from "@/lib/content/pages"
import {
  renderDiscoverMarkdown,
  renderHomeMarkdown,
  renderNotFoundMarkdown,
  renderStaticPageMarkdown,
  renderStatusMarkdown,
  type FleetSnapshot,
  type MarkdownModel,
} from "@/lib/markdown/site-markdown"

function model(over: Partial<MarkdownModel> = {}): MarkdownModel {
  return {
    id: "meta/llama-3.1-8b-instruct",
    name: "llama-3.1-8b-instruct",
    provider: "meta",
    status: "healthy",
    uptime: 99.5,
    ttft: 320,
    throughput: 48.2,
    reliability: 97,
    congestion: 12,
    ...over,
  }
}

const recommendedModel = model()

const snapshot: FleetSnapshot = {
  fleetState: "partial_degradation",
  lastProbeAt: "2026-08-25T12:00:00.000Z",
  recommended: { model: recommendedModel, reasons: ["Low congestion (12%)", "Low queue pressure"] },
  models: [
    recommendedModel,
    model({ id: "b", name: "mistral-7b", provider: "mistralai", status: "busy", reliability: 71, ttft: 910, throughput: 21.4, congestion: 64 }),
    model({ id: "c", name: "gemma-2-9b", provider: "google", status: "jammed", reliability: 12, ttft: 0, throughput: 0, uptime: 41.25, congestion: 98 }),
  ],
}

const EMPTY: FleetSnapshot = { models: [], recommended: null, lastProbeAt: null, fleetState: "unknown" }

describe("renderHomeMarkdown", () => {
  const md = renderHomeMarkdown(snapshot)

  it("opens with a single H1 and a blockquote summary", () => {
    expect(md.startsWith("# NIM Stats — Fleet Overview\n")).toBe(true)
    expect(md.match(/^# /gm)).toHaveLength(1)
    expect(md).toContain("\n> Real-time status and reliability metrics")
  })

  it("reports fleet counts and the last probe timestamp", () => {
    expect(md).toContain("**Endpoints tracked:** 3")
    expect(md).toContain("**Healthy:** 1 · **Busy:** 1 · **Jammed:** 1")
    expect(md).toContain("2026-08-25T12:00:00.000Z")
  })

  it("renders one table row per endpoint under a header row", () => {
    const rows = md.split("\n").filter((l) => l.startsWith("| ") && !l.startsWith("| ---") && !l.startsWith("| Model"))
    expect(rows).toHaveLength(3)
    expect(rows[0]).toContain("llama-3.1-8b-instruct")
  })

  it("surfaces the dashboard's own recommendation, with its reasons", () => {
    // Same engine as the HTML, so the two representations can't disagree.
    expect(md).toContain("**llama-3.1-8b-instruct** (meta)")
    expect(md).toContain("Why: Low congestion (12%); Low queue pressure.")
  })

  it("says so plainly when nothing qualifies", () => {
    const none = renderHomeMarkdown({ ...snapshot, recommended: null })
    expect(none).toContain("No endpoint currently meets the operational thresholds.")
  })

  it("averages latency and throughput over measured endpoints only", () => {
    // gemma reports 0/0 (never completed a probe) and must not drag the mean down.
    expect(md).toContain("**Average time to first token:** 615 ms")
    expect(md).toContain("**Average throughput:** 34.8 tok/s")
  })
})

describe("renderStatusMarkdown", () => {
  it("leads with the healthy fraction", () => {
    expect(renderStatusMarkdown(snapshot)).toContain("**1 of 3 endpoints healthy (33%).**")
  })
})

describe("renderDiscoverMarkdown", () => {
  const md = renderDiscoverMarkdown(snapshot)

  it("ranks by TTFT ascending, excluding jammed and unmeasured endpoints", () => {
    const section = md.split("## Lowest time to first token")[1].split("##")[0]
    expect(section).toContain("1. **llama-3.1-8b-instruct**")
    expect(section).toContain("2. **mistral-7b**")
    expect(section).not.toContain("gemma-2-9b")
  })

  it("ranks by throughput descending", () => {
    const section = md.split("## Highest sustained throughput")[1].split("##")[0]
    expect(section.indexOf("llama-3.1-8b-instruct")).toBeLessThan(section.indexOf("mistral-7b"))
  })

  it("groups endpoints by provider", () => {
    expect(md).toContain("| meta | 1 | 1 |")
    expect(md).toContain("| google | 1 | 0 |")
  })
})

describe("empty fleet", () => {
  it("degrades to an honest placeholder instead of an empty table", () => {
    for (const render of [renderHomeMarkdown, renderStatusMarkdown, renderDiscoverMarkdown]) {
      const md = render(EMPTY)
      expect(md).toContain("No endpoints have been measured yet")
      expect(md).not.toContain("| Model |")
    }
  })
})

describe("renderStaticPageMarkdown", () => {
  it.each([ABOUT_PAGE, CONTACT_PAGE, PRIVACY_PAGE])("renders $path with every section", (page) => {
    const md = renderStaticPageMarkdown(page)
    expect(md.startsWith(`# ${page.title}`)).toBe(true)
    for (const section of page.sections) expect(md).toContain(`## ${section.heading}`)
    expect(md.length).toBeGreaterThan(500)
  })
})

describe("renderNotFoundMarkdown", () => {
  const md = renderNotFoundMarkdown("/does/not/exist")

  it("names the path that failed", () => {
    expect(md).toContain("`/does/not/exist` does not exist")
  })

  it("points at the sitemap, llms.txt and robots.txt", () => {
    expect(md).toContain("https://nimstats.aathil.com/sitemap.xml")
    expect(md).toContain("https://nimstats.aathil.com/llms.txt")
    expect(md).toContain("https://nimstats.aathil.com/robots.txt")
  })

  it("links every public page so an agent can recover", () => {
    for (const path of ["/", "/discover", "/status", "/about", "/contact", "/privacy"]) {
      const url = path === "/" ? "https://nimstats.aathil.com)" : `https://nimstats.aathil.com${path})`
      expect(md).toContain(url)
    }
  })

  it("escapes pipes so a hostile path cannot break out of the body", () => {
    expect(renderNotFoundMarkdown("/a|b")).toContain("/a\\|b")
  })
})

describe("every document", () => {
  it("ends with the machine-readable index", () => {
    for (const md of [
      renderHomeMarkdown(snapshot),
      renderStatusMarkdown(snapshot),
      renderDiscoverMarkdown(snapshot),
      renderStaticPageMarkdown(ABOUT_PAGE),
    ]) {
      expect(md).toContain("## Machine-readable index")
      expect(md).toContain("/llms.txt")
    }
  })
})
