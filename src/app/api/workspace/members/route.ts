import { NextResponse } from "next/server";
import {
  createWorkspaceMember,
  listWorkspaceMembers,
  updateWorkspaceMember,
  workspaceAccessLevels,
  workspaceModules,
  type WorkspaceAccessLevel,
  type WorkspaceModuleId
} from "@/lib/workspace-members";

export const dynamic = "force-dynamic";

const allowedModules = new Set(workspaceModules.map((item) => item.id));

function parsePermissions(value: unknown): WorkspaceModuleId[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is WorkspaceModuleId => typeof item === "string" && allowedModules.has(item as WorkspaceModuleId));
}

function parseAccessLevel(value: unknown): WorkspaceAccessLevel {
  return workspaceAccessLevels.includes(value as WorkspaceAccessLevel) ? value as WorkspaceAccessLevel : "membro";
}

export async function GET() {
  try {
    return NextResponse.json({ ok: true, members: await listWorkspaceMembers() });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Não foi possível carregar a equipe." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as Record<string, unknown>;
    const member = await createWorkspaceMember({
      name: String(body.name ?? ""),
      email: body.email ? String(body.email) : null,
      department: String(body.department ?? ""),
      role: String(body.role ?? ""),
      accessLevel: parseAccessLevel(body.accessLevel),
      permissions: parsePermissions(body.permissions)
    });
    return NextResponse.json({ ok: true, member });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Não foi possível cadastrar o colaborador." }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json() as Record<string, unknown>;
    const id = Number(body.id);
    if (!Number.isFinite(id) || id <= 0) return NextResponse.json({ ok: false, error: "Colaborador inválido." }, { status: 400 });
    const member = await updateWorkspaceMember({
      id,
      name: body.name === undefined ? undefined : String(body.name),
      email: body.email === undefined ? undefined : (body.email ? String(body.email) : null),
      department: body.department === undefined ? undefined : String(body.department),
      role: body.role === undefined ? undefined : String(body.role),
      accessLevel: body.accessLevel === undefined ? undefined : parseAccessLevel(body.accessLevel),
      permissions: body.permissions === undefined ? undefined : parsePermissions(body.permissions),
      active: body.active === undefined ? undefined : Boolean(body.active)
    });
    return NextResponse.json({ ok: true, member });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Não foi possível atualizar o colaborador." }, { status: 400 });
  }
}
