import { NextResponse } from "next/server";
import {
  markAllWorkspaceAlertsRead,
  markWorkspaceAlertRead,
  updateWorkspaceTask,
  workspaceTaskStatuses
} from "@/lib/workspace-alerts";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request) {
  try {
    const body = await request.json() as {
      alertId?: number;
      all?: boolean;
      action?: "read" | "task";
      taskStatus?: string;
      assignee?: string | null;
      dueAt?: string | null;
    };

    if (body.all) {
      await markAllWorkspaceAlertsRead();
      return NextResponse.json({ ok: true });
    }

    const alertId = Number(body.alertId);
    if (!Number.isFinite(alertId) || alertId <= 0) {
      return NextResponse.json({ ok: false, error: "Alerta inválido." }, { status: 400 });
    }

    if (body.action === "task") {
      if (body.taskStatus && !workspaceTaskStatuses.includes(body.taskStatus as (typeof workspaceTaskStatuses)[number])) {
        return NextResponse.json({ ok: false, error: "Status da tarefa inválido." }, { status: 400 });
      }
      const task = await updateWorkspaceTask({
        alertId,
        taskStatus: body.taskStatus as (typeof workspaceTaskStatuses)[number] | undefined,
        assignee: body.assignee,
        dueAt: body.dueAt
      });
      return NextResponse.json({ ok: true, task });
    }

    await markWorkspaceAlertRead(alertId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Não foi possível atualizar o alerta." },
      { status: 500 }
    );
  }
}
