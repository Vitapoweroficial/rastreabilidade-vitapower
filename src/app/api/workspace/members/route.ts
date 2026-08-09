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
import { assertWorkspaceAdmin, assertWorkspaceModule, WorkspaceAccessError } from "@/lib/workspace-auth";
import { recordWorkspaceAudit } from "@/lib/workspace-audit";

export const dynamic = "force-dynamic";
const allowedModules = new Set(workspaceModules.map((item) => item.id));

function parsePermissions(value: unknown): WorkspaceModuleId[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is WorkspaceModuleId => typeof item === "string" && allowedModules.has(item as WorkspaceModuleId));
}
function parseAccessLevel(value: unknown): WorkspaceAccessLevel {
  return workspaceAccessLevels.includes(value as WorkspaceAccessLevel) ? value as WorkspaceAccessLevel : "membro";
}
function errorResponse(error: unknown, fallback: string) {
  const status = error instanceof WorkspaceAccessError ? 403 : 400;
  return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : fallback }, { status });
}

export async function GET() {
  try {
    await assertWorkspaceModule("equipe");
    return NextResponse.json({ ok: true, members: await listWorkspaceMembers() });
  } catch (error) { return errorResponse(error, "Não foi possível carregar a equipe."); }
}

export async function POST(request: Request) {
  try {
    const session = await assertWorkspaceAdmin();
    const body = await request.json() as Record<string, unknown>;
    const member = await createWorkspaceMember({
      name: String(body.name ?? ""), email: body.email ? String(body.email) : null,
      department: String(body.department ?? ""), role: String(body.role ?? ""),
      accessLevel: parseAccessLevel(body.accessLevel), permissions: parsePermissions(body.permissions)
    });
    await recordWorkspaceAudit({ actorMemberId: session.member.id, action: "member.created", entityType: "member", entityId: member.id, summary: `${member.name} foi cadastrado na equipe.`, metadata: { department: member.department, accessLevel: member.accessLevel } });
    return NextResponse.json({ ok: true, member });
  } catch (error) { return errorResponse(error, "Não foi possível cadastrar o colaborador."); }
}

export async function PATCH(request: Request) {
  try {
    const session = await assertWorkspaceAdmin();
    const body = await request.json() as Record<string, unknown>;
    const id = Number(body.id);
    if (!Number.isFinite(id) || id <= 0) return NextResponse.json({ ok: false, error: "Colaborador inválido." }, { status: 400 });
    const member = await updateWorkspaceMember({
      id, name: body.name === undefined ? undefined : String(body.name),
      email: body.email === undefined ? undefined : (body.email ? String(body.email) : null),
      department: body.department === undefined ? undefined : String(body.department),
      role: body.role === undefined ? undefined : String(body.role),
      accessLevel: body.accessLevel === undefined ? undefined : parseAccessLevel(body.accessLevel),
      permissions: body.permissions === undefined ? undefined : parsePermissions(body.permissions),
      active: body.active === undefined ? undefined : Boolean(body.active)
    });
    await recordWorkspaceAudit({ actorMemberId: session.member.id, action: "member.updated", entityType: "member", entityId: member.id, summary: `Perfil de ${member.name} foi atualizado.`, metadata: { accessLevel: member.accessLevel, permissions: member.permissions, active: member.active } });
    return NextResponse.json({ ok: true, member });
  } catch (error) { return errorResponse(error, "Não foi possível atualizar o colaborador."); }
}
