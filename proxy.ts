import { NextResponse, type NextRequest } from "next/server"

import { renderPageLinkHeader } from "@/lib/agent/link-header"
import { appendVaryAccept, preferredType } from "@/lib/http/accept"

// Markdown content negotiation (https://acceptmarkdown.com).
//
// Every public page has two representations at one URL: the existing HTML for
// browsers, and a Markdown rendering for agents. This proxy picks between them
// from the request's Accept header, and stamps `Vary: Accept` on both branches
// so a CDN can't hand an agent the cached HTML variant (or vice versa).
//
// `proxy.ts` — not `middleware.ts`: the middleware file convention is
// deprecated as of Next 16 and renamed to proxy. Runtime is Node.js and cannot
// be overridden here.
//
// Cost note: this runs on every matched request, including ones the CDN would
// otherwise serve without waking the origin. It is deliberately allocation-light
// and does no I/O. The zero-compute alternative (next.config rewrites with a
// `has` header match) can neither emit `Vary` nor honour q-values, so it cannot
// satisfy the negotiation contract.

/**
 * Paths that own their response format and must never be negotiated.
 *
 * The metadata image routes matter here: Next serves them at extension-less
 * URLs (`/opengraph-image?<hash>`) and social crawlers request them with
 * `Accept: image/*`, which would otherwise be answered with a spec-correct but
 * useless 406.
 */
const RESERVED_PREFIXES = [
  "/api/",
  // Discovery documents own their media types (application/linkset+json,
  // application/json). Negotiating them would answer an agent that asked for
  // exactly the right type with a 406.
  "/.well-known/",
  "/_next/",
  "/_vercel/",
  "/opengraph-image",
  "/twitter-image",
  "/agent-instructions.md",
]

/** Static-ish files (llms.txt, sitemap.xml, images…) are served as-is. */
const FILE_EXTENSION = /\.[a-z0-9]+$/i

function isBypassed(pathname: string): boolean {
  if (RESERVED_PREFIXES.some((p) => pathname.startsWith(p))) return true
  // `.md` is the explicit Markdown alias and is handled below, not bypassed.
  if (pathname.endsWith(".md")) return false
  return FILE_EXTENSION.test(pathname)
}

/**
 * React Server Component payload requests (router.refresh(), prefetches) carry
 * their own Accept (`text/x-component`) and must fall straight through —
 * negotiating them would 406 the app's own auto-refresh.
 */
function isRscRequest(req: NextRequest): boolean {
  if (req.headers.get("rsc") !== null) return true
  if (req.headers.get("next-router-prefetch") !== null) return true
  const accept = req.headers.get("accept") ?? ""
  return accept.includes("text/x-component")
}

function markdownRewrite(req: NextRequest, pathname: string): NextResponse {
  const url = req.nextUrl.clone()
  url.pathname = `/api/markdown${pathname === "/" ? "" : pathname}`
  const rewritten = NextResponse.rewrite(url)
  appendVaryAccept(rewritten.headers)
  rewritten.headers.append("Link", renderPageLinkHeader(pathname))
  return rewritten
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (isBypassed(pathname)) return NextResponse.next()

  // Only GET/HEAD have representations to negotiate. Server Actions POST to the
  // page URL and must not be touched.
  if (req.method !== "GET" && req.method !== "HEAD") return NextResponse.next()

  if (isRscRequest(req)) return NextResponse.next()

  // Explicit `.md` alias: always Markdown, regardless of Accept. This is what
  // `Link: rel="alternate"` points at, and crawlers following it may send no
  // Accept header at all.
  if (pathname.endsWith(".md")) {
    const stripped = pathname.slice(0, -3)
    return markdownRewrite(req, stripped === "" ? "/" : stripped)
  }

  const acceptHeader = req.headers.get("accept")
  const chosen = preferredType(acceptHeader)

  if (chosen === "text/markdown") return markdownRewrite(req, pathname)

  if (chosen === null) {
    // RFC 9110 §15.5.7 — the client rejected everything this origin produces.
    return new NextResponse(
      "Not Acceptable\n\nAvailable representations: text/html, text/markdown\n",
      {
        status: 406,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          Vary: "Accept",
        },
      },
    )
  }

  // HTML branch. `Vary: Accept` is set here *and* declared in next.config.ts:
  // on a self-hosted Next server the render overwrites the proxy's Vary when it
  // appends its own RSC vary, so the next.config declaration — compiled into the
  // routes manifest and applied by the platform's routing layer — is what
  // actually reaches the client for prerendered pages. Setting it in both places
  // costs nothing (Vary is a union) and neither alone covers every route type.
  const res = NextResponse.next()
  appendVaryAccept(res.headers)
  // Discovery links (RFC 8288) plus this page's Markdown twin. next.config.ts
  // declares the same discovery set for every route, which is what covers the
  // paths the proxy skips; on a page render, though, React's own preload `Link`
  // header replaces the config's, so the copy that survives is the one set
  // here. RFC 8288 defines Link as a list, so more than one field line — or a
  // repeated link — is well-formed.
  res.headers.append("Link", renderPageLinkHeader(pathname))
  return res
}

export const config = {
  // Everything except API routes, Next internals, and root-level metadata files
  // that already have a fixed content type.
  matcher: [
    "/((?!api/|_next/|_vercel/|\\.well-known/|favicon\\.ico|robots\\.txt|sitemap\\.xml|llms\\.txt|agent-instructions\\.md|opengraph-image|twitter-image).*)",
  ],
}
