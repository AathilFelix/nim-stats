// Single source of truth for site identity.
//
// The same facts are consumed by four machine-readable surfaces — JSON-LD
// (app/layout.tsx), /sitemap.xml, /robots.txt, /llms.txt, and the Markdown
// representations under app/api/markdown — plus the human trust pages. Keeping
// them in one module is what stops those surfaces from drifting apart, which is
// exactly the inconsistency agents penalise.

export const SITE_URL = "https://nimstats.aathil.com"

export const SITE_NAME = "NIM Stats"

export const SITE_TAGLINE = "Free NVIDIA NIM Endpoint Status"

export const SITE_TITLE = `${SITE_NAME} — ${SITE_TAGLINE}`

export const SITE_DESCRIPTION =
  "Real-time status and reliability metrics for free NVIDIA NIM API endpoints. Track throughput, latency, uptime, and congestion across Llama, Mistral, Gemma, Phi, Qwen, DeepSeek, and more models."

/** Author / operator. Not a registered company — see /about. */
export const AUTHOR_NAME = "Aathil Felix"
export const AUTHOR_URL = "https://aathil.com"

/**
 * Public profiles that establish the same identity elsewhere. Used as
 * `sameAs` in JSON-LD so an agent can cross-check the operator.
 */
export const SAME_AS = [
  "https://github.com/AathilFelix",
  "https://x.com/AathilOfficial",
  "https://www.linkedin.com/in/aathilfelix",
  AUTHOR_URL,
] as const

// TODO(contact): no direct email or postal address is published yet. Until one
// exists, /contact routes people through the GitHub/X/LinkedIn channels above
// and the Organization JSON-LD carries a contactPoint without `email`, and no
// PostalAddress. Add both here when a support address is available — the
// contact page, the Markdown surface, and the JSON-LD all read from this file.
export const CONTACT_EMAIL: string | null = null
export const CONTACT_ISSUES_URL = "https://github.com/AathilFelix/nim-stats/issues"

/** Routes that are indexable, listed in the sitemap, and served as Markdown. */
export const PUBLIC_ROUTES = [
  { path: "/", title: "Fleet Overview", changeFrequency: "hourly", priority: 1.0 },
  { path: "/discover", title: "Discover", changeFrequency: "hourly", priority: 0.9 },
  { path: "/status", title: "Public Status", changeFrequency: "hourly", priority: 0.9 },
  { path: "/about", title: "About", changeFrequency: "monthly", priority: 0.6 },
  { path: "/contact", title: "Contact", changeFrequency: "monthly", priority: 0.5 },
  { path: "/privacy", title: "Privacy", changeFrequency: "yearly", priority: 0.4 },
] as const

export type PublicRoute = (typeof PUBLIC_ROUTES)[number]

export function absoluteUrl(path: string): string {
  return path === "/" ? SITE_URL : `${SITE_URL}${path}`
}
