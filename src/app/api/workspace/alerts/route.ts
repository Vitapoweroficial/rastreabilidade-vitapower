import { NextResponse } from "next/server";
import { markAllWorkspaceAlertsRead, markWorkspaceAlertRead } from "@/lib/workspace-alerts";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request) {
  try {
    const body = await request.json() as { alertId?: number; all?: boolean };
    if (body.all) {
      await markAllWorkspaceAlertsRead();
      return NextResponse.json({ ok: true });
    }

    const alertId = Number(body.alertId);
    if (!Number.isFinite(alertId) || alertId <= 0) {
      return NextResponse.json({ ok: false, error: "Alerta inválido." }, { status: 400 });
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
