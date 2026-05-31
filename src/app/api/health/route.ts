import { NextResponse } from "next/server";
import { getDashboardStats } from "@/lib/repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({
    ok: true,
    stats: getDashboardStats()
  });
}
