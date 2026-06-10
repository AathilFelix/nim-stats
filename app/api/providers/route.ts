import { NextResponse } from "next/server"
import { getProviderStats } from "@/lib/telemetry/aggregation"
import { api } from "@/lib/telemetry/logger"

export const runtime = "nodejs"
export const maxDuration = 15

export async function GET() {
  try {
    const providers = await getProviderStats()
    return NextResponse.json({ data: providers })
  } catch (err) {
    api.error("GET /api/providers failed", { error: (err as Error).message })
    return NextResponse.json({ error: "server_error" }, { status: 500 })
  }
}
