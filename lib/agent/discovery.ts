// Machine-readable discovery documents: the API catalog (RFC 9727, serialised
// as an RFC 9264 linkset) and the ARD capability manifest
// (agenticresourcediscovery.org). The third surface, the `Link` response header
// (RFC 8288), lives in lib/agent/link-header.ts — next.config.ts needs it and
// cannot import anything that resolves a path alias.
//
// Both answer the same question — "what can this origin do, and where is it
// described?" — for two different discovery mechanisms, so they are built here
// side by side rather than drifting apart in two route handlers.
//
// Identity facts come from lib/site.ts; the API's shape comes from the OpenAPI
// document, so nothing below can describe an endpoint the spec does not declare.

import { OPENAPI_API_VERSION } from "@/lib/api/openapi"
import {
  AUTHOR_NAME,
  AUTHOR_URL,
  REPO_URL,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
  absoluteUrl,
} from "@/lib/site"

/** Host part of SITE_URL, used for the `urn:air:` namespace. */
export const SITE_HOST = new URL(SITE_URL).host

/**
 * `/.well-known/api-catalog` — RFC 9727, serialised as an RFC 9264 linkset.
 *
 * One anchor: the API's documentation page. An agent that starts here can reach
 * the spec, the docs, and the liveness endpoint without parsing any HTML.
 */
export function buildApiCatalog(): Record<string, unknown> {
  return {
    linkset: [
      {
        anchor: absoluteUrl("/api"),
        "service-desc": [
          {
            href: absoluteUrl("/openapi.json"),
            type: "application/json",
            title: `${SITE_NAME} API ${OPENAPI_API_VERSION} (OpenAPI 3.1)`,
          },
        ],
        "service-doc": [
          { href: absoluteUrl("/api"), type: "text/html", title: `${SITE_NAME} API reference` },
          {
            href: absoluteUrl("/api.md"),
            type: "text/markdown",
            title: `${SITE_NAME} API reference (Markdown)`,
          },
        ],
        "service-meta": [
          {
            href: absoluteUrl("/llms.txt"),
            type: "text/plain",
            title: "Site summary for language models",
          },
        ],
        status: [
          { href: absoluteUrl("/api/health"), type: "application/json", title: "Health check" },
        ],
        author: [{ href: AUTHOR_URL, title: AUTHOR_NAME }],
        "describedby": [{ href: REPO_URL, type: "text/html", title: "Source repository" }],
      },
    ],
  }
}

/**
 * `/.well-known/ai-catalog.json` — ARD capability manifest.
 *
 * `representativeQueries` exist so a registry can embed each entry semantically;
 * they are phrased as the questions this site actually answers, which is the
 * same framing used in llms.txt and agent-instructions.md.
 */
export function buildAiCatalog(): Record<string, unknown> {
  const urn = (namespace: string, name: string) => `urn:air:${SITE_HOST}:${namespace}:${name}`
  return {
    specVersion: "0.1.0",
    host: {
      name: SITE_NAME,
      description: SITE_DESCRIPTION,
      url: SITE_URL,
    },
    entries: [
      {
        id: urn("api", "openapi"),
        displayName: `${SITE_NAME} API`,
        description:
          "Read-only JSON API returning measured throughput, latency, uptime and congestion for the free NVIDIA NIM endpoints. No authentication.",
        type: "application/json",
        url: absoluteUrl("/openapi.json"),
        representativeQueries: [
          "Which free NVIDIA NIM endpoint is fastest right now?",
          "What is the uptime of a NIM model over the last 30 days?",
          "Get a time series of NIM inference latency",
          "Is the NVIDIA NIM free tier down?",
        ],
      },
      {
        id: urn("docs", "llms-txt"),
        displayName: `${SITE_NAME} site summary`,
        description:
          "llmstxt.org summary of the site: what it measures, when to use it, and where every machine-readable surface lives.",
        type: "text/plain",
        url: absoluteUrl("/llms.txt"),
        representativeQueries: [
          "What does NIM Stats measure?",
          "How should an agent use NIM Stats?",
        ],
      },
      {
        id: urn("docs", "agent-instructions"),
        displayName: "Agent instructions",
        description:
          "Task-oriented instructions for agents: which URL answers which question, how to cite the data, and what this site does not cover.",
        type: "text/markdown",
        url: absoluteUrl("/agent-instructions.md"),
        representativeQueries: [
          "How do I cite NIM Stats?",
          "Which NIM Stats URL answers which question?",
        ],
      },
      {
        id: urn("content", "fleet-overview"),
        displayName: "Fleet overview (Markdown)",
        description:
          "Current state of every tracked free NIM endpoint as Markdown — the same page browsers get as HTML, negotiated via `Accept: text/markdown`.",
        type: "text/markdown",
        url: absoluteUrl("/.md"),
        representativeQueries: [
          "Which free NIM model should I call right now?",
          "Show the current status of all NVIDIA NIM endpoints",
          "Are any NIM endpoints congested?",
        ],
      },
      {
        id: urn("status", "health"),
        displayName: "Health check",
        description:
          "Liveness of the site and its measurement collector, including the timestamp of the most recent probe.",
        type: "application/json",
        url: absoluteUrl("/api/health"),
        representativeQueries: [
          "Is NIM Stats up?",
          "When did NIM Stats last collect a measurement?",
        ],
      },
    ],
  }
}
