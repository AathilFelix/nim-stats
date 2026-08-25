import { buildOpenApiDocument } from "@/lib/api/openapi"
import { buildApiReference } from "@/lib/api/reference"
import { findStaticPage } from "@/lib/content/pages"
import { getFleetSnapshot } from "@/lib/markdown/fleet-snapshot"
import {
  renderApiReferenceMarkdown,
  renderDiscoverMarkdown,
  renderHomeMarkdown,
  renderNotFoundMarkdown,
  renderStatusMarkdown,
  renderStaticPageMarkdown,
  resolveMarkdownPath,
} from "@/lib/markdown/site-markdown"

// The Markdown representation of every public page. Never linked from the HTML
// and never navigated to directly — proxy.ts rewrites here when the request
// negotiates `Accept: text/markdown`, or when the path ends in `.md`.
//
// The response URL the client sees is the original one, so `Vary: Accept` here
// is what tells any cache in between that this body is Accept-dependent.

export const runtime = "nodejs"
export const maxDuration = 10

const MARKDOWN_HEADERS = {
  "Content-Type": "text/markdown; charset=utf-8",
  Vary: "Accept",
  // Matches the 300s ISR window on the HTML representation, so the two variants
  // go stale together rather than disagreeing at the edge.
  "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
} as const

function markdown(body: string, status = 200): Response {
  return new Response(body, { status, headers: MARKDOWN_HEADERS })
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug?: string[] }> },
) {
  const { slug = [] } = await params
  const pathname = resolveMarkdownPath(slug)

  if (pathname === "/api") {
    return markdown(renderApiReferenceMarkdown(buildApiReference(buildOpenApiDocument())))
  }

  const staticPage = findStaticPage(pathname)
  if (staticPage) return markdown(renderStaticPageMarkdown(staticPage))

  if (pathname === "/" || pathname === "/discover" || pathname === "/status") {
    const snapshot = await getFleetSnapshot()
    const body =
      pathname === "/discover"
        ? renderDiscoverMarkdown(snapshot)
        : pathname === "/status"
          ? renderStatusMarkdown(snapshot)
          : renderHomeMarkdown(snapshot)
    return markdown(body)
  }

  // A real 404 with a usable body: the recovery map, in Markdown, so an agent
  // that followed a dead link can find the sitemap and llms.txt from here.
  return markdown(renderNotFoundMarkdown(pathname), 404)
}
