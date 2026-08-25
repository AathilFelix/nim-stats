import { renderAgentInstructions } from "@/lib/markdown/agent-docs"

// /agent-instructions.md — the long-form "when to use this" guidance that
// llms.txt links to. llms.txt's own structure reserves H2 for link lists, so the
// task-by-task headings live here instead.

export const dynamic = "force-static"

export function GET() {
  return new Response(renderAgentInstructions(), {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  })
}
