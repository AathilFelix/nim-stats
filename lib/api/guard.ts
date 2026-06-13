import { timingSafeEqual } from "node:crypto"
import { NextResponse } from "next/server"

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a)
  const bb = Buffer.from(b)
  return ab.length === bb.length && timingSafeEqual(ab, bb)
}

/**
 * Gate for internal / non-browser API routes.
 *
 * Returns a 404 `NextResponse` when the caller isn't authorized (404 rather than
 * 401 so the endpoint's existence stays hidden), or `null` when the request may
 * proceed. Auth is a shared secret sent as `Authorization: Bearer <token>` or
 * the `x-internal-token` header, compared in constant time.
 *
 * If `INTERNAL_API_TOKEN` is unset (e.g. local dev) the guard is a no-op so the
 * routes stay usable. ALWAYS set it in production to actually lock these down —
 * Cloudflare/WAF rules in front are good, but this also protects the raw
 * *.vercel.app origin, which the edge proxy doesn't cover.
 */
export function blockUnlessInternal(req: Request): NextResponse | null {
  const token = process.env.INTERNAL_API_TOKEN
  if (!token) return null

  const auth = req.headers.get("authorization") ?? ""
  const bearer = auth.startsWith("Bearer ") ? auth.slice(7) : ""
  const provided = bearer || req.headers.get("x-internal-token") || ""

  if (provided && safeEqual(provided, token)) return null
  return new NextResponse(null, { status: 404 })
}
