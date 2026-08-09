import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ensureSchema, getSql } from "@/lib/db";
import {
  ensureWorkspaceMemberSchema,
  getWorkspaceMember,
  type WorkspaceMember,
  type WorkspaceModuleId
} from "@/lib/workspace-members";
import { recordWorkspaceAudit } from "@/lib/workspace-audit";

const SESSION_COOKIE = "vita_os_session";
const SESSION_HOURS = 12;
const BOOTSTRAP_TOKEN_HASH = "980b968dcb3afc78c2f094f5d50a87b4d43e2e043ccf0eeccdfeb20f8c756be4";

let authSchemaPromise: Promise<void> | null = null;

export class WorkspaceAccessError extends Error {
  constructor(message = "Acesso não autorizado.") {
    super(message);
    this.name = "WorkspaceAccessError";
  }
}

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function passwordHash(password: string, salt: string) {
  return scryptSync(password, salt, 64).toString("hex");
}

function validatePassword(password: string) {
  if (password.length < 12) throw new Error("A senha deve ter pelo menos 12 caracteres.");
  if (!/[A-Za-zÀ-ÿ]/.test(password) || !/\d/.test(password)) throw new Error("Use pelo menos uma letra e um número na senha.");
}

export async function ensureWorkspaceAuthSchema() {
  if (!authSchemaPromise) {
    authSchemaPromise = (async () => {
      await ensureSchema();
      await ensureWorkspaceMemberSchema();
      const sql = getSql();
      await sql.query(`
        CREATE TABLE IF NOT EXISTS workspace_credentials (
          member_id BIGINT PRIMARY KEY REFERENCES workspace_members(id) ON DELETE CASCADE,
          password_hash TEXT NOT NULL,
          password_salt TEXT NOT NULL,
          password_set_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);
      await sql.query(`
        CREATE TABLE IF NOT EXISTS workspace_sessions (
          id BIGSERIAL PRIMARY KEY,
          member_id BIGINT NOT NULL REFERENCES workspace_members(id) ON DELETE CASCADE,
          token_hash TEXT NOT NULL UNIQUE,
          expires_at TIMESTAMPTZ NOT NULL,
          revoked_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);
      await sql.query(`
        CREATE TABLE IF NOT EXISTS workspace_invites (
          id BIGSERIAL PRIMARY KEY,
          member_id BIGINT NOT NULL REFERENCES workspace_members(id) ON DELETE CASCADE,
          token_hash TEXT NOT NULL UNIQUE,
          source TEXT NOT NULL DEFAULT 'admin_invite',
          created_by_member_id BIGINT REFERENCES workspace_members(id) ON DELETE SET NULL,
          expires_at TIMESTAMPTZ NOT NULL,
          used_at TIMESTAMPTZ,
          revoked_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);
      await Promise.all([
        sql.query("CREATE INDEX IF NOT EXISTS idx_workspace_sessions_member ON workspace_sessions(member_id)"),
        sql.query("CREATE INDEX IF NOT EXISTS idx_workspace_sessions_expiry ON workspace_sessions(expires_at)"),
        sql.query("CREATE INDEX IF NOT EXISTS idx_workspace_invites_member ON workspace_invites(member_id)"),
        sql.query("CREATE INDEX IF NOT EXISTS idx_workspace_invites_expiry ON workspace_invites(expires_at)")
      ]);
      await sql.query(
        `INSERT INTO workspace_invites (member_id, token_hash, source, expires_at)
         SELECT m.id, $1, 'bootstrap', NOW() + INTERVAL '30 days'
         FROM workspace_members m
         WHERE LOWER(m.name) = 'andrew'
           AND NOT EXISTS (SELECT 1 FROM workspace_credentials c WHERE c.member_id = m.id)
           AND NOT EXISTS (SELECT 1 FROM workspace_invites i WHERE i.token_hash = $1)
         LIMIT 1`,
        [BOOTSTRAP_TOKEN_HASH]
      );
      await sql.query(`DELETE FROM workspace_sessions WHERE expires_at < NOW() - INTERVAL '7 days' OR (revoked_at IS NOT NULL AND revoked_at < NOW() - INTERVAL '7 days')`);
    })().catch((error) => {
      authSchemaPromise = null;
      throw error;
    });
  }
  await authSchemaPromise;
}

export function canAccessModule(member: WorkspaceMember, moduleId: WorkspaceModuleId) {
  return member.accessLevel === "admin" || member.permissions.includes(moduleId);
}

export function canWriteWorkspace(member: WorkspaceMember) {
  return member.accessLevel !== "leitura";
}

async function createSession(memberId: number) {
  await ensureWorkspaceAuthSchema();
  const token = randomBytes(32).toString("base64url");
  await getSql().query(
    `INSERT INTO workspace_sessions (member_id, token_hash, expires_at)
     VALUES ($1, $2, NOW() + ($3 || ' hours')::interval)`,
    [memberId, sha256(token), String(SESSION_HOURS)]
  );
  const store = await cookies();
  store.set(SESSION_COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: SESSION_HOURS * 60 * 60 });
}

export const getCurrentWorkspaceSession = cache(async () => {
  await ensureWorkspaceAuthSchema();
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const rows = await getSql().query(
    `SELECT s.id AS session_id, s.member_id, m.name, m.email, m.department, m.role,
            m.access_level, m.permissions, m.active, m.created_at, m.updated_at
     FROM workspace_sessions s
     INNER JOIN workspace_members m ON m.id = s.member_id
     WHERE s.token_hash = $1 AND s.revoked_at IS NULL AND s.expires_at > NOW() AND m.active = TRUE LIMIT 1`,
    [sha256(token)]
  ) as unknown as Array<{ session_id: number; member_id: number; name: string; email: string | null; department: string; role: string; access_level: WorkspaceMember["accessLevel"]; permissions: WorkspaceModuleId[] | string; active: boolean; created_at: string | Date; updated_at: string | Date }>;
  const row = rows[0];
  if (!row) return null;
  let permissions: WorkspaceModuleId[] = [];
  if (Array.isArray(row.permissions)) permissions = row.permissions;
  else { try { permissions = JSON.parse(row.permissions) as WorkspaceModuleId[]; } catch { permissions = []; } }
  const member: WorkspaceMember = {
    id: Number(row.member_id), name: row.name, email: row.email, department: row.department, role: row.role,
    accessLevel: row.access_level, permissions, active: row.active,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
    updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : String(row.updated_at)
  };
  return { sessionId: Number(row.session_id), member };
});

export async function requireWorkspaceSession() {
  const session = await getCurrentWorkspaceSession();
  if (!session) redirect("/login");
  return session;
}

export async function requireWorkspaceModule(moduleId: WorkspaceModuleId) {
  const session = await requireWorkspaceSession();
  if (!canAccessModule(session.member, moduleId)) redirect(`/admin?acesso=negado&modulo=${moduleId}`);
  return session;
}

export async function assertWorkspaceModule(moduleId: WorkspaceModuleId) {
  const session = await getCurrentWorkspaceSession();
  if (!session || !canAccessModule(session.member, moduleId)) throw new WorkspaceAccessError();
  return session;
}

export async function assertWorkspaceWrite(moduleId: WorkspaceModuleId) {
  const session = await assertWorkspaceModule(moduleId);
  if (!canWriteWorkspace(session.member)) throw new WorkspaceAccessError("Perfil somente leitura não pode alterar dados.");
  return session;
}

export async function assertWorkspaceAdmin() {
  const session = await getCurrentWorkspaceSession();
  if (!session || session.member.accessLevel !== "admin") throw new WorkspaceAccessError("Apenas administradores podem executar esta ação.");
  return session;
}

export async function loginWorkspace(email: string, password: string) {
  await ensureWorkspaceAuthSchema();
  const normalizedEmail = email.trim().toLowerCase();
  const rows = await getSql().query(
    `SELECT m.id, m.name, c.password_hash, c.password_salt FROM workspace_members m
     INNER JOIN workspace_credentials c ON c.member_id = m.id
     WHERE LOWER(COALESCE(m.email, '')) = $1 AND m.active = TRUE LIMIT 1`,
    [normalizedEmail]
  ) as unknown as Array<{ id: number; name: string; password_hash: string; password_salt: string }>;
  const row = rows[0];
  if (!row) throw new Error("E-mail ou senha inválidos.");
  const computed = Buffer.from(passwordHash(password, row.password_salt), "hex");
  const stored = Buffer.from(row.password_hash, "hex");
  if (computed.length !== stored.length || !timingSafeEqual(computed, stored)) throw new Error("E-mail ou senha inválidos.");
  await createSession(Number(row.id));
  await recordWorkspaceAudit({ actorMemberId: Number(row.id), action: "auth.login", entityType: "member", entityId: row.id, summary: `${row.name} entrou no VITA OS.` });
  return Number(row.id);
}

export async function logoutWorkspace() {
  await ensureWorkspaceAuthSchema();
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  const session = token ? await getCurrentWorkspaceSession() : null;
  if (token) await getSql().query(`UPDATE workspace_sessions SET revoked_at = NOW() WHERE token_hash = $1`, [sha256(token)]);
  store.delete(SESSION_COOKIE);
  if (session) await recordWorkspaceAudit({ actorMemberId: session.member.id, action: "auth.logout", entityType: "member", entityId: session.member.id, summary: `${session.member.name} saiu do VITA OS.` });
}

export async function inspectWorkspaceInvite(token: string) {
  await ensureWorkspaceAuthSchema();
  if (!token) return null;
  const rows = await getSql().query(
    `SELECT i.id, i.member_id, i.expires_at, m.name, m.email, m.department, m.role
     FROM workspace_invites i INNER JOIN workspace_members m ON m.id = i.member_id
     WHERE i.token_hash = $1 AND i.used_at IS NULL AND i.revoked_at IS NULL AND i.expires_at > NOW() AND m.active = TRUE LIMIT 1`,
    [sha256(token)]
  ) as unknown as Array<{ id: number; member_id: number; expires_at: string | Date; name: string; email: string | null; department: string; role: string }>;
  return rows[0] ?? null;
}

export async function acceptWorkspaceInvite(token: string, password: string) {
  validatePassword(password);
  await ensureWorkspaceAuthSchema();
  const invite = await inspectWorkspaceInvite(token);
  if (!invite) throw new Error("Este link de acesso é inválido ou expirou.");
  const salt = randomBytes(16).toString("hex");
  const hash = passwordHash(password, salt);
  const rows = await getSql().query(
    `WITH valid AS (
       SELECT id, member_id FROM workspace_invites WHERE token_hash = $1 AND used_at IS NULL AND revoked_at IS NULL AND expires_at > NOW() LIMIT 1
     ), credential AS (
       INSERT INTO workspace_credentials (member_id, password_hash, password_salt)
       SELECT member_id, $2, $3 FROM valid
       ON CONFLICT (member_id) DO UPDATE SET password_hash = EXCLUDED.password_hash, password_salt = EXCLUDED.password_salt, password_set_at = NOW(), updated_at = NOW()
       RETURNING member_id
     )
     UPDATE workspace_invites i SET used_at = NOW() FROM credential c
     WHERE i.id = (SELECT id FROM valid) RETURNING c.member_id`,
    [sha256(token), hash, salt]
  ) as unknown as Array<{ member_id: number }>;
  const memberId = Number(rows[0]?.member_id ?? 0);
  if (!memberId) throw new Error("Não foi possível ativar o acesso.");
  await getSql().query(`UPDATE workspace_sessions SET revoked_at = NOW() WHERE member_id = $1 AND revoked_at IS NULL`, [memberId]);
  await createSession(memberId);
  const member = await getWorkspaceMember(memberId);
  await recordWorkspaceAudit({ actorMemberId: memberId, action: "auth.credential_set", entityType: "member", entityId: memberId, summary: `${member?.name ?? "Colaborador"} ativou o acesso ao VITA OS.` });
  return memberId;
}

export async function createWorkspaceInvite(memberId: number, createdByMemberId: number) {
  await ensureWorkspaceAuthSchema();
  const member = await getWorkspaceMember(memberId);
  if (!member || !member.active) throw new Error("Colaborador inválido ou inativo.");
  if (!member.email) throw new Error("Cadastre o e-mail do colaborador antes de gerar o acesso.");
  const token = randomBytes(32).toString("base64url");
  await getSql().query(`UPDATE workspace_invites SET revoked_at = NOW() WHERE member_id = $1 AND used_at IS NULL AND revoked_at IS NULL`, [memberId]);
  await getSql().query(
    `INSERT INTO workspace_invites (member_id, token_hash, source, created_by_member_id, expires_at)
     VALUES ($1, $2, 'admin_invite', $3, NOW() + INTERVAL '72 hours')`,
    [memberId, sha256(token), createdByMemberId]
  );
  await recordWorkspaceAudit({ actorMemberId: createdByMemberId, action: "member.invite_created", entityType: "member", entityId: memberId, summary: `Acesso de ${member.name} foi preparado.` });
  return token;
}

export async function getWorkspaceMemberAccessStates() {
  await ensureWorkspaceAuthSchema();
  const rows = await getSql().query(
    `SELECT m.id AS member_id,
            EXISTS(SELECT 1 FROM workspace_credentials c WHERE c.member_id = m.id) AS has_credential,
            (SELECT MAX(s.created_at) FROM workspace_sessions s WHERE s.member_id = m.id) AS last_login_at
     FROM workspace_members m`
  ) as unknown as Array<{ member_id: number; has_credential: boolean; last_login_at: string | Date | null }>;
  return rows.reduce<Record<string, { hasCredential: boolean; lastLoginAt: string | null }>>((acc, row) => {
    acc[String(row.member_id)] = { hasCredential: Boolean(row.has_credential), lastLoginAt: row.last_login_at ? (row.last_login_at instanceof Date ? row.last_login_at.toISOString() : String(row.last_login_at)) : null };
    return acc;
  }, {});
}
