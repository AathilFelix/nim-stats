import { revalidatePath, revalidateTag } from "next/cache"
import { NextResponse } from "next/server"
import { blockUnlessInternal } from "@/lib/api/guard"
import { api } from "@/lib/telemetry/logger"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/** ISR pages that render fleet data. */
const FLEET_PAGES = ["/", "/discover", "/status"]

/**
 * Refresh the site after the collector writes new data.
 *
 * The collector (`scripts/probe-once.ts`) calls this at the end of every probe
 * cycle. That is the only moment the fleet data changes, so it is the only
 * moment worth regenerating anything: pages and cached queries now rebuild once
 * per cycle, and only if someone visits, instead of on a timer that ran twice
 * per cycle whether or not anything had landed. Each timer-driven rebuild cost
 * Fluid Active CPU plus an ISR cache write of the full page.
 *
 * Guarded by INTERNAL_API_TOKEN (404s when the caller isn't authorized), so it
 * can't be used to force expensive recomputation from outside.
 */
export async function POST(req: Request) {
  // Unlike the read-only internal routes, fail CLOSED when no token is
  // configured: an open revalidate endpoint lets anyone force regenerations.
  if (!process.env.INTERNAL_API_TOKEN) return new NextResponse(null, { status: 404 })
  const blocked = blockUnlessInternal(req)
  if (blocked) return blocked

  // Expire the cached queries outright rather than stale-while-revalidate
  // ("max"): the page regeneration below reads them, and a stale-served query
  // would bake the previous cycle's rows into a page that then stays cached.
  revalidateTag("fleet", { expire: 0 })
  // Pages are marked stale and regenerate lazily on their next visit.
  for (const path of FLEET_PAGES) revalidatePath(path)
  api.info("fleet cache invalidated")

  return NextResponse.json({ revalidated: true, at: new Date().toISOString() })
}
