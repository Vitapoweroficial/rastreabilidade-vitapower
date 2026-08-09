import { NextResponse } from "next/server";
import { getWorkspaceTaskOwnership, markAllWorkspaceAlertsRead, markWorkspaceAlertRead, updateWorkspaceTask, workspaceTaskStatuses } from "@/lib/workspace-alerts";
import { assertWorkspaceWrite, WorkspaceAccessError } from "@/lib/workspace-auth";
import { recordWorkspaceAudit } from "@/lib/workspace-audit";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request) {
  try {
    const session = await assertWorkspaceWrite("tarefas");
    const canManageAll = session.member.accessLevel === "admin" || session.member.accessLevel === "gestor";
    const body = await request.json() as { alertId?: number; all?: boolean; action?: "read" | "task"; taskStatus?: string; assignee?: string | null; assigneeMemberId?: number | null; dueAt?: string | null };
    if (body.all) {
      await markAllWorkspaceAlertsRead(session.member.id, canManageAll);
      await recordWorkspaceAudit({ actorMemberId: session.member.id, action: "alert.read_all", entityType: "alert", summary: `${session.member.name} marcou os alertas visíveis como vistos.` });
      return NextResponse.json({ ok: true });
    }
    const alertId = Number(body.alertId);
    if (!Number.isFinite(alertId) || alertId <= 0) return NextResponse.json({ ok: false, error: "Alerta inválido." }, { status: 400 });
    const ownership = await getWorkspaceTaskOwnership(alertId);
    if (!ownership) return NextResponse.json({ ok: false, error: "Tarefa não encontrada." }, { status: 404 });
    if (!canManageAll && ownership.assigneeMemberId !== session.member.id) throw new WorkspaceAccessError("Esta tarefa não está atribuída a você.");

    if (body.action === "task") {
      if (body.taskStatus && !workspaceTaskStatuses.includes(body.taskStatus as (typeof workspaceTaskStatuses)[number])) return NextResponse.json({ ok: false, error: "Status da tarefa inválido." }, { status: 400 });
      if (!canManageAll && body.assigneeMemberId !== undefined && Number(body.assigneeMemberId) !== session.member.id) throw new WorkspaceAccessError("Somente gestores podem reatribuir tarefas.");
      const task = await updateWorkspaceTask({ alertId, taskStatus: body.taskStatus as (typeof workspaceTaskStatuses)[number] | undefined, assignee: body.assignee, assigneeMemberId: body.assigneeMemberId === undefined ? undefined : (body.assigneeMemberId === null ? null : Number(body.assigneeMemberId)), dueAt: body.dueAt });
      await recordWorkspaceAudit({ actorMemberId: session.member.id, action: "task.updated", entityType: "workspace_alert", entityId: alertId, summary: `${session.member.name} atualizou a tarefa “${task.title}”.`, metadata: { status: task.taskStatus, assigneeMemberId: task.assigneeMemberId, dueAt: task.dueAt } });
      return NextResponse.json({ ok: true, task });
    }
    await markWorkspaceAlertRead(alertId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Não foi possível atualizar o alerta." }, { status: error instanceof WorkspaceAccessError ? 403 : 500 });
  }
}
