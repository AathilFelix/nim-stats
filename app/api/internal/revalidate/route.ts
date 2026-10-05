import { revalidateTag } from "next/cache"
import { NextResponse } from "next/server"
import { blockUnlessInternal } from "@/lib/api/guard"
import { api } from "@/lib/telemetry/logger"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * Refresh the site after the collector writes new data.
 *
 * The collector (`scripts/probe-once.ts`) calls this right after a probe cycle
 * — the only moment the fleet data changes — on every SITE_REFRESH_CYCLES-th
 * cycle, or at once when the fleet's composition changed. Pages and cached
 * queries then rebuild once, and only if someone visits, instead of on a timer
 * that ran whether or not anything had landed. Every rebuild costs Fluid Active
 * CPU plus ISR writes of the full page.
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

  // The ISR pages (/, /discover, /status) carry the "fleet" tag through a tiny
  // tagged marker in lib/dashboard-data.ts (unstable_cache adds its tags to the
  // rendering page), and read the database directly when they regenerate. The
  // API routes' cached queries carry the same tag.
  //
  // "max" = stale-while-revalidate: the next visitor gets the cached page
  // instantly and ONE background regeneration runs, with fresh rows. Do NOT
  // hard-expire here (`{ expire: 0 }`, or `revalidatePath`, which carries no
  // profile and so expires immediately): that forces a blocking regeneration,
  // and a crawler burst landing on a deleted page rebuilt it 3–5 times per
  // cycle in production instead of once.
  revalidateTag("fleet", "max")

  // The reliability rollup is cached for an hour rather than per cycle (its
  // buckets are days and hours), so it only needs dropping early when models
  // joined or left — otherwise its panels disagree with the model table about
  // the fleet's size. The collector says so in the body; an empty or malformed
  // body means "values only", never an error, so older collectors keep working.
  const body = (await req.json().catch(() => null)) as { compositionChanged?: unknown } | null
  const compositionChanged = body?.compositionChanged === true
  if (compositionChanged) revalidateTag("fleet-composition", "max")
  api.info("fleet cache invalidated", { compositionChanged })

  return NextResponse.json({ revalidated: true, compositionChanged, at: new Date().toISOString() })
}
