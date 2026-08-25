// Structured copy for the trust-anchor pages (/about, /contact, /privacy).
//
// One definition, two renderings: the React pages under app/ render these
// sections as HTML, and lib/markdown/site-markdown.ts renders the exact same
// sections as Markdown for agents. Editing the copy in one place keeps the two
// representations byte-for-byte equivalent in meaning, which is the point of
// content negotiation.

import {
  AUTHOR_NAME,
  AUTHOR_URL,
  CONTACT_ISSUES_URL,
  SITE_NAME,
  SITE_URL,
} from "@/lib/site"

export type PageSection = {
  heading: string
  /** Paragraphs of plain prose. Markdown link syntax is allowed. */
  body: string[]
}

export type StaticPage = {
  path: string
  title: string
  /** Meta description and the Markdown summary line. */
  summary: string
  sections: PageSection[]
}

export const ABOUT_PAGE: StaticPage = {
  path: "/about",
  title: `About ${SITE_NAME}`,
  summary:
    `${SITE_NAME} is an independent operational dashboard that continuously probes the free NVIDIA NIM inference endpoints and publishes their measured latency, throughput, uptime, and congestion.`,
  sections: [
    {
      heading: "What this site is",
      body: [
        `${SITE_NAME} is a public, no-login operational dashboard for the free NVIDIA NIM API endpoints. A collector sends a real chat-completion request to every tracked model on a fixed cadence, records what actually happened — time to first token, end-to-end latency, tokens per second, whether the call succeeded or timed out — and publishes the result. Nothing on this site is a vendor-published status claim; every number is a measurement taken from an ordinary API call, from outside NVIDIA's network, exactly as a developer's own client would experience it.`,
        `The question the site exists to answer is narrow and practical: of the free NIM endpoints available right now, which one will actually serve my request, and what will it cost me in latency and throughput if I switch to it? Trial-and-error against a dozen model IDs is slow and burns quota. A continuously probed fleet view answers it in seconds.`,
      ],
    },
    {
      heading: "How the measurements work",
      body: [
        `Each probe is a live chat-completion request against the endpoint, not a ping or a TCP health check. From the response stream the collector derives time to first token (TTFT), total latency, sustained throughput in tokens per second, and a congestion estimate. Successive samples are aggregated into per-model uptime, reliability, p95 and p99 latency, timeout rate, and a rolling incident history.`,
        `Endpoints are re-discovered daily, so models that NVIDIA adds appear automatically and models that disappear are retired. Retired endpoints are periodically re-verified rather than dropped permanently, so a transient error cannot keep a working model off the dashboard. Historical samples are pruned on a retention window; the site is a live operational view, not a long-term archive.`,
      ],
    },
    {
      heading: "Independence and limits",
      body: [
        `${SITE_NAME} is not affiliated with, endorsed by, or operated by NVIDIA Corporation. "NVIDIA" and "NIM" are trademarks of their respective owner and are used here only to identify the service being measured. The site sells nothing, requires no account, and takes no payment.`,
        `Measurements are taken from a single vantage point on a fixed cadence, so they describe what that client observed at that moment. Your own latency will differ with geography, network path, prompt size, and how many other people are hitting the same free endpoint. Treat the fleet view as a strong prior for which endpoint to try first, not as a service-level guarantee.`,
      ],
    },
    {
      heading: "Who runs it",
      body: [
        `The site is built and operated by [${AUTHOR_NAME}](${AUTHOR_URL}) as an independent project. It is a personal engineering project rather than a registered company, and it has no commercial relationship with any model provider. Source-level questions, corrections, and requests to track an additional endpoint are welcome — see the contact page at ${SITE_URL}/contact.`,
      ],
    },
  ],
}

export const CONTACT_PAGE: StaticPage = {
  path: "/contact",
  title: `Contact ${SITE_NAME}`,
  summary: `How to reach the operator of ${SITE_NAME} — corrections, endpoint requests, data questions, and bug reports.`,
  sections: [
    {
      heading: "How to reach us",
      body: [
        `${SITE_NAME} is operated by a single maintainer, [${AUTHOR_NAME}](${AUTHOR_URL}). There is no support desk and no ticket queue; messages go directly to the person who runs the collector. The fastest channel for anything technical is a GitHub issue — it is public, it keeps the context attached to the code, and other people hitting the same problem can find the answer.`,
        `Open an issue: ${CONTACT_ISSUES_URL}. For anything that is not a bug — a question about how a metric is derived, a request to track an additional endpoint, a correction to something the site reports — the same tracker is the right place, or reach the maintainer through the profiles linked from ${AUTHOR_URL}.`,
      ],
    },
    {
      heading: "What to include",
      body: [
        `For a data question, name the model ID exactly as the dashboard shows it and the approximate time in UTC. Probe samples are timestamped, so a model ID plus a timestamp is usually enough to reconstruct what the collector saw and explain the discrepancy. For a rendering or accessibility problem, the browser and viewport width help.`,
        `If you believe a published measurement is wrong, say what you observed instead and how you measured it. Measurements taken from a different network, region, or prompt shape legitimately differ from the collector's; those differences are interesting and worth reporting, not disputes.`,
      ],
    },
    {
      heading: "Response expectations",
      body: [
        `This is an unpaid side project. Issues are read, but there is no response-time commitment and no on-call rotation. Outages of the site itself are usually visible on the public status page before a report arrives. If the dashboard is stale, the collector — not the web front end — is generally the thing that stopped.`,
        // TODO(contact): publish a direct email address here and set CONTACT_EMAIL
        // in lib/site.ts once one exists. Until then the Organization JSON-LD
        // carries a contactPoint with a URL but no email, which is why the
        // "Organization schema completeness" audit check stays partial.
        `A direct email address is not published yet. Until one is, the channels above are the supported way to get in touch.`,
      ],
    },
  ],
}

export const PRIVACY_PAGE: StaticPage = {
  path: "/privacy",
  title: `Privacy — ${SITE_NAME}`,
  summary: `${SITE_NAME} has no accounts, no login, and no advertising or cross-site tracking. This page states exactly what is and is not collected.`,
  sections: [
    {
      heading: "The short version",
      body: [
        `${SITE_NAME} has no user accounts, no login, no sign-up, and no advertising. It does not set tracking cookies, does not embed third-party analytics or advertising scripts, and does not sell, rent, or share personal data with anyone, because it does not collect personal data in the first place. Everything on the site is public information about public API endpoints.`,
      ],
    },
    {
      heading: "What is stored",
      body: [
        `The database behind this site stores telemetry about model endpoints — model identifiers, timestamps, latency, throughput, success and timeout flags, and derived aggregates. None of it is about you. There is no field anywhere in the schema for a visitor identity, because no visitor identity is ever created.`,
        `One preference is kept in your own browser: your light or dark theme choice, stored in localStorage so the page does not flash the wrong theme on load. It never leaves your device and is not readable by the server. Clearing site data removes it.`,
      ],
    },
    {
      heading: "Hosting and server logs",
      body: [
        `The site is served through a commercial hosting and CDN provider. Like any web host, that provider processes standard request metadata — IP address, user agent, requested path, response status — to route traffic, serve cached responses, and defend against abuse. That processing is the hosting provider's, governed by their own policy and retention; ${SITE_NAME} does not query those logs to build profiles and does not join them to anything else.`,
        `Outbound requests made by the collector go to the measured inference endpoints. Those requests contain a fixed synthetic prompt and no visitor data of any kind — the collector runs on a schedule, independently of whether anyone is visiting the site.`,
      ],
    },
    {
      heading: "Automated clients",
      body: [
        `Crawling and agent access are welcome. Every public page is available as Markdown at the same URL via \`Accept: text/markdown\`, and the site publishes a robots.txt, an XML sitemap, an llms.txt describing when an agent should use it, and an OpenAPI 3.1 specification for its public read-only JSON API. Requests from automated clients are treated exactly like any other request and are subject to this same policy.`,
      ],
    },
    {
      heading: "Changes and contact",
      body: [
        `If this policy changes materially, the updated text replaces this page and the change is reflected in the sitemap's lastmod date. There is no mailing list to notify, because there are no subscribers. Questions about this policy go to the channels on the contact page at ${SITE_URL}/contact.`,
      ],
    },
  ],
}

/**
 * Server-rendered explainer on the dashboard. The homepage's own content is
 * almost entirely live numbers, which reads to a crawler as a thin page with no
 * prose; this is the part that survives with JavaScript disabled and tells a
 * first-time reader (human or agent) what the numbers actually are.
 */
export const HOME_EXPLAINER: PageSection[] = [
  {
    heading: "What you are looking at",
    body: [
      `${SITE_NAME} is an independent operational dashboard for the free NVIDIA NIM API endpoints. A collector sends a real chat-completion request to every tracked model on a fixed cadence — roughly every ten minutes — and records what actually happened: time to first token, end-to-end latency, sustained tokens per second, whether the call succeeded or timed out, and how congested the endpoint appeared. Every figure above is one of those measurements, taken from outside NVIDIA's network. None of it is a vendor-published status claim.`,
      `**Healthy** means the endpoint is serving normally. **Busy** means it is serving but with elevated latency or congestion. **Jammed** means it is failing or timing out on probe. TTFT is milliseconds until the first token arrives, which is what an interactive chat feels; throughput is sustained tokens per second, which is what a batch job feels. The two rarely rank endpoints the same way, so the fleet table reports both.`,
    ],
  },
  {
    heading: "How to use it",
    body: [
      `Pick the highest-reliability endpoint with a healthy status, or read the recommendation at the top of the page. If a call you were already making starts failing, check whether that endpoint is jammed here before you go debugging your own client. Measurements come from a single vantage point on a fixed cadence, so treat them as a strong prior for which endpoint to try first rather than a service-level guarantee — your own latency will vary with geography, network path, and prompt size.`,
      `Agents and scripts can read every page on this site as clean Markdown at the same URL by sending \`Accept: text/markdown\`, or by appending \`.md\` to the path. Start at [/llms.txt](/llms.txt) for what this site covers and when to reach for it. For a time series or per-endpoint history rather than a summary, the [${SITE_NAME} API reference](/api) documents the public read-only JSON API — no key, no rate limit — with an OpenAPI 3.1 spec at [/openapi.json](/openapi.json). ${SITE_NAME} is not affiliated with, endorsed by, or operated by NVIDIA Corporation.`,
    ],
  },
]

export const STATIC_PAGES: StaticPage[] = [ABOUT_PAGE, CONTACT_PAGE, PRIVACY_PAGE]

export function findStaticPage(path: string): StaticPage | undefined {
  return STATIC_PAGES.find((p) => p.path === path)
}

/** Plain-text length of a page's prose — used by tests to hold the 500+ char floor. */
export function pageTextLength(page: StaticPage): number {
  return page.sections
    .flatMap((s) => [s.heading, ...s.body])
    .join(" ")
    .length
}
