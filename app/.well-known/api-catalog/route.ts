import { buildApiCatalog } from "@/lib/agent/discovery"

// /.well-known/api-catalog — RFC 9727. The registered entry point an agent
// probes to find an origin's APIs without guessing paths or scraping HTML.
//
// Static: the catalog describes the API's shape, which only changes on deploy.

export const dynamic = "force-static"

export function GET() {
  return new Response(JSON.stringify(buildApiCatalog(), null, 2), {
    headers: {
      // RFC 9264 §4.2. Agents content-negotiate for this exact type, which is
      // also why proxy.ts must never negotiate /.well-known/ — an
      // `Accept: application/linkset+json` request would otherwise be answered
      // with a spec-correct but useless 406.
      "Content-Type": "application/linkset+json",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  })
}
