// /robots.txt, including Content Signals (contentsignals.org,
// draft-romm-aipref-contentsignals).
//
// Hand-rendered rather than using Next's `MetadataRoute.Robots` convention:
// that type can only express the classic directives, and `Content-Signal` is an
// extension line the generator has no way to emit.
//
// The declared preferences follow from what this site is for. It exists to be
// read by agents in the moment — llms.txt, the Markdown representations and the
// public API all exist for that — so search indexing and grounding an answer in
// a live fetch are both welcome. Using the corpus as model training data is a
// different act, gives readers no way back to the measurement, and is declined.

import { absoluteUrl } from "@/lib/site"

/**
 * Content Signals, in the order the spec lists them.
 *
 * - `search=yes` — index it and link back.
 * - `ai-input=yes` — fetch it to ground a live answer (RAG, agent browsing).
 * - `ai-train=no`  — do not use it as training corpus for a model.
 */
export const CONTENT_SIGNALS = "search=yes, ai-input=yes, ai-train=no"

/** Paths that are token-gated or meaningless to a crawler. */
export const DISALLOWED = ["/api/", "/_next/"] as const

export function renderRobotsTxt(): string {
  return [
    "# Content Signals (https://contentsignals.org). Each signal is yes or no:",
    "#   search    — build a search index and link back to this site.",
    "#   ai-input  — fetch a page to ground an AI answer, with attribution.",
    "#   ai-train  — use this content to train or fine-tune a model.",
    "# A `yes` is a permission, not a licence to redistribute the content.",
    "",
    "User-agent: *",
    `Content-Signal: ${CONTENT_SIGNALS}`,
    "Allow: /",
    ...DISALLOWED.map((path) => `Disallow: ${path}`),
    "",
    `Sitemap: ${absoluteUrl("/sitemap.xml")}`,
    "",
  ].join("\n")
}
