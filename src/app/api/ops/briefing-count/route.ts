import { NextResponse } from "next/server";
import { ensureSchema, getSql } from "@/lib/db";
import { ensurePrivateLabelBriefingSchema } from "@/lib/private-label-briefings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (process.env.VERCEL_ENV !== "preview") {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  await ensureSchema();
  await ensurePrivateLabelBriefingSchema();
  const sql = getSql();
  const rows = (await sql.query(`
    SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE source = 'public_form')::int AS public_form_total,
      COUNT(*) FILTER (WHERE status = 'submitted')::int AS submitted_total,
      MAX(submitted_at) AS latest_submitted_at
    FROM private_label_briefings
  `)) as unknown as Array<{
    total: number;
    public_form_total: number;
    submitted_total: number;
    latest_submitted_at: string | Date | null;
  }>;

  return NextResponse.json({ ok: true, ...rows[0] });
}
