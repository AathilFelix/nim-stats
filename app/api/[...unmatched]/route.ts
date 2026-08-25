import { notFound, readOnlyMethodHandler } from "@/lib/api/errors"

// Catch-all for API paths that do not exist.
//
// Without this, an unknown `/api/…` path fell through to the app's HTML 404
// page — a browser-shaped answer to a machine-shaped question, and the reason
// an audit concludes the API returns no JSON errors. Concrete routes are more
// specific than this catch-all, so it only ever runs when nothing else matched.

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

async function unmatched(req: Request) {
  return notFound(new URL(req.url).pathname)
}

export const GET = unmatched
export const HEAD = unmatched
// A write to a read-only API is a method problem, not a routing problem — but
// the path still does not exist, so 404 stays the honest answer. The one case
// worth distinguishing is a write to a path that *does* exist, which each real
// route answers itself with a 405.
export const POST = unmatched
export const PUT = unmatched
export const PATCH = unmatched
export const DELETE = unmatched
export const OPTIONS = readOnlyMethodHandler
