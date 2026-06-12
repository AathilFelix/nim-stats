import { NextResponse } from "next/server";
import { getQuotaStats } from "@/lib/dashboard-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 5;

export async function GET() {
  const data = await getQuotaStats();
  return NextResponse.json(data);
}
