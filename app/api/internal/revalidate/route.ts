import { revalidateTag } from "next/cache"
import { NextResponse } from "next/server"
import { blockUnlessInternal } from "@/lib/api/guard"
import { api } from "@/lib/telemetry/logger"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

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

  // One tag covers both layers: every fleet query is an `unstable_cache` tagged
  // "fleet", and unstable_cache adds its tags to the rendering page, so the ISR
  // pages (/, /discover, /status) carry it too.
  //
  // "max" = stale-while-revalidate: the next visitor gets the cached page
  // instantly and ONE background regeneration runs. That rebuild still renders
  // fresh rows — during a page regeneration unstable_cache recomputes a stale
  // entry and awaits it rather than serving it. Do NOT hard-expire here
  // (`{ expire: 0 }`, or `revalidatePath`, which carries no profile and so
  // expires immediately): that forces a blocking regeneration, and a crawler
  // burst landing on a deleted page rebuilt it 3–5 times per cycle in
  // production instead of once.
  revalidateTag("fleet", "max")
  api.info("fleet cache invalidated")

  return NextResponse.json({ revalidated: true, at: new Date().toISOString() })
}
