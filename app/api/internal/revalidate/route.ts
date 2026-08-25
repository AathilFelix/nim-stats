import { revalidateTag } from "next/cache"
import { NextResponse } from "next/server"
import { blockUnlessInternal } from "@/lib/api/guard"
import { api } from "@/lib/telemetry/logger"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * Drop the cached fleet reads on demand.
 *
 * Every cached function in `lib/dashboard-data.ts` already declares
 * `tags: ["fleet"]`, but nothing ever invalidated them, so the tags were inert
 * and a fleet change could only surface by waiting out each TTL. The collector
 * calls this after a registry sync that actually changed the fleet's
 * composition (see `scripts/probe-once.ts`), which is the one moment where the
 * shape of the data — not just its values — is different.
 *
 * Sample values changing every 10 minutes is exactly what the TTLs are for and
 * deliberately does NOT hit this route; a model appearing or disappearing is
 * what users notice, so only that is worth an invalidation.
 *
 * Guarded by INTERNAL_API_TOKEN (404s when the caller isn't authorized), so it
 * can't be used to force expensive recomputation from outside.
 */
export async function POST(req: Request) {
  const blocked = blockUnlessInternal(req)
  if (blocked) return blocked

  // Two-argument form: the bare `revalidateTag(tag)` is deprecated in Next 16.
  // "max" marks the entries stale with stale-while-revalidate semantics, so the
  // next visitor is served instantly while the query re-runs behind them.
  revalidateTag("fleet", "max")
  api.info("fleet cache invalidated")

  return NextResponse.json({ revalidated: true, at: new Date().toISOString() })
}
