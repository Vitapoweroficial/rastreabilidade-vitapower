import { ensureSchema, getSql } from "@/lib/db";

let auditSchemaPromise: Promise<void> | null = null;

export async function ensureWorkspaceAuditSchema() {
  if (!auditSchemaPromise) {
    auditSchemaPromise = (async () => {
      await ensureSchema();
      const sql = getSql();
      await sql.query(`
        CREATE TABLE IF NOT EXISTS workspace_audit_log (
          id BIGSERIAL PRIMARY KEY,
          actor_member_id BIGINT,
          action TEXT NOT NULL,
          entity_type TEXT,
          entity_id TEXT,
          summary TEXT NOT NULL,
          metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);
      await Promise.all([
        sql.query("CREATE INDEX IF NOT EXISTS idx_workspace_audit_actor ON workspace_audit_log(actor_member_id)"),
        sql.query("CREATE INDEX IF NOT EXISTS idx_workspace_audit_created ON workspace_audit_log(created_at DESC)"),
        sql.query("CREATE INDEX IF NOT EXISTS idx_workspace_audit_entity ON workspace_audit_log(entity_type, entity_id)")
      ]);
    })().catch((error) => {
      auditSchemaPromise = null;
      throw error;
    });
  }
  await auditSchemaPromise;
}

export async function recordWorkspaceAudit(input: {
  actorMemberId?: number | null;
  action: string;
  entityType?: string | null;
  entityId?: string | number | null;
  summary: string;
  metadata?: Record<string, unknown>;
}) {
  await ensureWorkspaceAuditSchema();
  await getSql().query(
    `INSERT INTO workspace_audit_log (actor_member_id, action, entity_type, entity_id, summary, metadata)
     VALUES ($1, $2, $3, $4, $5, $6::jsonb)`,
    [
      input.actorMemberId ?? null,
      input.action,
      input.entityType ?? null,
      input.entityId === undefined || input.entityId === null ? null : String(input.entityId),
      input.summary,
      JSON.stringify(input.metadata ?? {})
    ]
  );
}

export async function listWorkspaceAudit(limit = 80) {
  await ensureWorkspaceAuditSchema();
  return getSql().query(
    `SELECT a.id, a.actor_member_id, m.name AS actor_name, a.action, a.entity_type, a.entity_id,
            a.summary, a.metadata, a.created_at
     FROM workspace_audit_log a
     LEFT JOIN workspace_members m ON m.id = a.actor_member_id
     ORDER BY a.created_at DESC, a.id DESC
     LIMIT $1`,
    [Math.max(1, Math.min(limit, 200))]
  );
}
