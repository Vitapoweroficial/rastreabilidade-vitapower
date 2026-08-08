import { ensureSchema, getSql } from "@/lib/db";

export const workspaceModules = [
  { id: "dashboard", label: "Dashboard" },
  { id: "tarefas", label: "Tarefas" },
  { id: "clientes", label: "Clientes" },
  { id: "produtos", label: "Produtos" },
  { id: "engenharia", label: "Engenharia" },
  { id: "private_label", label: "Private Label" },
  { id: "lotes", label: "Lotes" },
  { id: "equipe", label: "Equipe" }
] as const;

export type WorkspaceModuleId = (typeof workspaceModules)[number]["id"];
export const workspaceAccessLevels = ["admin", "gestor", "membro", "leitura"] as const;
export type WorkspaceAccessLevel = (typeof workspaceAccessLevels)[number];

export type WorkspaceMember = {
  id: number;
  name: string;
  email: string | null;
  department: string;
  role: string;
  accessLevel: WorkspaceAccessLevel;
  permissions: WorkspaceModuleId[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

type MemberRow = {
  id: number;
  name: string;
  email: string | null;
  department: string;
  role: string;
  access_level: WorkspaceAccessLevel;
  permissions: WorkspaceModuleId[] | string | null;
  active: boolean;
  created_at: string | Date;
  updated_at: string | Date;
};

let schemaPromise: Promise<void> | null = null;

function iso(value: string | Date) {
  return value instanceof Date ? value.toISOString() : String(value);
}

function parsePermissions(value: MemberRow["permissions"]): WorkspaceModuleId[] {
  let parsed: unknown = value;
  if (typeof value === "string") {
    try { parsed = JSON.parse(value); } catch { parsed = []; }
  }
  if (!Array.isArray(parsed)) return [];
  const allowed = new Set(workspaceModules.map((item) => item.id));
  return parsed.filter((item): item is WorkspaceModuleId => typeof item === "string" && allowed.has(item as WorkspaceModuleId));
}

function mapMember(row: MemberRow): WorkspaceMember {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    department: row.department,
    role: row.role,
    accessLevel: workspaceAccessLevels.includes(row.access_level) ? row.access_level : "membro",
    permissions: parsePermissions(row.permissions),
    active: Boolean(row.active),
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at)
  };
}

export async function ensureWorkspaceMemberSchema() {
  if (!schemaPromise) {
    schemaPromise = (async () => {
      await ensureSchema();
      const sql = getSql();
      await sql.query(`
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
      await Promise.all([
        sql.query("CREATE INDEX IF NOT EXISTS idx_workspace_members_active ON workspace_members(active)"),
        sql.query("CREATE INDEX IF NOT EXISTS idx_workspace_members_department ON workspace_members(department)")
      ]);

      const seedMembers = [
        ["Andrew", "Direção", "CEO / Liderança geral", "admin", ["dashboard","tarefas","clientes","produtos","engenharia","private_label","lotes","equipe"]],
        ["Vitória", "Marketing e Projetos", "Gestão de projetos", "gestor", ["dashboard","tarefas","clientes","produtos","private_label"]],
        ["Harlem", "Marketplace", "Head de Marketplace", "gestor", ["dashboard","tarefas","clientes","produtos"]],
        ["Maria", "Operações", "Operacional", "membro", ["dashboard","tarefas","produtos","lotes"]],
        ["Gabriel", "Comercial", "Vendas", "gestor", ["dashboard","tarefas","clientes","private_label"]],
        ["Letícia", "CRM e Inside Sales", "CRM / Inside Sales", "membro", ["dashboard","tarefas","clientes","private_label"]],
        ["Bruno", "CRM e Inside Sales", "CRM / Inside Sales", "membro", ["dashboard","tarefas","clientes","private_label"]]
      ] as const;

      for (const [name, department, role, accessLevel, permissions] of seedMembers) {
        await sql.query(
          `INSERT INTO workspace_members (name, department, role, access_level, permissions)
           SELECT $1, $2, $3, $4, $5::jsonb
           WHERE NOT EXISTS (SELECT 1 FROM workspace_members WHERE LOWER(name) = LOWER($1))`,
          [name, department, role, accessLevel, JSON.stringify(permissions)]
        );
      }
    })().catch((error) => {
      schemaPromise = null;
      throw error;
    });
  }
  await schemaPromise;
}

export async function listWorkspaceMembers(options?: { activeOnly?: boolean }) {
  await ensureWorkspaceMemberSchema();
  const rows = await getSql().query(
    `SELECT id, name, email, department, role, access_level, permissions, active, created_at, updated_at
     FROM workspace_members
     ${options?.activeOnly ? "WHERE active = TRUE" : ""}
     ORDER BY active DESC, name ASC`
  ) as unknown as MemberRow[];
  return rows.map(mapMember);
}

export async function getWorkspaceMember(memberId: number) {
  await ensureWorkspaceMemberSchema();
  const rows = await getSql().query(
    `SELECT id, name, email, department, role, access_level, permissions, active, created_at, updated_at
     FROM workspace_members WHERE id = $1`,
    [memberId]
  ) as unknown as MemberRow[];
  return rows[0] ? mapMember(rows[0]) : null;
}

export async function createWorkspaceMember(input: {
  name: string;
  email?: string | null;
  department: string;
  role: string;
  accessLevel: WorkspaceAccessLevel;
  permissions: WorkspaceModuleId[];
}) {
  await ensureWorkspaceMemberSchema();
  const name = input.name.trim();
  const department = input.department.trim();
  const role = input.role.trim();
  const email = input.email?.trim().toLowerCase() || null;
  if (!name || !department || !role) throw new Error("Nome, área e função são obrigatórios.");
  const rows = await getSql().query(
    `INSERT INTO workspace_members (name, email, department, role, access_level, permissions)
     VALUES ($1, $2, $3, $4, $5, $6::jsonb)
     RETURNING id, name, email, department, role, access_level, permissions, active, created_at, updated_at`,
    [name, email, department, role, input.accessLevel, JSON.stringify(input.permissions)]
  ) as unknown as MemberRow[];
  return mapMember(rows[0]);
}

export async function updateWorkspaceMember(input: {
  id: number;
  name?: string;
  email?: string | null;
  department?: string;
  role?: string;
  accessLevel?: WorkspaceAccessLevel;
  permissions?: WorkspaceModuleId[];
  active?: boolean;
}) {
  await ensureWorkspaceMemberSchema();
  const current = await getWorkspaceMember(input.id);
  if (!current) throw new Error("Colaborador não encontrado.");
  const rows = await getSql().query(
    `UPDATE workspace_members SET
       name = $2,
       email = $3,
       department = $4,
       role = $5,
       access_level = $6,
       permissions = $7::jsonb,
       active = $8,
       updated_at = NOW()
     WHERE id = $1
     RETURNING id, name, email, department, role, access_level, permissions, active, created_at, updated_at`,
    [
      input.id,
      input.name?.trim() || current.name,
      input.email === undefined ? current.email : (input.email?.trim().toLowerCase() || null),
      input.department?.trim() || current.department,
      input.role?.trim() || current.role,
      input.accessLevel ?? current.accessLevel,
      JSON.stringify(input.permissions ?? current.permissions),
      input.active ?? current.active
    ]
  ) as unknown as MemberRow[];
  return mapMember(rows[0]);
}
