import { NextRequest, NextResponse } from "next/server";
import { ensureSchema, getSql } from "@/lib/db";
import { getDashboardStats } from "@/lib/repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SMOKE_TAX_ID = "VP-NEON-PERSISTENCE-SMOKE";

export async function GET() {
  return NextResponse.json({
    ok: true,
    stats: await getDashboardStats()
  });
}

export async function POST(request: NextRequest) {
  if (process.env.VERCEL_ENV !== "preview") {
    return NextResponse.json({ ok: false, error: "Smoke test available only in preview." }, { status: 403 });
  }

  await ensureSchema();
  const sql = getSql();
  const mode = request.nextUrl.searchParams.get("mode") ?? "verify";

  if (mode === "create") {
    await sql.query("DELETE FROM clients WHERE tax_id = $1", [SMOKE_TAX_ID]);
    const rows = await sql.query(
      `INSERT INTO clients (brand_name, legal_name, tax_id, contact_name, email, phone, active)
       VALUES ($1, $2, $3, $4, $5, $6, FALSE)
       RETURNING id, created_at`,
      [
        "VP Persistence Smoke",
        "Vita Power Persistence Smoke Test",
        SMOKE_TAX_ID,
        "Automated Test",
        "smoke-test@vitapower.local",
        null
      ]
    );

    return NextResponse.json({ ok: true, created: true, row: rows[0] ?? null });
  }

  if (mode === "cleanup") {
    const rows = await sql.query("DELETE FROM clients WHERE tax_id = $1 RETURNING id", [SMOKE_TAX_ID]);
    return NextResponse.json({ ok: true, cleaned: rows.length });
  }

  const rows = await sql.query(
    `SELECT id, brand_name, legal_name, tax_id, created_at
     FROM clients
     WHERE tax_id = $1
     ORDER BY id DESC
     LIMIT 1`,
    [SMOKE_TAX_ID]
  );

  return NextResponse.json({
    ok: true,
    persisted: rows.length === 1,
    row: rows[0] ?? null
  });
}
