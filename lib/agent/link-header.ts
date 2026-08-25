// The `Link` response header (RFC 8288) — the cheapest agent-discovery surface
// there is: every response points at the machine-readable descriptions of this
// origin, so an agent never has to guess a well-known path or scrape HTML.
//
// This module deliberately imports nothing. next.config.ts is transpiled and
// executed on its own, outside the app's module graph, and the `@/*` path alias
// is not resolved there — anything it reaches must be dependency-free and
// imported by relative path. That constraint is why the link targets below are
// literal strings rather than built from lib/site.ts.

export type DiscoveryLink = {
  /** Target, relative to the origin. */
  href: string
  /** Registered IANA link relation, or a well-known extension relation. */
  rel: string
  type?: string
  title?: string
}

/**
 * Links advertised on every response.
 *
 * Targets are relative on purpose: RFC 8288 resolves them against the request
 * URL, so a preview deployment points at its own copies instead of at
 * production. Ordered most-useful-first, for an agent that reads only the first
 * few.
 */
export const DISCOVERY_LINKS: readonly DiscoveryLink[] = [
  {
    href: "/.well-known/api-catalog",
    rel: "api-catalog",
    type: "application/linkset+json",
    title: "API catalog",
  },
  {
    href: "/openapi.json",
    rel: "service-desc",
    type: "application/json",
    title: "OpenAPI 3.1 description",
  },
  { href: "/api", rel: "service-doc", type: "text/html", title: "API reference" },
  { href: "/api/health", rel: "status", type: "application/json", title: "Health check" },
  {
    href: "/llms.txt",
    rel: "describedby",
    type: "text/plain",
    title: "Site summary for language models",
  },
  {
    href: "/agent-instructions.md",
    rel: "help",
    type: "text/markdown",
    title: "How an agent should use this site",
  },
  {
    href: "/.well-known/ai-catalog.json",
    rel: "ai-catalog",
    type: "application/json",
    title: "Agentic resource discovery manifest",
  },
  { href: "/sitemap.xml", rel: "sitemap", type: "application/xml", title: "Sitemap" },
  { href: "/privacy", rel: "privacy-policy", type: "text/html", title: "Privacy" },
]

/** Serialise one link as an RFC 8288 `link-value`. */
export function linkValue(link: DiscoveryLink): string {
  const params = [`rel="${link.rel}"`]
  if (link.type) params.push(`type="${link.type}"`)
  if (link.title) params.push(`title="${link.title}"`)
  return `<${link.href}>; ${params.join("; ")}`
}

/**
 * A whole `Link` header value. RFC 8288 allows one header carrying a
 * comma-separated list, which keeps the header count down versus one line each.
 */
export function renderLinkHeader(links: readonly DiscoveryLink[] = DISCOVERY_LINKS): string {
  return links.map(linkValue).join(", ")
}

/**
 * `rel="alternate"` pointing at the Markdown representation of `pathname`.
 *
 * Per-request, so it is set by proxy.ts rather than declared in next.config.ts.
 * `/` maps to `/.md`, matching the alias the proxy accepts and the
 * `alternates.types` entry in app/layout.tsx.
 */
export function markdownAlternateLink(pathname: string): string {
  const trimmed = pathname.replace(/\/+$/, "")
  return linkValue({
    href: trimmed === "" ? "/.md" : `${trimmed}.md`,
    rel: "alternate",
    type: "text/markdown",
    title: "Markdown representation of this page",
  })
}

/**
 * The `Link` header for a page response: the site-wide discovery links plus
 * this page's Markdown twin.
 *
 * Pages need their own copy of the discovery links even though next.config.ts
 * declares them for every route. On an HTML render, React emits its own `Link`
 * header for font/style preloads, and that overwrites the one the config
 * contributed — the same collision the `Vary` comments in next.config.ts and
 * proxy.ts describe. A header set by the proxy survives as its own field line,
 * so this is what actually reaches an agent looking at a page.
 */
export function renderPageLinkHeader(pathname: string): string {
  return `${renderLinkHeader()}, ${markdownAlternateLink(pathname)}`
}
