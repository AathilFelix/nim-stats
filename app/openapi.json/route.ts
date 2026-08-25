import { buildOpenApiDocument } from "@/lib/api/openapi"

// /openapi.json — the machine-readable description of the public API.
//
// Served from the app root rather than under /api so it is discoverable at the
// conventional location, and static because the document describes the API's
// shape, which changes only on deploy.

export const dynamic = "force-static"

export function GET() {
  return new Response(JSON.stringify(buildOpenApiDocument(), null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      // Public spec: safe for any client, including cross-origin tooling like
      // Swagger UI or an agent's schema loader.
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  })
}
