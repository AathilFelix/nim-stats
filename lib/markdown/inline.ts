// Minimal inline-Markdown tokenizer.
//
// The trust-page copy in lib/content/pages.ts is authored once and rendered
// twice — as Markdown for agents, and as HTML for browsers. This turns the
// handful of inline constructs that copy uses into tokens the React renderer
// can walk. It is deliberately not a Markdown parser: no nesting, no HTML
// passthrough, nothing that could inject markup.

export type InlineToken =
  | { kind: "text"; value: string }
  | { kind: "link"; value: string; href: string }
  | { kind: "strong"; value: string }
  | { kind: "code"; value: string }

// Order matters: links first so a URL containing an underscore or backtick
// can't be shredded by the later alternatives.
const PATTERN = /\[([^\]]+)\]\(([^)\s]+)\)|\*\*([^*]+)\*\*|`([^`]+)`/g

export function tokenizeInline(input: string): InlineToken[] {
  const tokens: InlineToken[] = []
  let cursor = 0

  for (const match of input.matchAll(PATTERN)) {
    const index = match.index ?? 0
    if (index > cursor) tokens.push({ kind: "text", value: input.slice(cursor, index) })

    if (match[1] !== undefined) tokens.push({ kind: "link", value: match[1], href: match[2] })
    else if (match[3] !== undefined) tokens.push({ kind: "strong", value: match[3] })
    else if (match[4] !== undefined) tokens.push({ kind: "code", value: match[4] })

    cursor = index + match[0].length
  }

  if (cursor < input.length) tokens.push({ kind: "text", value: input.slice(cursor) })
  return tokens
}

/** The same string with all inline markup stripped — used for length checks. */
export function stripInline(input: string): string {
  return tokenizeInline(input)
    .map((t) => t.value)
    .join("")
}
