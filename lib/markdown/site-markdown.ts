// Markdown representations of the site, served at the same URLs as the HTML via
// Accept negotiation (see proxy.ts and app/api/markdown).
//
// These are pure string builders: no I/O, no React, no framework imports. The
// route handler supplies already-fetched data, which keeps every document
// snapshot-testable.

import type { ApiReference } from "@/lib/api/reference"
import type { StaticPage } from "@/lib/content/pages"
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL, absoluteUrl } from "@/lib/site"

/**
 * Maps the catch-all slug of the Markdown route back to a site path.
 *
 * `/index.md` is a widespread convention for "the Markdown of the site root",
 * and crawlers reach for it unprompted, so it resolves to `/` rather than 404.
 */
export function resolveMarkdownPath(slug: string[]): string {
  const joined = slug.join("/")
  if (slug.length === 0 || joined === "index") return "/"
  return `/${joined}`
}

/** Minimal projection of a dashboard model — everything the Markdown needs. */
export type MarkdownModel = {
  id: string
  name: string
  provider: string
  status: string
  uptime: number
  ttft: number
  throughput: number
  reliability: number
  congestion: number
}

export type FleetSnapshot = {
  models: MarkdownModel[]
  /**
   * The endpoint the dashboard is recommending, from the same engine the HTML
   * uses, so the two representations never disagree. Null when nothing
   * qualifies.
   */
  recommended: { model: MarkdownModel; reasons: string[] } | null
  /** ISO-8601 timestamp of the most recent probe, or null when never probed. */
  lastProbeAt: string | null
  /** Fleet-level verdict from the operational engine, e.g. "partial_degradation". */
  fleetState: string
}

const STATUS_LABEL: Record<string, string> = {
  healthy: "Healthy",
  busy: "Busy",
  jammed: "Jammed",
  unknown: "Unknown",
}

function label(status: string): string {
  return STATUS_LABEL[status] ?? status
}

function humanise(token: string): string {
  const spaced = token.replace(/_/g, " ")
  return spaced.charAt(0).toUpperCase() + spaced.slice(1)
}

/** Escape the pipe characters that would otherwise break a Markdown table row. */
function cell(value: string): string {
  return value.replace(/\|/g, "\\|")
}

function counts(models: MarkdownModel[]) {
  const healthy = models.filter((m) => m.status === "healthy").length
  const busy = models.filter((m) => m.status === "busy").length
  const jammed = models.filter((m) => m.status === "jammed").length
  return { healthy, busy, jammed, total: models.length }
}

function mean(values: number[]): number {
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0
}

/** Shared trailer so every Markdown document tells an agent where to go next. */
function footer(): string {
  return [
    "---",
    "",
    "## Machine-readable index",
    "",
    `- [Fleet overview](${absoluteUrl("/")}) — live status of every tracked endpoint`,
    `- [Discover](${absoluteUrl("/discover")}) — rankings, provider comparison, trends`,
    `- [Public status](${absoluteUrl("/status")}) — plain status summary`,
    `- [API reference](${absoluteUrl("/api")}) — public JSON API, OpenAPI 3.1 at /openapi.json`,
    `- [About](${absoluteUrl("/about")}) — what is measured and how`,
    `- [Contact](${absoluteUrl("/contact")}) — how to reach the operator`,
    `- [Privacy](${absoluteUrl("/privacy")}) — data handling`,
    `- [llms.txt](${absoluteUrl("/llms.txt")}) — agent instructions and when to use this site`,
    `- [sitemap.xml](${absoluteUrl("/sitemap.xml")}) — all indexable URLs`,
    "",
    `Every page above is available as Markdown at the same URL with \`Accept: text/markdown\`, or by appending \`.md\` to the path.`,
    "",
    `_${SITE_NAME} is an independent project and is not affiliated with NVIDIA Corporation._`,
    "",
  ].join("\n")
}

function fleetTable(models: MarkdownModel[]): string {
  const rows = [...models]
    .sort((a, b) => b.reliability - a.reliability || a.name.localeCompare(b.name))
    .map(
      (m) =>
        `| ${cell(m.name)} | ${cell(m.provider)} | ${label(m.status)} | ${m.uptime.toFixed(2)}% | ${m.ttft} | ${m.throughput.toFixed(1)} | ${m.congestion}% |`,
    )

  return [
    "| Model | Provider | Status | Uptime | TTFT (ms) | Throughput (tok/s) | Congestion |",
    "| --- | --- | --- | --- | --- | --- | --- |",
    ...rows,
  ].join("\n")
}

function fleetSummaryLines(snapshot: FleetSnapshot): string[] {
  const { healthy, busy, jammed, total } = counts(snapshot.models)
  const measured = snapshot.models.filter((m) => m.throughput > 0)
  const withTtft = snapshot.models.filter((m) => m.ttft > 0)
  return [
    `- **Fleet state:** ${humanise(snapshot.fleetState)}`,
    `- **Endpoints tracked:** ${total}`,
    `- **Healthy:** ${healthy} · **Busy:** ${busy} · **Jammed:** ${jammed}`,
    `- **Average time to first token:** ${Math.round(mean(withTtft.map((m) => m.ttft)))} ms`,
    `- **Average throughput:** ${mean(measured.map((m) => m.throughput)).toFixed(1)} tok/s`,
    `- **Last probe:** ${snapshot.lastProbeAt ?? "never"}`,
  ]
}

/** Markdown for `/` — the fleet overview. */
export function renderHomeMarkdown(snapshot: FleetSnapshot): string {
  if (snapshot.models.length === 0) return renderEmptyFleetMarkdown()

  const best = snapshot.recommended

  return [
    `# ${SITE_NAME} — Fleet Overview`,
    "",
    `> ${SITE_DESCRIPTION}`,
    "",
    ...fleetSummaryLines(snapshot),
    "",
    "## What this is",
    "",
    `${SITE_NAME} continuously probes every free NVIDIA NIM chat-completion endpoint with a real request and publishes what it measured: time to first token, end-to-end latency, sustained throughput, success rate, and congestion. Numbers below are measurements taken from outside NVIDIA's network, not vendor-published status claims. Use them to pick an endpoint that is working right now instead of discovering it by trial and error.`,
    "",
    "## Recommended endpoint right now",
    "",
    ...(best
      ? [
          `**${best.model.name}** (${best.model.provider}) — ${best.model.reliability}% reliability, ${best.model.ttft} ms TTFT, ${best.model.throughput.toFixed(1)} tok/s, ${best.model.congestion}% congestion.`,
          "",
          ...(best.reasons.length ? [`Why: ${best.reasons.join("; ")}.`, ""] : []),
        ]
      : ["No endpoint currently meets the operational thresholds.", ""]),
    "## Model fleet",
    "",
    fleetTable(snapshot.models),
    "",
    "Status meanings: **Healthy** — serving normally. **Busy** — serving with elevated latency or congestion. **Jammed** — failing or timing out on probe.",
    "",
    footer(),
  ].join("\n")
}

/** Markdown for `/status` — the plain public status summary. */
export function renderStatusMarkdown(snapshot: FleetSnapshot): string {
  if (snapshot.models.length === 0) return renderEmptyFleetMarkdown()

  const { healthy, total } = counts(snapshot.models)
  const pct = total ? Math.round((healthy / total) * 100) : 0

  return [
    `# ${SITE_NAME} — Public Status`,
    "",
    `> Live health of free NVIDIA NIM chat-completion endpoints, probed continuously.`,
    "",
    `**${healthy} of ${total} endpoints healthy (${pct}%).**`,
    "",
    ...fleetSummaryLines(snapshot),
    "",
    "## Per-endpoint status",
    "",
    fleetTable(snapshot.models),
    "",
    footer(),
  ].join("\n")
}

/** Markdown for `/discover` — rankings and provider breakdown. */
export function renderDiscoverMarkdown(snapshot: FleetSnapshot): string {
  if (snapshot.models.length === 0) return renderEmptyFleetMarkdown()

  const byProvider = new Map<string, MarkdownModel[]>()
  for (const m of snapshot.models) {
    const list = byProvider.get(m.provider) ?? []
    list.push(m)
    byProvider.set(m.provider, list)
  }

  const providerRows = [...byProvider.entries()]
    .sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]))
    .map(([provider, list]) => {
      const healthy = list.filter((m) => m.status === "healthy").length
      return `| ${cell(provider)} | ${list.length} | ${healthy} | ${Math.round(mean(list.map((m) => m.ttft)))} | ${mean(list.map((m) => m.throughput)).toFixed(1)} |`
    })

  const fastest = [...snapshot.models]
    .filter((m) => m.ttft > 0 && m.status !== "jammed")
    .sort((a, b) => a.ttft - b.ttft)
    .slice(0, 5)
  const highestThroughput = [...snapshot.models]
    .filter((m) => m.throughput > 0 && m.status !== "jammed")
    .sort((a, b) => b.throughput - a.throughput)
    .slice(0, 5)

  return [
    `# ${SITE_NAME} — Discover`,
    "",
    `> Rankings, provider comparison, and reliability trends across the free NVIDIA NIM fleet.`,
    "",
    ...fleetSummaryLines(snapshot),
    "",
    "## Lowest time to first token",
    "",
    ...fastest.map((m, i) => `${i + 1}. **${m.name}** (${m.provider}) — ${m.ttft} ms TTFT, ${m.throughput.toFixed(1)} tok/s, ${label(m.status)}`),
    "",
    "## Highest sustained throughput",
    "",
    ...highestThroughput.map((m, i) => `${i + 1}. **${m.name}** (${m.provider}) — ${m.throughput.toFixed(1)} tok/s, ${m.ttft} ms TTFT, ${label(m.status)}`),
    "",
    "## By provider",
    "",
    "| Provider | Endpoints | Healthy | Avg TTFT (ms) | Avg throughput (tok/s) |",
    "| --- | --- | --- | --- | --- |",
    ...providerRows,
    "",
    "## Full fleet",
    "",
    fleetTable(snapshot.models),
    "",
    footer(),
  ].join("\n")
}

function renderEmptyFleetMarkdown(): string {
  return [
    `# ${SITE_NAME}`,
    "",
    `> ${SITE_DESCRIPTION}`,
    "",
    "No endpoints have been measured yet — the collector has not completed its first probe cycle. Retry shortly.",
    "",
    footer(),
  ].join("\n")
}

/** Markdown for a static trust page, rendered from the same source as the HTML. */
export function renderStaticPageMarkdown(page: StaticPage): string {
  const parts: string[] = [`# ${page.title}`, "", `> ${page.summary}`, ""]
  for (const section of page.sections) {
    parts.push(`## ${section.heading}`, "")
    for (const paragraph of section.body) parts.push(paragraph, "")
  }
  parts.push(footer())
  return parts.join("\n")
}

/**
 * Markdown body for a 404. Agents that follow a dead link get a usable recovery
 * map instead of an app shell — which is the difference between "this path is
 * gone, here is the index" and "every path on this site returns something".
 */
export function renderNotFoundMarkdown(pathname: string): string {
  return [
    "# 404 — Page not found",
    "",
    `> \`${cell(pathname)}\` does not exist on ${SITE_URL}. Nothing was moved; this path was never valid.`,
    "",
    "## Where to look instead",
    "",
    `- [${SITE_NAME} fleet overview](${absoluteUrl("/")}) — live status of every tracked NVIDIA NIM endpoint`,
    `- [Discover](${absoluteUrl("/discover")}) — rankings by latency, throughput, and reliability`,
    `- [Public status](${absoluteUrl("/status")}) — one-screen status summary`,
    `- [About](${absoluteUrl("/about")}) — what is measured, how, and how often`,
    `- [Contact](${absoluteUrl("/contact")}) — reach the operator`,
    `- [Privacy](${absoluteUrl("/privacy")}) — data handling`,
    "",
    "## Machine-readable entry points",
    "",
    `- [llms.txt](${absoluteUrl("/llms.txt")}) — start here: what this site is for and when to use it`,
    `- [sitemap.xml](${absoluteUrl("/sitemap.xml")}) — the complete list of valid URLs`,
    `- [robots.txt](${absoluteUrl("/robots.txt")}) — crawl policy`,
    "",
    "There are no per-model URLs: model detail is rendered client-side from the fleet overview, so the fleet pages above are the canonical source for any single endpoint.",
    "",
  ].join("\n")
}

/**
 * Markdown rendering of the API reference, from the same OpenAPI document the
 * HTML page walks. This is the representation an agent gets when it asks for
 * `/api` as Markdown.
 */
export function renderApiReferenceMarkdown(reference: ApiReference): string {
  const parts: string[] = [
    `# ${reference.title}`,
    "",
    `> ${reference.summary}`,
    "",
    `**Version** ${reference.version} · **Base URL** \`${reference.serverUrl}\` · **Spec** ${absoluteUrl("/openapi.json")} (OpenAPI 3.1)`,
    "",
    reference.description,
    "",
    "## Endpoints",
    "",
  ]

  for (const op of reference.operations) {
    parts.push(`### ${op.method} ${op.path}`, "")
    parts.push(`\`operationId: ${op.operationId}\` — ${op.summary}`, "")
    parts.push(op.description, "")

    if (op.parameters.length > 0) {
      parts.push("| Parameter | Type | Required | Default | Description |", "| --- | --- | --- | --- | --- |")
      for (const p of op.parameters) {
        const type = p.enum ? p.enum.map((v) => `\`${v}\``).join(" \\| ") : `\`${p.type}\``
        parts.push(
          `| \`${p.name}\` | ${type} | ${p.required ? "yes" : "no"} | ${p.default ?? "—"} | ${cell(p.description)} |`,
        )
      }
      parts.push("")
    }

    parts.push("| Status | Meaning | Schema |", "| --- | --- | --- |")
    for (const r of op.responses) {
      parts.push(`| ${r.status} | ${cell(r.description)} | ${r.schema ? `\`${r.schema}\`` : "—"} |`)
    }
    parts.push("")

    const example = op.parameters.length > 0
      ? `?${op.parameters[0].name}=${op.parameters[0].default ?? op.parameters[0].enum?.[0] ?? ""}`
      : ""
    parts.push("```bash", `curl -s ${reference.serverUrl}${op.path}${example}`, "```", "")
  }

  parts.push("## Schemas", "")
  for (const schema of reference.schemas) {
    parts.push(`### ${schema.name}`, "", schema.description, "")
    parts.push("| Field | Type | Required | Description |", "| --- | --- | --- | --- |")
    for (const f of schema.fields) {
      parts.push(`| \`${f.name}\` | \`${f.type}\` | ${f.required ? "yes" : "no"} | ${cell(f.description)} |`)
    }
    parts.push("")
  }

  parts.push(
    "## Source",
    "",
    `Implementation, self-hosting instructions, and architecture notes: ${reference.externalDocsUrl}`,
    "",
    footer(),
  )

  return parts.join("\n")
}
