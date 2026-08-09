import { ensureSchema, getSql } from "@/lib/db";
import { ensureWorkspaceMemberSchema, getWorkspaceMember } from "@/lib/workspace-members";

export const workspaceTaskStatuses = ["novo", "em_andamento", "aguardando_cliente", "concluido"] as const;
export type WorkspaceTaskStatus = (typeof workspaceTaskStatuses)[number];

type AlertRow = {
  id: number; source_key: string; type: string; audience: string; title: string; message: string; href: string | null;
  entity_type: string | null; entity_id: number | null; read_at: string | Date | null; task_status: WorkspaceTaskStatus;
  assignee: string | null; assignee_member_id: number | null; due_at: string | Date | null; accepted_at: string | Date | null;
  completed_at: string | Date | null; created_at: string | Date; updated_at: string | Date;
};

let alertSchemaPromise: Promise<void> | null = null;

export async function ensureWorkspaceAlertSchema() {
  if (!alertSchemaPromise) {
    alertSchemaPromise = (async () => {
      await ensureSchema();
      await ensureWorkspaceMemberSchema();
      const sql = getSql();
      await sql.query(`
        CREATE TABLE IF NOT EXISTS workspace_alerts (
          id BIGSERIAL PRIMARY KEY,
          source_key TEXT NOT NULL UNIQUE,
          type TEXT NOT NULL DEFAULT 'info',
          audience TEXT NOT NULL DEFAULT 'Operação',
          title TEXT NOT NULL,
          message TEXT NOT NULL,
          href TEXT,
          entity_type TEXT,
          entity_id INTEGER,
          read_at TIMESTAMPTZ,
          task_status TEXT NOT NULL DEFAULT 'novo',
          assignee TEXT,
          assignee_member_id BIGINT REFERENCES workspace_members(id) ON DELETE SET NULL,
          due_at TIMESTAMPTZ,
          accepted_at TIMESTAMPTZ,
          completed_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);
      await sql.query(`ALTER TABLE workspace_alerts ADD COLUMN IF NOT EXISTS task_status TEXT NOT NULL DEFAULT 'novo'`);
      await sql.query(`ALTER TABLE workspace_alerts ADD COLUMN IF NOT EXISTS assignee TEXT`);
      await sql.query(`ALTER TABLE workspace_alerts ADD COLUMN IF NOT EXISTS assignee_member_id BIGINT REFERENCES workspace_members(id) ON DELETE SET NULL`);
      await sql.query(`ALTER TABLE workspace_alerts ADD COLUMN IF NOT EXISTS due_at TIMESTAMPTZ`);
      await sql.query(`ALTER TABLE workspace_alerts ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ`);
      await sql.query(`ALTER TABLE workspace_alerts ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ`);
      await sql.query(`ALTER TABLE workspace_alerts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`);
      await sql.query(`UPDATE workspace_alerts SET due_at = created_at + INTERVAL '24 hours' WHERE due_at IS NULL AND task_status <> 'concluido'`);
      await sql.query(`
        UPDATE workspace_alerts a SET assignee_member_id = m.id
        FROM workspace_members m
        WHERE a.assignee_member_id IS NULL AND a.assignee IS NOT NULL AND LOWER(TRIM(a.assignee)) = LOWER(TRIM(m.name))
      `);
      await Promise.all([
        sql.query("CREATE INDEX IF NOT EXISTS idx_workspace_alerts_read_at ON workspace_alerts(read_at)"),
        sql.query("CREATE INDEX IF NOT EXISTS idx_workspace_alerts_created_at ON workspace_alerts(created_at DESC)"),
        sql.query("CREATE INDEX IF NOT EXISTS idx_workspace_alerts_entity ON workspace_alerts(entity_type, entity_id)"),
        sql.query("CREATE INDEX IF NOT EXISTS idx_workspace_alerts_task_status ON workspace_alerts(task_status)"),
        sql.query("CREATE INDEX IF NOT EXISTS idx_workspace_alerts_due_at ON workspace_alerts(due_at)"),
        sql.query("CREATE INDEX IF NOT EXISTS idx_workspace_alerts_assignee_member ON workspace_alerts(assignee_member_id)")
      ]);
    })().catch((error) => { alertSchemaPromise = null; throw error; });
  }
  await alertSchemaPromise;
}

function iso(value: string | Date | null) { if (!value) return null; return value instanceof Date ? value.toISOString() : String(value); }
function normalizeStatus(value: string | undefined): WorkspaceTaskStatus { return workspaceTaskStatuses.includes(value as WorkspaceTaskStatus) ? value as WorkspaceTaskStatus : "novo"; }
function mapAlert(row: AlertRow) {
  return {
    id: Number(row.id), sourceKey: row.source_key, type: row.type, audience: row.audience, title: row.title, message: row.message,
    href: row.href, entityType: row.entity_type, entityId: row.entity_id, readAt: iso(row.read_at), taskStatus: normalizeStatus(row.task_status),
    assignee: row.assignee, assigneeMemberId: row.assignee_member_id ? Number(row.assignee_member_id) : null, dueAt: iso(row.due_at),
    acceptedAt: iso(row.accepted_at), completedAt: iso(row.completed_at), createdAt: iso(row.created_at) ?? new Date(0).toISOString(),
    updatedAt: iso(row.updated_at) ?? new Date(0).toISOString()
  };
}

const selectColumns = `id, source_key, type, audience, title, message, href, entity_type, entity_id, read_at,
  task_status, assignee, assignee_member_id, due_at, accepted_at, completed_at, created_at, updated_at`;
const ordering = `(task_status <> 'concluido') DESC, (due_at IS NOT NULL AND due_at < NOW() AND task_status <> 'concluido') DESC, (read_at IS NULL) DESC, created_at DESC, id DESC`;

export async function createWorkspaceAlert(input: { sourceKey: string; type?: string; audience: string; title: string; message: string; href?: string | null; entityType?: string | null; entityId?: number | null }) {
  await ensureWorkspaceAlertSchema();
  const rows = await getSql().query(
    `INSERT INTO workspace_alerts (source_key, type, audience, title, message, href, entity_type, entity_id, task_status, due_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'novo', NOW() + INTERVAL '24 hours')
     ON CONFLICT (source_key) DO UPDATE SET audience = EXCLUDED.audience, title = EXCLUDED.title, message = EXCLUDED.message,
       href = EXCLUDED.href, entity_type = EXCLUDED.entity_type, entity_id = EXCLUDED.entity_id, updated_at = NOW()
     RETURNING id`,
    [input.sourceKey, input.type ?? "info", input.audience, input.title, input.message, input.href ?? null, input.entityType ?? null, input.entityId ?? null]
  ) as unknown as Array<{ id: number }>;
  return rows[0]?.id ?? null;
}

export async function listWorkspaceAlerts(limit = 20) {
  await ensureWorkspaceAlertSchema();
  const rows = await getSql().query(`SELECT ${selectColumns} FROM workspace_alerts ORDER BY ${ordering} LIMIT $1`, [Math.max(1, Math.min(limit, 100))]) as unknown as AlertRow[];
  return rows.map(mapAlert);
}

export async function listWorkspaceAlertsForMember(limit: number, memberId: number, includeAll = false) {
  if (includeAll) return listWorkspaceAlerts(limit);
  await ensureWorkspaceAlertSchema();
  const rows = await getSql().query(
    `SELECT ${selectColumns} FROM workspace_alerts WHERE assignee_member_id = $2 ORDER BY ${ordering} LIMIT $1`,
    [Math.max(1, Math.min(limit, 100)), memberId]
  ) as unknown as AlertRow[];
  return rows.map(mapAlert);
}

export async function getUnreadWorkspaceAlertCount(memberId?: number, includeAll = true) {
  await ensureWorkspaceAlertSchema();
  const rows = await getSql().query(
    `SELECT COUNT(*)::int AS count FROM workspace_alerts WHERE read_at IS NULL ${includeAll || !memberId ? "" : "AND assignee_member_id = $1"}`,
    includeAll || !memberId ? [] : [memberId]
  ) as unknown as Array<{ count: number }>;
  return Number(rows[0]?.count ?? 0);
}

export async function getOpenWorkspaceTaskCount(memberId?: number, includeAll = true) {
  await ensureWorkspaceAlertSchema();
  const rows = await getSql().query(
    `SELECT COUNT(*)::int AS count FROM workspace_alerts WHERE task_status <> 'concluido' ${includeAll || !memberId ? "" : "AND assignee_member_id = $1"}`,
    includeAll || !memberId ? [] : [memberId]
  ) as unknown as Array<{ count: number }>;
  return Number(rows[0]?.count ?? 0);
}

export async function getWorkspaceTaskOwnership(alertId: number) {
  await ensureWorkspaceAlertSchema();
  const rows = await getSql().query(`SELECT assignee_member_id FROM workspace_alerts WHERE id = $1`, [alertId]) as unknown as Array<{ assignee_member_id: number | null }>;
  return rows[0] ? { assigneeMemberId: rows[0].assignee_member_id ? Number(rows[0].assignee_member_id) : null } : null;
}

export async function markWorkspaceAlertRead(alertId: number) {
  await ensureWorkspaceAlertSchema();
  await getSql().query(`UPDATE workspace_alerts SET read_at = COALESCE(read_at, NOW()), updated_at = NOW() WHERE id = $1`, [alertId]);
}

export async function markAllWorkspaceAlertsRead(memberId?: number, includeAll = true) {
  await ensureWorkspaceAlertSchema();
  await getSql().query(
    `UPDATE workspace_alerts SET read_at = NOW(), updated_at = NOW() WHERE read_at IS NULL ${includeAll || !memberId ? "" : "AND assignee_member_id = $1"}`,
    includeAll || !memberId ? [] : [memberId]
  );
}

export async function updateWorkspaceTask(input: { alertId: number; taskStatus?: WorkspaceTaskStatus; assignee?: string | null; assigneeMemberId?: number | null; dueAt?: string | null }) {
  await ensureWorkspaceAlertSchema();
  const sql = getSql();
  const currentRows = await sql.query(`SELECT task_status, assignee, assignee_member_id, due_at FROM workspace_alerts WHERE id = $1`, [input.alertId]) as unknown as Array<{ task_status: WorkspaceTaskStatus; assignee: string | null; assignee_member_id: number | null; due_at: string | Date | null }>;
  const current = currentRows[0];
  if (!current) throw new Error("Tarefa não encontrada.");
  const status = input.taskStatus ? normalizeStatus(input.taskStatus) : normalizeStatus(current.task_status);
  let assignee = input.assignee === undefined ? current.assignee : (input.assignee?.trim() || null);
  let assigneeMemberId = input.assigneeMemberId === undefined ? current.assignee_member_id : input.assigneeMemberId;
  if (input.assigneeMemberId !== undefined) {
    if (input.assigneeMemberId === null) { assignee = null; assigneeMemberId = null; }
    else {
      const member = await getWorkspaceMember(input.assigneeMemberId);
      if (!member || !member.active) throw new Error("Responsável inválido ou inativo.");
      assignee = member.name; assigneeMemberId = member.id;
    }
  }
  let dueAt: string | null;
  if (input.dueAt === undefined) dueAt = iso(current.due_at);
  else if (!input.dueAt) dueAt = null;
  else { const parsed = new Date(input.dueAt); if (Number.isNaN(parsed.getTime())) throw new Error("Prazo inválido."); dueAt = parsed.toISOString(); }
  await sql.query(
    `UPDATE workspace_alerts SET task_status = $2::text, assignee = $3::text, assignee_member_id = $4::bigint, due_at = $5::timestamptz,
       accepted_at = CASE WHEN $4::bigint IS NOT NULL THEN COALESCE(accepted_at, NOW()) ELSE accepted_at END,
       completed_at = CASE WHEN $2::text = 'concluido' THEN COALESCE(completed_at, NOW()) ELSE NULL END,
       read_at = COALESCE(read_at, NOW()), updated_at = NOW() WHERE id = $1`,
    [input.alertId, status, assignee, assigneeMemberId, dueAt]
  );
  const rows = await sql.query(`SELECT ${selectColumns} FROM workspace_alerts WHERE id = $1`, [input.alertId]) as unknown as AlertRow[];
  return mapAlert(rows[0]);
}
