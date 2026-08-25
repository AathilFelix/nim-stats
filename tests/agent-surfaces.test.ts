import { describe, expect, it } from "vitest"

import robots from "@/app/robots"
import sitemap from "@/app/sitemap"
import { jsonLdGraph } from "@/components/site/json-ld"
import { renderAgentInstructions, renderLlmsTxt } from "@/lib/markdown/agent-docs"
import { PUBLIC_ROUTES, SITE_URL, absoluteUrl } from "@/lib/site"

describe("llms.txt", () => {
  const txt = renderLlmsTxt()

  it("follows the llmstxt.org shape: one H1, then a blockquote summary", () => {
    const lines = txt.split("\n")
    expect(lines[0]).toBe("# NIM Stats")
    expect(lines[2].startsWith("> ")).toBe(true)
    expect(txt.match(/^# /gm)).toHaveLength(1)
  })

  it("keeps headings out of the free-form region and links in every H2 section", () => {
    const sections = txt.split(/^## /m).slice(1)
    expect(sections.length).toBeGreaterThanOrEqual(3)
    for (const section of sections) {
      const bullets = section.split("\n").filter((l) => l.startsWith("- "))
      expect(bullets.length).toBeGreaterThan(0)
      for (const bullet of bullets) expect(bullet).toMatch(/^- \[[^\]]+\]\(https?:\/\/[^)]+\)/)
    }
  })

  it("tells an agent when to use the site, with concrete jobs", () => {
    expect(txt).toContain("**When to use this site.**")
    expect(txt).toContain("**When not to use it.**")
    for (const job of ["choosing which free NIM model to call right now", "is NIM down?"]) {
      expect(txt).toContain(job)
    }
  })

  it("documents how to call it, including the Accept header", () => {
    expect(txt).toContain("**How to call it.**")
    expect(txt).toContain("`Accept: text/markdown`")
  })

  it("links the sitemap and the agent-instructions file", () => {
    expect(txt).toContain(absoluteUrl("/sitemap.xml"))
    expect(txt).toContain(absoluteUrl("/agent-instructions.md"))
  })

  it("uses absolute URLs everywhere — an agent may have fetched this out of band", () => {
    const hrefs = [...txt.matchAll(/\]\(([^)]+)\)/g)].map((m) => m[1])
    expect(hrefs.length).toBeGreaterThan(5)
    for (const href of hrefs) expect(href.startsWith(SITE_URL)).toBe(true)
  })
})

describe("agent-instructions.md", () => {
  const md = renderAgentInstructions()

  it("has an explicit when-to-use section with named use cases", () => {
    expect(md).toContain("## When to use this")
    expect(md).toContain("## When not to use this")
    expect(md).toContain("**Pick a working endpoint.**")
    expect(md).toContain("**Diagnose a failing call.**")
  })

  it("shows the exact request an agent should make", () => {
    expect(md).toContain("GET https://nimstats.aathil.com/")
    expect(md).toContain("Accept: text/markdown")
  })

  it("maps questions to URLs", () => {
    expect(md).toContain("| Which free NIM endpoint should I call? |")
  })

  it("states the non-affiliation and how to cite", () => {
    expect(md).toContain("## How to cite")
    expect(md).toContain("not affiliated with NVIDIA Corporation")
  })
})

describe("sitemap.xml", () => {
  const entries = sitemap()

  it("lists every public route exactly once, as an absolute URL", () => {
    expect(entries.map((e) => e.url)).toEqual(PUBLIC_ROUTES.map((r) => absoluteUrl(r.path)))
    expect(new Set(entries.map((e) => e.url)).size).toBe(entries.length)
  })

  it("includes the trust-anchor pages", () => {
    const urls = entries.map((e) => e.url)
    for (const path of ["/about", "/contact", "/privacy"]) expect(urls).toContain(absoluteUrl(path))
  })

  it("carries lastmod, changefreq and a valid priority on every entry", () => {
    for (const entry of entries) {
      expect(entry.lastModified).toBeInstanceOf(Date)
      expect(entry.changeFrequency).toBeTruthy()
      expect(entry.priority).toBeGreaterThan(0)
      expect(entry.priority).toBeLessThanOrEqual(1)
    }
  })

  it("gives the homepage top priority", () => {
    expect(entries.find((e) => e.url === SITE_URL)?.priority).toBe(1)
  })
})

describe("robots.txt", () => {
  const result = robots()

  it("allows everything public and points at the sitemap", () => {
    const rule = Array.isArray(result.rules) ? result.rules[0] : result.rules
    expect(rule.userAgent).toBe("*")
    expect(rule.allow).toBe("/")
    expect(result.sitemap).toBe(absoluteUrl("/sitemap.xml"))
    // No `Host:` directive — it is a Yandex extension, not part of the standard.
    expect(result).not.toHaveProperty("host")
  })

  it("disallows only the internal API and build output", () => {
    const rule = Array.isArray(result.rules) ? result.rules[0] : result.rules
    expect(rule.disallow).toEqual(["/api/", "/_next/"])
  })
})

describe("JSON-LD graph", () => {
  const graph = jsonLdGraph as { "@context": string; "@graph": Array<Record<string, unknown>> }
  const nodes = graph["@graph"]
  const byType = (type: string) => nodes.find((n) => n["@type"] === type)!

  it("is a schema.org graph", () => {
    expect(graph["@context"]).toBe("https://schema.org")
    expect(nodes.map((n) => n["@type"])).toEqual(["Organization", "WebSite", "WebApplication"])
  })

  it("serialises to valid JSON with no script-terminating sequence", () => {
    const serialised = JSON.stringify(graph).replace(/</g, "\\u003c")
    expect(() => JSON.parse(serialised.replace(/\\u003c/g, "<"))).not.toThrow()
    expect(serialised).not.toContain("</")
  })

  it("gives the Organization a name, url, description, sameAs and a contactPoint", () => {
    const org = byType("Organization")
    expect(org.name).toBe("NIM Stats")
    expect(org.url).toBe(SITE_URL)
    expect(String(org.description).length).toBeGreaterThan(80)
    expect(Array.isArray(org.sameAs)).toBe(true)
    expect((org.sameAs as string[]).length).toBeGreaterThanOrEqual(3)

    const [contact] = org.contactPoint as Array<Record<string, unknown>>
    expect(contact["@type"]).toBe("ContactPoint")
    expect(contact.contactType).toBe("technical support")
    expect(contact.url).toBe(absoluteUrl("/contact"))
  })

  it("gives the WebApplication the identity fields an agent parses", () => {
    const app = byType("WebApplication")
    expect(app.name).toBe("NIM Stats")
    expect(app.url).toBe(SITE_URL)
    expect(String(app.description).length).toBeGreaterThan(80)
    expect(app.applicationCategory).toBe("DeveloperApplication")
    expect(app.isAccessibleForFree).toBe(true)
    expect((app.offers as Record<string, unknown>).price).toBe("0")
  })

  it("links the nodes by @id rather than duplicating the organisation", () => {
    const website = byType("WebSite")
    expect((website.publisher as Record<string, unknown>)["@id"]).toBe(byType("Organization")["@id"])
  })
})
