import { describe, expect, it } from "vitest"

import sitemap from "@/app/sitemap"
import { jsonLdGraph } from "@/components/site/json-ld"
import { buildAiCatalog, buildApiCatalog } from "@/lib/agent/discovery"
import { DISCOVERY_LINKS, markdownAlternateLink, renderLinkHeader } from "@/lib/agent/link-header"
import { CONTENT_SIGNALS, renderRobotsTxt } from "@/lib/agent/robots"
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
    // Own pages must be canonical; the only off-site links allowed are the
    // source repository, which llms.txt points at for implementation detail.
    for (const href of hrefs) {
      expect(href.startsWith(SITE_URL) || href.startsWith("https://github.com/")).toBe(true)
    }
  })

  it("lists the API surface by name so it is discoverable from here", () => {
    expect(txt).toContain("## API")
    expect(txt).toContain(absoluteUrl("/openapi.json"))
    expect(txt).toContain(absoluteUrl("/api"))
    for (const op of ["getHealth", "getFleetTrend", "getFleetReliability"]) expect(txt).toContain(op)
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

  it("includes the trust-anchor pages and the API reference", () => {
    const urls = entries.map((e) => e.url)
    for (const path of ["/about", "/contact", "/privacy", "/api"]) {
      expect(urls).toContain(absoluteUrl(path))
    }
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
  const txt = renderRobotsTxt()

  it("allows everything public and points at the sitemap", () => {
    expect(txt).toContain("User-agent: *")
    expect(txt).toContain("Allow: /")
    expect(txt).toContain(`Sitemap: ${absoluteUrl("/sitemap.xml")}`)
    // No `Host:` directive — it is a Yandex extension, not part of the standard.
    expect(txt).not.toContain("Host:")
  })

  it("disallows only the internal API and build output", () => {
    const disallowed = txt.split("\n").filter((l) => l.startsWith("Disallow:"))
    expect(disallowed).toEqual(["Disallow: /api/", "Disallow: /_next/"])
  })

  it("declares Content Signals inside the user-agent group", () => {
    const lines = txt.split("\n").filter((l) => !l.startsWith("#") && l.trim() !== "")
    const group = lines.indexOf("User-agent: *")
    expect(group).toBeGreaterThanOrEqual(0)
    expect(lines[group + 1]).toBe(`Content-Signal: ${CONTENT_SIGNALS}`)
  })

  it("opts into search and live grounding, out of training", () => {
    expect(CONTENT_SIGNALS).toBe("search=yes, ai-input=yes, ai-train=no")
    for (const signal of ["search", "ai-input", "ai-train"]) {
      expect(CONTENT_SIGNALS).toContain(`${signal}=`)
    }
  })
})

describe("Link header", () => {
  const header = renderLinkHeader()

  it("serialises every link as an RFC 8288 link-value", () => {
    const values = header.split(", <").length
    expect(values).toBe(DISCOVERY_LINKS.length)
    for (const link of DISCOVERY_LINKS) {
      expect(header).toContain(`<${link.href}>; rel="${link.rel}"`)
    }
  })

  it("keeps targets relative so preview deployments point at themselves", () => {
    for (const link of DISCOVERY_LINKS) expect(link.href.startsWith("/")).toBe(true)
  })

  it("advertises the catalog, the spec, the docs and the health endpoint", () => {
    const byRel = new Map(DISCOVERY_LINKS.map((l) => [l.rel, l.href]))
    expect(byRel.get("api-catalog")).toBe("/.well-known/api-catalog")
    expect(byRel.get("service-desc")).toBe("/openapi.json")
    expect(byRel.get("service-doc")).toBe("/api")
    expect(byRel.get("status")).toBe("/api/health")
  })

  it("points each page at its own Markdown twin", () => {
    expect(markdownAlternateLink("/")).toContain('</.md>; rel="alternate"')
    expect(markdownAlternateLink("/about")).toContain('</about.md>; rel="alternate"')
    expect(markdownAlternateLink("/about/")).toContain('</about.md>; rel="alternate"')
    expect(markdownAlternateLink("/about")).toContain('type="text/markdown"')
  })
})

describe("/.well-known/api-catalog", () => {
  type CatalogLink = { href: string; type?: string; title?: string }
  const catalog = buildApiCatalog() as {
    linkset: Array<{ anchor: string } & Record<string, CatalogLink[]>>
  }

  it("is a linkset anchored on the API, with absolute targets", () => {
    expect(catalog.linkset).toHaveLength(1)
    const entry = catalog.linkset[0]
    expect(entry.anchor).toBe(absoluteUrl("/api"))
    for (const [rel, links] of Object.entries(entry)) {
      if (rel === "anchor") continue
      for (const link of links as CatalogLink[]) {
        expect(link.href.startsWith("https://")).toBe(true)
      }
    }
  })

  it("carries service-desc, service-doc and status", () => {
    const entry = catalog.linkset[0]
    expect(entry["service-desc"][0].href).toBe(absoluteUrl("/openapi.json"))
    expect(entry["service-doc"].map((l) => l.href)).toContain(absoluteUrl("/api"))
    expect(entry.status[0].href).toBe(absoluteUrl("/api/health"))
  })
})

describe("/.well-known/ai-catalog.json", () => {
  const catalog = buildAiCatalog() as {
    specVersion: string
    host: { name: string; url: string }
    entries: Array<{
      id: string
      displayName: string
      type: string
      url?: string
      data?: unknown
      representativeQueries: string[]
    }>
  }

  it("declares a spec version and the host", () => {
    expect(catalog.specVersion).toMatch(/^\d+\.\d+/)
    expect(catalog.host.url).toBe(SITE_URL)
  })

  it("gives every entry a urn:air id scoped to this domain", () => {
    const ids = catalog.entries.map((e) => e.id)
    expect(ids.length).toBeGreaterThan(0)
    expect(new Set(ids).size).toBe(ids.length)
    for (const id of ids) expect(id).toMatch(/^urn:air:nimstats\.aathil\.com:[a-z-]+:[a-z-]+$/)
  })

  it("gives every entry a media type, exactly one locator, and 2-5 queries", () => {
    for (const entry of catalog.entries) {
      expect(entry.type).toMatch(/^[a-z]+\/[a-z+.-]+$/)
      expect(Number(entry.url !== undefined) + Number(entry.data !== undefined)).toBe(1)
      expect(entry.representativeQueries.length).toBeGreaterThanOrEqual(2)
      expect(entry.representativeQueries.length).toBeLessThanOrEqual(5)
    }
  })

  it("keeps entry URLs on this origin", () => {
    for (const entry of catalog.entries) expect(entry.url?.startsWith(SITE_URL)).toBe(true)
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
