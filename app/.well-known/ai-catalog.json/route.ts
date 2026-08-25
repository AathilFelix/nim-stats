import { buildAiCatalog } from "@/lib/agent/discovery"

// /.well-known/ai-catalog.json — ARD (Agentic Resource Discovery) capability
// manifest. Same facts as the API catalog and llms.txt, in the shape ARD
// registries index: one entry per capability, each with representative queries
// they can embed semantically.

export const dynamic = "force-static"

export function GET() {
  return new Response(JSON.stringify(buildAiCatalog(), null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      // Required by the ARD spec — registries fetch this cross-origin.
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  })
}
