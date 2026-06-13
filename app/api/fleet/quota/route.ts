import { NextResponse } from "next/server";
import { getQuotaStats } from "@/lib/dashboard-data";
import { blockUnlessInternal } from "@/lib/api/guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 5;

export async function GET(req: Request) {
  const blocked = blockUnlessInternal(req);
  if (blocked) return blocked;
  const data = await getQuotaStats();
  return NextResponse.json(data);
}
