// RFC 9110 §12.5.1 Accept-header negotiation.
//
// The site serves two representations of every page: HTML for browsers and
// Markdown for agents (see middleware.ts and app/api/markdown). Everything here
// is pure so it can run in the middleware runtime and be unit-tested directly.
//
// Implementation follows the reference recipe published at
// https://acceptmarkdown.com/recipes/nextjs/ — proper q-value ranking, the
// "more specific range wins regardless of q" rule, and `Vary: Accept` on every
// negotiated response.

/** Representations this origin can produce, in server-preference order. */
export const PRODUCES = ["text/html", "text/markdown"] as const

export type Produced = (typeof PRODUCES)[number]

export type AcceptEntry = {
  /** Lower-cased media range, e.g. `text/markdown`, `text/*`, `*​/*`. */
  type: string
  /** Quality value, clamped to [0, 1]. Defaults to 1 when absent or unparsable. */
  q: number
  /** 2 = exact type, 1 = `type/*`, 0 = `*​/*`. Higher wins ties before q. */
  specificity: number
}

/** Split an Accept header into ranked entries, preserving client order. */
export function parseAccept(header: string): AcceptEntry[] {
  return header
    .split(",")
    .map((raw) => raw.trim())
    .filter((raw) => raw.length > 0)
    .map((raw) => {
      const parts = raw.split(";").map((s) => s.trim())
      const type = parts[0].toLowerCase()
      let q = 1
      for (const param of parts.slice(1)) {
        const [name, value] = param.split("=").map((s) => s.trim())
        if (name?.toLowerCase() === "q") {
          const parsed = Number(value)
          if (!Number.isNaN(parsed)) q = Math.max(0, Math.min(1, parsed))
        }
      }
      const specificity = type === "*/*" ? 0 : type.endsWith("/*") ? 1 : 2
      return { type, q, specificity }
    })
}

/** Does this media range cover `candidate`? */
export function matches(entry: AcceptEntry, candidate: string): boolean {
  if (entry.type === "*/*") return true
  if (entry.type.endsWith("/*")) return candidate.startsWith(entry.type.slice(0, -1))
  return entry.type === candidate
}

/**
 * Pick the representation to serve.
 *
 * Returns a member of `PRODUCES`, or `null` when the client explicitly rejects
 * everything this origin produces — the caller answers that with a 406. A
 * missing header means "no preference", which gets the server default (HTML).
 */
export function preferredType(header: string | null | undefined): Produced | null {
  if (!header) return PRODUCES[0]
  const entries = parseAccept(header)
  if (entries.length === 0) return PRODUCES[0]

  let bestType: Produced | null = null
  let bestQ = -1
  let bestPosition = Infinity

  for (const candidate of PRODUCES) {
    // Find the *most specific* range matching this candidate. RFC 9110 §12.5.1:
    // a specific range overrides a less specific one regardless of q, so
    // `text/html;q=0, */*` correctly rejects HTML instead of letting the
    // wildcard resurrect it.
    let matched: AcceptEntry | null = null
    let matchedPosition = Infinity
    for (let idx = 0; idx < entries.length; idx++) {
      const e = entries[idx]
      if (!matches(e, candidate)) continue
      if (
        matched === null ||
        e.specificity > matched.specificity ||
        (e.specificity === matched.specificity && idx < matchedPosition)
      ) {
        matched = e
        matchedPosition = idx
      }
    }
    if (matched === null) continue
    if (matched.q <= 0) continue // explicit rejection

    // Across candidates: highest q wins, ties broken by client order so
    // `Accept: text/markdown, text/html` picks Markdown.
    if (matched.q > bestQ || (matched.q === bestQ && matchedPosition < bestPosition)) {
      bestQ = matched.q
      bestPosition = matchedPosition
      bestType = candidate
    }
  }

  return bestType
}

/**
 * Union `Accept` into an existing Vary header without clobbering what's there.
 * Next already varies on its RSC headers; dropping those would poison the
 * router cache.
 */
export function appendVaryAccept(headers: Headers): void {
  const existing = headers.get("Vary")
  if (!existing) {
    headers.set("Vary", "Accept")
    return
  }
  const tokens = existing.split(",").map((s) => s.trim().toLowerCase())
  if (tokens.includes("*") || tokens.includes("accept")) return
  headers.set("Vary", `${existing}, Accept`)
}
