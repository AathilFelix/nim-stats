import { NextResponse } from "next/server"
import { blockUnlessCron } from "@/lib/api/guard"
import { api } from "@/lib/telemetry/logger"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 10

// Where to dispatch. Public info (it's this repo), so safe to keep in source.
const REPO = "AathilFelix/nim-stats"
const WORKFLOW = "probe.yml"
const REF = "main"

// Pinged by an external scheduler (e.g. cron-job.org) on a reliable interval.
//
// It does NOT run the probe — that would be a long job on Vercel's request path
// and would chew through Hobby limits. Instead it dispatches the GitHub Actions
// workflow (which runs the probe where it belongs: free + unlimited on a public
// repo, and `workflow_dispatch` starts promptly, unlike the lazy `schedule:`
// queue). The GitHub token never leaves the server; the caller only holds
// `CRON_SECRET`, which can do nothing but trigger this one probe.
async function handle(req: Request): Promise<NextResponse> {
  const blocked = blockUnlessCron(req)
  if (blocked) return blocked

  const token = process.env.GH_DISPATCH_TOKEN
  if (!token) {
    api.error("cron trigger: GH_DISPATCH_TOKEN not set")
    return NextResponse.json({ error: "not_configured" }, { status: 503 })
  }

  let res: Response
  try {
    res = await fetch(
      `https://api.github.com/repos/${REPO}/actions/workflows/${WORKFLOW}/dispatches`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
          "User-Agent": "nim-stats-cron",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ref: REF }),
      },
    )
  } catch (err) {
    api.error("cron trigger: dispatch request failed", { error: (err as Error).message })
    return NextResponse.json({ error: "dispatch_failed" }, { status: 502 })
  }

  // GitHub returns 204 No Content on a successful dispatch.
  if (res.status === 204) {
    return NextResponse.json({ ok: true, dispatched: WORKFLOW })
  }
  const detail = await res.text().catch(() => "")
  api.error("cron trigger: dispatch rejected", { status: res.status, detail: detail.slice(0, 200) })
  return NextResponse.json({ error: "dispatch_failed", status: res.status }, { status: 502 })
}

// Accept POST (preferred) and GET (some cron services only send GET) — same guard.
export const POST = handle
export const GET = handle
