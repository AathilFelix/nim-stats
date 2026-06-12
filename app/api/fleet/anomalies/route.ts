import { NextResponse } from "next/server";
import { getAnomalyData } from "@/lib/dashboard-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 10;

export async function GET() {
  const data = await getAnomalyData();
  return NextResponse.json(data);
}
