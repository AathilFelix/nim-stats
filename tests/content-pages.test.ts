import { describe, expect, it } from "vitest"

import { HOME_EXPLAINER, STATIC_PAGES, findStaticPage, pageTextLength } from "@/lib/content/pages"
import { stripInline } from "@/lib/markdown/inline"

describe("trust-anchor pages", () => {
  it("publishes /about, /contact and /privacy", () => {
    expect(STATIC_PAGES.map((p) => p.path).sort()).toEqual(["/about", "/contact", "/privacy"])
  })

  it.each(STATIC_PAGES)("$path carries well over the 500-character floor agents check", (page) => {
    // The audit threshold is 500 characters of real prose. Assert on the text
    // with inline markup stripped so link syntax can't pad the count.
    const prose = page.sections.flatMap((s) => s.body).map(stripInline).join(" ")
    expect(prose.length).toBeGreaterThan(1000)
    expect(pageTextLength(page)).toBeGreaterThan(500)
  })

  it.each(STATIC_PAGES)("$path has a title, a summary and at least two sections", (page) => {
    expect(page.title.length).toBeGreaterThan(0)
    expect(page.summary.length).toBeGreaterThan(60)
    expect(page.sections.length).toBeGreaterThanOrEqual(2)
    for (const section of page.sections) expect(section.body.length).toBeGreaterThan(0)
  })

  it("resolves a page by path and nothing else", () => {
    expect(findStaticPage("/about")?.path).toBe("/about")
    expect(findStaticPage("/about/")).toBeUndefined()
    expect(findStaticPage("/nope")).toBeUndefined()
  })

  it("states the NVIDIA non-affiliation on the about page", () => {
    expect(findStaticPage("/about")!.sections.flatMap((s) => s.body).join(" ")).toContain(
      "not affiliated with, endorsed by, or operated by NVIDIA",
    )
  })
})

describe("home explainer", () => {
  it("adds enough server-rendered prose for the homepage to read as content", () => {
    const prose = HOME_EXPLAINER.flatMap((s) => s.body).map(stripInline).join(" ")
    expect(prose.length).toBeGreaterThan(1000)
  })

  it("defines the three status words the fleet table uses", () => {
    const prose = HOME_EXPLAINER.flatMap((s) => s.body).join(" ")
    for (const word of ["Healthy", "Busy", "Jammed"]) expect(prose).toContain(word)
  })
})
