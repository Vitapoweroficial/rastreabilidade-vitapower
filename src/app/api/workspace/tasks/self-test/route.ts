import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getSql } from "@/lib/db";
import { createWorkspaceAlert, listWorkspaceAlerts, updateWorkspaceTask } from "@/lib/workspace-alerts";

export const dynamic = "force-dynamic";

export async function GET() {
  if (process.env.VERCEL_ENV !== "preview") {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  const token = randomUUID();
  let alertId: number | null = null;
  try {
    alertId = await createWorkspaceAlert({
      sourceKey: `task-smoke:${token}`,
      type: "private_label_briefing",
      audience: "Comercial + Engenharia",
      title: `Briefing Smoke ${token.slice(0, 8)}`,
      message: "Projeto teste · Whey 900g",
      href: "/admin/clientes/1",
      entityType: "private_label_briefing",
      entityId: 999999
    });
    if (!alertId) throw new Error("Não foi possível criar a tarefa de teste.");

    const created = (await listWorkspaceAlerts(100)).find((item) => item.id === alertId);
    if (!created) throw new Error("Tarefa criada não encontrada.");

    const due = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
    const assigned = await updateWorkspaceTask({
      alertId,
      assignee: "Gabriel",
      taskStatus: "em_andamento",
      dueAt: due
    });

    const waiting = await updateWorkspaceTask({ alertId, taskStatus: "aguardando_cliente" });
    const completed = await updateWorkspaceTask({ alertId, taskStatus: "concluido" });

    const ok = Boolean(
      created.taskStatus === "novo" && created.dueAt &&
      assigned.assignee === "Gabriel" && assigned.taskStatus === "em_andamento" && assigned.acceptedAt && assigned.readAt &&
      waiting.taskStatus === "aguardando_cliente" &&
      completed.taskStatus === "concluido" && completed.completedAt
    );

    return NextResponse.json({
      ok,
      defaultDeadline: Boolean(created.dueAt),
      assigned: assigned.assignee === "Gabriel",
      inProgress: assigned.taskStatus === "em_andamento",
      waitingClient: waiting.taskStatus === "aguardando_cliente",
      completed: completed.taskStatus === "concluido",
      tracksAcceptedAt: Boolean(assigned.acceptedAt),
      tracksCompletedAt: Boolean(completed.completedAt),
      directDnaLink: created.href === "/admin/clientes/1"
    });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "task smoke failed" }, { status: 500 });
  } finally {
    if (alertId) await getSql().query(`DELETE FROM workspace_alerts WHERE id = $1`, [alertId]).catch(() => undefined);
  }
}
