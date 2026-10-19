import { timingSafeEqual } from "node:crypto"
import type { NextResponse } from "next/server"

import { notFound } from "@/lib/api/errors"

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a)
  const bb = Buffer.from(b)
  return ab.length === bb.length && timingSafeEqual(ab, bb)
}

/**
 * Gate for internal / non-browser API routes.
 *
 * Returns a 404 `NextResponse` when the caller isn't authorized (404 rather than
 * 401 so the endpoint's existence stays hidden — with the same JSON body the
 * catch-all returns for a path that genuinely does not exist), or `null` when
 * the request may proceed. Auth is a shared secret sent as `Authorization: Bearer <token>` or
 * the `x-internal-token` header, compared in constant time.
 *
 * If `INTERNAL_API_TOKEN` is unset the guard is a no-op in local dev and tests,
 * so the routes stay usable there. A production build fails CLOSED instead:
 * Worker Previews don't inherit production secrets, so a preview without its own
 * token would otherwise expose every internal route on a public URL.
 */
export function blockUnlessInternal(req: Request): NextResponse | null {
  const token = process.env.INTERNAL_API_TOKEN
  if (!token) return process.env.NODE_ENV === "production" ? notFound(new URL(req.url).pathname) : null

  const auth = req.headers.get("authorization") ?? ""
  const bearer = auth.startsWith("Bearer ") ? auth.slice(7) : ""
  const provided = bearer || req.headers.get("x-internal-token") || ""

  if (provided && safeEqual(provided, token)) return null
  // Byte-identical to the catch-all's 404 so an unauthorized caller cannot tell
  // a gated endpoint from one that was never there.
  return notFound(new URL(req.url).pathname)
}
