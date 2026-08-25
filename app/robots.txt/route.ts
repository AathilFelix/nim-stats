import { renderRobotsTxt } from "@/lib/agent/robots"

// /robots.txt — a route handler rather than the `app/robots.ts` metadata
// convention, because that convention cannot emit the `Content-Signal` line.
// See lib/agent/robots.ts for the preferences and why they are what they are.

export const dynamic = "force-static"

export function GET() {
  return new Response(renderRobotsTxt(), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  })
}
