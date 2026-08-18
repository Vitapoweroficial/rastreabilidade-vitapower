import { NextRequest, NextResponse } from "next/server";
import { ensureWorkspaceMemberSchema } from "@/lib/workspace-members";
import { ensureWorkspaceAuthSchema } from "@/lib/workspace-auth";
import { ensureWorkspaceAlertSchema } from "@/lib/workspace-alerts";
import { getSql } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const OPS_KEY = "vp-cleanup-members-20260818-6a8d";

export async function GET(request: NextRequest) {
  if (request.nextUrl.searchParams.get("key") !== OPS_KEY) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  await ensureWorkspaceMemberSchema();
  await ensureWorkspaceAuthSchema();
  await ensureWorkspaceAlertSchema();
  const sql = getSql();

  const keepRows = await sql.query(`
    SELECT id, name, email
    FROM workspace_members
    WHERE LOWER(name) IN ('andrew', 'vitória', 'vitoria')
    ORDER BY CASE WHEN LOWER(name) = 'andrew' THEN 0 ELSE 1 END, id ASC
  `) as unknown as Array<{ id: number; name: string; email: string | null }>;

  const andrew = keepRows.find((row) => row.name.toLowerCase() === 'andrew');
  const vitoria = keepRows.find((row) => ['vitória', 'vitoria'].includes(row.name.toLowerCase()));
  if (!andrew || !vitoria) {
    return NextResponse.json({ ok: false, error: 'Andrew ou Vitória não encontrado.' }, { status: 409 });
  }

  await sql.query(`
    UPDATE workspace_alerts
    SET assignee_member_id = NULL,
        assignee = NULL,
        updated_at = NOW()
    WHERE assignee_member_id NOT IN ($1, $2)
  `, [andrew.id, vitoria.id]);

  const deleted = await sql.query(`
    DELETE FROM workspace_members
    WHERE id NOT IN ($1, $2)
    RETURNING id, name, email
  `, [andrew.id, vitoria.id]) as unknown as Array<{ id: number; name: string; email: string | null }>;

  const remaining = await sql.query(`
    SELECT id, name, email, department, role, access_level, active
    FROM workspace_members
    ORDER BY id ASC
  `);

  return NextResponse.json({ ok: true, deleted, remaining });
}
