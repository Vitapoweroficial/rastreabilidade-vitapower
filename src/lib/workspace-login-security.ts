import { createHash } from "node:crypto";
import { ensureSchema, getSql } from "@/lib/db";

const WINDOW_MINUTES = 15;
const MAX_FAILED_ATTEMPTS = 5;
let schemaPromise: Promise<void> | null = null;

function emailHash(email: string) {
  return createHash("sha256").update(email.trim().toLowerCase()).digest("hex");
}

async function ensureLoginSecuritySchema() {
  if (!schemaPromise) {
    schemaPromise = (async () => {
      await ensureSchema();
      const sql = getSql();
      await sql.query(`
        CREATE TABLE IF NOT EXISTS workspace_login_attempts (
          id BIGSERIAL PRIMARY KEY,
          email_hash TEXT NOT NULL,
          successful BOOLEAN NOT NULL DEFAULT FALSE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);
      await Promise.all([
        sql.query("CREATE INDEX IF NOT EXISTS idx_workspace_login_attempts_email_created ON workspace_login_attempts(email_hash, created_at DESC)"),
        sql.query("CREATE INDEX IF NOT EXISTS idx_workspace_login_attempts_created ON workspace_login_attempts(created_at)")
      ]);
      await sql.query(`DELETE FROM workspace_login_attempts WHERE created_at < NOW() - INTERVAL '30 days'`);
    })().catch((error) => {
      schemaPromise = null;
      throw error;
    });
  }
  await schemaPromise;
}

export async function assertWorkspaceLoginAllowed(email: string) {
  await ensureLoginSecuritySchema();
  const rows = await getSql().query(
    `SELECT COUNT(*)::int AS failed_count
     FROM workspace_login_attempts
     WHERE email_hash = $1 AND successful = FALSE
       AND created_at >= NOW() - ($2 || ' minutes')::interval`,
    [emailHash(email), String(WINDOW_MINUTES)]
  ) as unknown as Array<{ failed_count: number }>;
  if (Number(rows[0]?.failed_count ?? 0) >= MAX_FAILED_ATTEMPTS) {
    throw new Error("Muitas tentativas de acesso. Aguarde alguns minutos e tente novamente.");
  }
}

export async function recordWorkspaceLoginAttempt(email: string, successful: boolean) {
  await ensureLoginSecuritySchema();
  await getSql().query(
    `INSERT INTO workspace_login_attempts (email_hash, successful) VALUES ($1, $2)`,
    [emailHash(email), successful]
  );
}
