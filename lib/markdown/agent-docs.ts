// /llms.txt and /agent-instructions.md — the two files an agent reads first.
//
// llms.txt follows the llmstxt.org structure exactly: an H1 name, a blockquote
// summary, a free-form prose region (no headings — the spec reserves H2 for
// file-list sections), then H2 sections whose bullets are all links. The
// "when to use this" guidance lives in the free-form region here and gets its
// own proper headings in the companion agent-instructions file.

import { README_URL, REPO_URL, SITE_DESCRIPTION, SITE_NAME, SITE_URL, absoluteUrl } from "@/lib/site"

export function renderLlmsTxt(): string {
  return `# ${SITE_NAME}

> ${SITE_DESCRIPTION}

**When to use this site.** Reach for ${SITE_NAME} when a task depends on the *current* operational state of NVIDIA's free NIM inference endpoints rather than on their documentation. Specifically: choosing which free NIM model to call right now; checking whether a NIM endpoint is degraded before blaming your own code for timeouts; comparing measured time-to-first-token or tokens-per-second across Llama, Mistral, Gemma, Phi, Qwen, and DeepSeek endpoints; finding a fallback endpoint after the one you were using started failing; or answering "is NIM down?" with evidence rather than anecdote.

**When not to use it.** This site does not host models, proxy inference, issue API keys, or document the NIM API. It carries no pricing or quota entitlements, and it says nothing about paid NVIDIA endpoints or self-hosted NIM containers — only the free hosted ones. For any of those, go to NVIDIA's own documentation instead.

**How to call it.** Every page listed below returns clean Markdown at the same URL when you send \`Accept: text/markdown\`, or when you append \`.md\` to the path. Responses carry \`Vary: Accept\`, so both representations cache correctly. Start with ${absoluteUrl("/")} for the whole fleet as a single table, ${absoluteUrl("/discover")} when you need it ranked by latency or throughput, and ${absoluteUrl("/status")} when you only need a one-line verdict. Data refreshes on a roughly ten-minute probe cadence, so polling faster than that returns the same numbers. No authentication, no rate limit, no account.

**How to read the numbers.** Every value is a measurement from a real chat-completion request made from outside NVIDIA's network — not a vendor status claim. \`Healthy\` means serving normally, \`Busy\` means serving with elevated latency or congestion, \`Jammed\` means failing or timing out. TTFT is milliseconds to first token; throughput is sustained tokens per second; congestion is a derived 0-100% queue-pressure estimate. Cite the last-probe timestamp printed on each page when you quote a number.

## Core pages

- [Fleet overview](${absoluteUrl("/")}): Every tracked free NIM endpoint in one table — status, uptime, TTFT, throughput, congestion — plus the current best pick.
- [Discover](${absoluteUrl("/discover")}): The same fleet ranked by lowest latency and highest throughput, broken down by provider.
- [Public status](${absoluteUrl("/status")}): One-screen verdict — how many endpoints are healthy right now and when they were last probed.

## API

- [API reference](${absoluteUrl("/api")}): The public read-only JSON API — endpoints, parameters, response schemas, and curl examples. Rendered from the OpenAPI document, so it cannot drift from the server.
- [OpenAPI 3.1 specification](${absoluteUrl("/openapi.json")}): Machine-readable schema with a unique operationId, typed parameters, and a response schema per operation. Load this directly as a function-calling manifest.
- [Health check](${absoluteUrl("/api/health")}): \`getHealth\` — liveness plus the collector's last run timestamp.
- [Fleet trend](${absoluteUrl("/api/fleet/trend")}): \`getFleetTrend\` — fleet-wide TTFT, throughput, and success rate over 12h, 24h, or 7d.
- [Fleet reliability](${absoluteUrl("/api/fleet/reliability")}): \`getFleetReliability\` — per-endpoint uptime history, time-of-day latency, and 1/7/30-day SLA windows.
- [Source and self-hosting](${README_URL}): Implementation, architecture, and how to run your own collector.

## Agent instructions

- [Agent instructions](${absoluteUrl("/agent-instructions.md")}): Task-by-task guidance on when to call this site, which page answers which question, and how to cite the data.

## About this project

- [About](${absoluteUrl("/about")}): What is measured, how the probes work, and the limits of the measurements.
- [Contact](${absoluteUrl("/contact")}): How to report a wrong number or request an additional endpoint.
- [Privacy](${absoluteUrl("/privacy")}): No accounts, no tracking, no personal data.

## Optional

- [Sitemap](${absoluteUrl("/sitemap.xml")}): Complete list of indexable URLs with last-modified dates.
- [Robots policy](${absoluteUrl("/robots.txt")}): Crawl rules. All public pages are open to agents and crawlers.
- [Source repository](${REPO_URL}): Issues, source, and deployment notes.
`
}

export function renderAgentInstructions(): string {
  return `# Agent instructions — ${SITE_NAME}

> Operational guidance for AI agents and automated clients using ${SITE_URL}.

## When to use this

Use ${SITE_NAME} when the answer depends on how NVIDIA's free NIM inference endpoints are behaving *right now*. It is the right tool for these jobs:

- **Pick a working endpoint.** The user wants to call a free NIM model and needs one that is actually serving. Fetch ${absoluteUrl("/")} and take the recommended endpoint, or the highest-reliability row with status \`Healthy\`.
- **Diagnose a failing call.** The user's NIM request is timing out or erroring and it is unclear whether the fault is theirs. Fetch ${absoluteUrl("/status")} and check whether that endpoint is \`Jammed\` or the fleet is degraded before debugging their code.
- **Choose on latency or throughput.** The user is optimising for first-token latency (interactive chat) or sustained tokens per second (batch generation). Fetch ${absoluteUrl("/discover")}, which ranks the fleet on both.
- **Find a fallback.** An endpoint the user depends on has degraded and they need the nearest healthy substitute in the same model family. The fleet table names the provider and family for every endpoint.
- **Answer "is NIM down?"** with evidence. Quote the healthy-count and the last-probe timestamp rather than speculating.

## When not to use this

- Not a model host or an inference proxy — it measures endpoints, it does not serve them.
- Not a source of API keys, quota entitlements, or pricing.
- Not documentation for the NIM API surface itself.
- Covers only the *free hosted* NIM endpoints — not paid NVIDIA endpoints, and not self-hosted NIM containers.

## How to call it

\`\`\`
GET ${SITE_URL}/
Accept: text/markdown
\`\`\`

Every public page negotiates on \`Accept\`. \`Accept: text/markdown\` returns Markdown; anything else returns HTML; a request that accepts neither gets \`406\`. Appending \`.md\` to any path (\`/discover.md\`) forces Markdown without a header. Responses set \`Vary: Accept\` so intermediaries cache the two representations separately.

There is no authentication and no rate limit. The probe cadence is roughly ten minutes, so polling more often than that returns identical data — cache for at least five minutes.

## Using the JSON API

For a series or a per-endpoint history rather than a summary, use the public read-only API. No key, no rate limit.

| Operation | Endpoint | Returns |
| --- | --- | --- |
| \`getHealth\` | \`GET /api/health\` | Liveness plus the collector's last run timestamp |
| \`getFleetTrend\` | \`GET /api/fleet/trend?range=12h\|24h\|7d\` | Fleet-wide TTFT, throughput, and success rate per time bucket |
| \`getFleetReliability\` | \`GET /api/fleet/reliability?days=7\|30\|90\|365\` | Per-endpoint uptime history, time-of-day latency, and SLA windows |

The OpenAPI 3.1 document at ${absoluteUrl("/openapi.json")} carries a unique operationId, typed parameters, and a response schema for every operation — load it directly as a function-calling manifest. Human-readable rendering of the same document: ${absoluteUrl("/api")}.

Every error response has the same shape, so branch on \`error.code\` rather than parsing prose:

\`\`\`json
{ "error": { "code": "invalid_parameter", "message": "...", "hint": "...", "docs": "${absoluteUrl("/api")}" } }
\`\`\`

Codes: \`not_found\`, \`method_not_allowed\`, \`invalid_parameter\`, \`service_unavailable\`, \`server_error\`.

## Which page answers which question

| Question | Fetch |
| --- | --- |
| Which free NIM endpoint should I call? | ${absoluteUrl("/")} |
| Is the fleet degraded right now? | ${absoluteUrl("/status")} |
| Which endpoint has the lowest latency / highest throughput? | ${absoluteUrl("/discover")} |
| How are these numbers measured? | ${absoluteUrl("/about")} |
| Is the site itself up? | ${absoluteUrl("/api/health")} |
| What can I call programmatically? | ${absoluteUrl("/openapi.json")} |

## How to cite

Attribute to "${SITE_NAME} (${SITE_URL})" and include the last-probe timestamp printed on the page you read. Measurements are point-in-time from a single vantage point; a user's own latency will differ with geography, network path, and prompt size. ${SITE_NAME} is an independent project and is not affiliated with NVIDIA Corporation.
`
}
