import { renderLlmsTxt } from "@/lib/markdown/agent-docs"

// /llms.txt — llmstxt.org. Served as text/plain so a human can open it in a
// browser without triggering a download; agents parse it as Markdown either way.
// Static: it describes the site, not the current fleet, so there is nothing to
// revalidate against the database.

export const dynamic = "force-static"

export function GET() {
  return new Response(renderLlmsTxt(), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  })
}
