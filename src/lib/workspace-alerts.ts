import { ensureSchema, getSql } from "@/lib/db";

type AlertRow = {
  id: number;
  source_key: string;
  type: string;
  audience: string;
  title: string;
  message: string;
  href: string | null;
  entity_type: string | null;
  entity_id: number | null;
  read_at: string | Date | null;
  created_at: string | Date;
};

let alertSchemaPromise: Promise<void> | null = null;

export async function ensureWorkspaceAlertSchema() {
  if (!alertSchemaPromise) {
    alertSchemaPromise = (async () => {
      await ensureSchema();
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
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);
      await Promise.all([
        sql.query("CREATE INDEX IF NOT EXISTS idx_workspace_alerts_read_at ON workspace_alerts(read_at)"),
        sql.query("CREATE INDEX IF NOT EXISTS idx_workspace_alerts_created_at ON workspace_alerts(created_at DESC)"),
        sql.query("CREATE INDEX IF NOT EXISTS idx_workspace_alerts_entity ON workspace_alerts(entity_type, entity_id)")
      ]);
    })().catch((error) => {
      alertSchemaPromise = null;
      throw error;
    });
  }
  await alertSchemaPromise;
}

function iso(value: string | Date | null) {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : String(value);
}

export async function createWorkspaceAlert(input: {
  sourceKey: string;
  type?: string;
  audience: string;
  title: string;
  message: string;
  href?: string | null;
  entityType?: string | null;
  entityId?: number | null;
}) {
  await ensureWorkspaceAlertSchema();
  const rows = await getSql().query(
    `INSERT INTO workspace_alerts (source_key, type, audience, title, message, href, entity_type, entity_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     ON CONFLICT (source_key) DO UPDATE SET
       audience = EXCLUDED.audience,
       title = EXCLUDED.title,
       message = EXCLUDED.message,
       href = EXCLUDED.href,
       entity_type = EXCLUDED.entity_type,
       entity_id = EXCLUDED.entity_id
     RETURNING id`,
    [
      input.sourceKey,
      input.type ?? "info",
      input.audience,
      input.title,
      input.message,
      input.href ?? null,
      input.entityType ?? null,
      input.entityId ?? null
    ]
  ) as unknown as { id: number }[];
  return rows[0]?.id ?? null;
}

export async function listWorkspaceAlerts(limit = 12) {
  await ensureWorkspaceAlertSchema();
  const rows = await getSql().query(
    `SELECT id, source_key, type, audience, title, message, href, entity_type, entity_id, read_at, created_at
     FROM workspace_alerts
     ORDER BY (read_at IS NULL) DESC, created_at DESC, id DESC
     LIMIT $1`,
    [Math.max(1, Math.min(limit, 50))]
  ) as unknown as AlertRow[];

  return rows.map((row) => ({
    id: row.id,
    sourceKey: row.source_key,
    type: row.type,
    audience: row.audience,
    title: row.title,
    message: row.message,
    href: row.href,
    entityType: row.entity_type,
    entityId: row.entity_id,
    readAt: iso(row.read_at),
    createdAt: iso(row.created_at) ?? new Date(0).toISOString()
  }));
}

export async function getUnreadWorkspaceAlertCount() {
  await ensureWorkspaceAlertSchema();
  const rows = await getSql().query(`SELECT COUNT(*)::int AS count FROM workspace_alerts WHERE read_at IS NULL`) as unknown as { count: number }[];
  return Number(rows[0]?.count ?? 0);
}

export async function markWorkspaceAlertRead(alertId: number) {
  await ensureWorkspaceAlertSchema();
  await getSql().query(`UPDATE workspace_alerts SET read_at = COALESCE(read_at, NOW()) WHERE id = $1`, [alertId]);
}

export async function markAllWorkspaceAlertsRead() {
  await ensureWorkspaceAlertSchema();
  await getSql().query(`UPDATE workspace_alerts SET read_at = NOW() WHERE read_at IS NULL`);
}
