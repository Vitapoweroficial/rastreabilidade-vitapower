import { randomUUID } from "node:crypto";
import { neon } from "@neondatabase/serverless";

const isVercelBuild = process.env.VERCEL === "1";
const connectionString = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;

if (!isVercelBuild) {
  console.log("Skipping Neon persistence verification outside Vercel.");
  process.exit(0);
}

if (!connectionString) {
  throw new Error("DATABASE_URL or POSTGRES_URL is required in the Vercel environment.");
}

const marker = `vp-${process.env.VERCEL_GIT_COMMIT_SHA ?? "build"}-${randomUUID()}`;
const writer = neon(connectionString);
const reader = neon(connectionString);
const cleaner = neon(connectionString);

await writer.query(`
  CREATE TABLE IF NOT EXISTS deployment_health_checks (
    marker TEXT PRIMARY KEY,
    checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )
`);

await writer.query("INSERT INTO deployment_health_checks (marker) VALUES ($1)", [marker]);

const persistedRows = await reader.query("SELECT marker FROM deployment_health_checks WHERE marker = $1", [marker]);
if (persistedRows.length !== 1 || persistedRows[0]?.marker !== marker) {
  throw new Error("Neon persistence verification failed: inserted marker was not readable from a separate connection.");
}

await cleaner.query("DELETE FROM deployment_health_checks WHERE marker = $1", [marker]);
const remainingRows = await reader.query("SELECT marker FROM deployment_health_checks WHERE marker = $1", [marker]);
if (remainingRows.length !== 0) {
  throw new Error("Neon persistence verification failed: cleanup did not persist.");
}

const taskKey = `task-build-${randomUUID()}`;
await writer.query(`
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
    due_at TIMESTAMPTZ,
    accepted_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )
`);
await writer.query(`ALTER TABLE workspace_alerts ADD COLUMN IF NOT EXISTS task_status TEXT NOT NULL DEFAULT 'novo'`);
await writer.query(`ALTER TABLE workspace_alerts ADD COLUMN IF NOT EXISTS assignee TEXT`);
await writer.query(`ALTER TABLE workspace_alerts ADD COLUMN IF NOT EXISTS due_at TIMESTAMPTZ`);
await writer.query(`ALTER TABLE workspace_alerts ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ`);
await writer.query(`ALTER TABLE workspace_alerts ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ`);
await writer.query(`ALTER TABLE workspace_alerts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`);

const insertedTask = await writer.query(
  `INSERT INTO workspace_alerts (source_key, type, audience, title, message, href, task_status, due_at)
   VALUES ($1, 'private_label_briefing', 'Comercial + Engenharia', 'Smoke task', 'Build validation', '/admin/clientes/1', 'novo', NOW() + INTERVAL '24 hours')
   RETURNING id, due_at`,
  [taskKey]
);
const taskId = insertedTask[0]?.id;
if (!taskId || !insertedTask[0]?.due_at) throw new Error("Task verification failed: default deadline was not created.");

const dueAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
await writer.query(
  `UPDATE workspace_alerts SET
     task_status = $2::text,
     assignee = $3::text,
     due_at = $4::timestamptz,
     accepted_at = CASE WHEN $3::text IS NOT NULL THEN COALESCE(accepted_at, NOW()) ELSE accepted_at END,
     completed_at = CASE WHEN $2::text = 'concluido' THEN COALESCE(completed_at, NOW()) ELSE NULL END,
     read_at = COALESCE(read_at, NOW()),
     updated_at = NOW()
   WHERE id = $1`,
  [taskId, "em_andamento", "Gabriel", dueAt]
);

const assignedTask = await reader.query(
  `SELECT task_status, assignee, due_at, accepted_at, read_at FROM workspace_alerts WHERE id = $1`,
  [taskId]
);
if (assignedTask[0]?.task_status !== "em_andamento" || assignedTask[0]?.assignee !== "Gabriel" || !assignedTask[0]?.accepted_at || !assignedTask[0]?.read_at) {
  throw new Error("Task verification failed: assignment/status did not persist.");
}

await writer.query(
  `UPDATE workspace_alerts SET task_status = 'concluido', completed_at = NOW(), updated_at = NOW() WHERE id = $1`,
  [taskId]
);
const completedTask = await reader.query(`SELECT task_status, completed_at FROM workspace_alerts WHERE id = $1`, [taskId]);
if (completedTask[0]?.task_status !== "concluido" || !completedTask[0]?.completed_at) {
  throw new Error("Task verification failed: completion did not persist.");
}

await cleaner.query(`DELETE FROM workspace_alerts WHERE id = $1`, [taskId]);
const leftoverTask = await reader.query(`SELECT id FROM workspace_alerts WHERE id = $1`, [taskId]);
if (leftoverTask.length !== 0) throw new Error("Task verification failed: cleanup did not persist.");

console.log("Neon persistence verification passed across independent connections.");
console.log("Workspace task verification passed: owner, deadline, status and completion persisted.");
