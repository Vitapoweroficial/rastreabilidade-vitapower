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

await writer.query(`
  CREATE TABLE IF NOT EXISTS workspace_members (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    department TEXT NOT NULL,
    role TEXT NOT NULL,
    access_level TEXT NOT NULL DEFAULT 'membro',
    permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )
`);

const memberToken = randomUUID();
const memberRows = await writer.query(
  `INSERT INTO workspace_members (name, email, department, role, access_level, permissions)
   VALUES ($1, $2, 'Comercial', 'Validação de deploy', 'gestor', $3::jsonb)
   RETURNING id`,
  [`Deploy ${memberToken.slice(0, 8)}`, `deploy-${memberToken}@example.invalid`, JSON.stringify(["dashboard", "tarefas", "clientes", "private_label"])]
);
const memberId = memberRows[0]?.id;
if (!memberId) throw new Error("Workspace member verification failed: member was not created.");
const persistedMember = await reader.query(`SELECT access_level, permissions FROM workspace_members WHERE id = $1`, [memberId]);
if (persistedMember[0]?.access_level !== "gestor" || !Array.isArray(persistedMember[0]?.permissions) || !persistedMember[0].permissions.includes("tarefas")) {
  throw new Error("Workspace member verification failed: role or permissions did not persist.");
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
    assignee_member_id BIGINT REFERENCES workspace_members(id) ON DELETE SET NULL,
    due_at TIMESTAMPTZ,
    accepted_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )
`);
await writer.query(`ALTER TABLE workspace_alerts ADD COLUMN IF NOT EXISTS task_status TEXT NOT NULL DEFAULT 'novo'`);
await writer.query(`ALTER TABLE workspace_alerts ADD COLUMN IF NOT EXISTS assignee TEXT`);
await writer.query(`ALTER TABLE workspace_alerts ADD COLUMN IF NOT EXISTS assignee_member_id BIGINT REFERENCES workspace_members(id) ON DELETE SET NULL`);
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
     assignee_member_id = $4::bigint,
     due_at = $5::timestamptz,
     accepted_at = CASE WHEN $4::bigint IS NOT NULL THEN COALESCE(accepted_at, NOW()) ELSE accepted_at END,
     completed_at = CASE WHEN $2::text = 'concluido' THEN COALESCE(completed_at, NOW()) ELSE NULL END,
     read_at = COALESCE(read_at, NOW()),
     updated_at = NOW()
   WHERE id = $1`,
  [taskId, "em_andamento", `Deploy ${memberToken.slice(0, 8)}`, memberId, dueAt]
);

const assignedTask = await reader.query(
  `SELECT task_status, assignee, assignee_member_id, due_at, accepted_at, read_at FROM workspace_alerts WHERE id = $1`,
  [taskId]
);
if (assignedTask[0]?.task_status !== "em_andamento" || Number(assignedTask[0]?.assignee_member_id) !== Number(memberId) || !assignedTask[0]?.accepted_at || !assignedTask[0]?.read_at) {
  throw new Error("Task verification failed: registered member assignment/status did not persist.");
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
await cleaner.query(`DELETE FROM workspace_members WHERE id = $1`, [memberId]);
const leftoverTask = await reader.query(`SELECT id FROM workspace_alerts WHERE id = $1`, [taskId]);
const leftoverMember = await reader.query(`SELECT id FROM workspace_members WHERE id = $1`, [memberId]);
if (leftoverTask.length !== 0 || leftoverMember.length !== 0) throw new Error("Workspace verification failed: cleanup did not persist.");

console.log("Neon persistence verification passed across independent connections.");
console.log("Workspace team verification passed: role and permissions persisted.");
console.log("Workspace task verification passed: registered owner, deadline, status and completion persisted.");
