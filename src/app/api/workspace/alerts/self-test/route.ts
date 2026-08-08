import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getSql } from "@/lib/db";
import { submitPrivateLabelBriefing } from "@/lib/private-label-briefings";
import { createWorkspaceAlert, listWorkspaceAlerts, markWorkspaceAlertRead } from "@/lib/workspace-alerts";

export const dynamic = "force-dynamic";

export async function GET() {
  if (process.env.VERCEL_ENV !== "preview") {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  const token = randomUUID();
  const brand = `Alert Smoke ${token.slice(0, 8)}`;
  let result: Awaited<ReturnType<typeof submitPrivateLabelBriefing>> | null = null;
  let alertId: number | null = null;

  try {
    result = await submitPrivateLabelBriefing({
      submissionKey: token,
      source: "preview_alert_self_test",
      answers: {
        companyName: `${brand} LTDA`,
        tradeName: brand,
        contactName: "Teste automatizado",
        email: `alert-${token}@example.invalid`,
        projectName: "Whey Private Label",
        productName: "Whey 900g",
        category: "Proteína"
      }
    });

    alertId = await createWorkspaceAlert({
      sourceKey: `private-label-briefing:${result.briefingId}`,
      type: "private_label_briefing",
      audience: "Comercial + Engenharia",
      title: `${brand} enviou um novo briefing`,
      message: "Whey Private Label · Whey 900g. O cliente, produto e projeto já estão vinculados no VITA OS.",
      href: `/admin/clientes/${result.clientId}`,
      entityType: "private_label_briefing",
      entityId: result.briefingId
    });

    const alertsBefore = await listWorkspaceAlerts(50);
    const created = alertsBefore.find((alert) => alert.id === alertId);
    if (!created) throw new Error("Alerta não encontrado após criação.");

    await markWorkspaceAlertRead(created.id);
    const alertsAfter = await listWorkspaceAlerts(50);
    const read = alertsAfter.find((alert) => alert.id === created.id);

    const ok = Boolean(
      created.href === `/admin/clientes/${result.clientId}` &&
      created.audience === "Comercial + Engenharia" &&
      created.title.includes(brand) &&
      read?.readAt
    );

    return NextResponse.json({
      ok,
      alertCreated: Boolean(created),
      directDnaLink: created.href === `/admin/clientes/${result.clientId}`,
      correctAudience: created.audience === "Comercial + Engenharia",
      markedRead: Boolean(read?.readAt)
    });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "alert self-test failed" }, { status: 500 });
  } finally {
    const sql = getSql();
    if (alertId) await sql.query(`DELETE FROM workspace_alerts WHERE id = $1`, [alertId]).catch(() => undefined);
    if (result) {
      await sql.query(`DELETE FROM private_label_briefings WHERE id = $1`, [result.briefingId]).catch(() => undefined);
      await sql.query(`DELETE FROM engineering_projects WHERE id = $1`, [result.projectId]).catch(() => undefined);
      if (result.productId) await sql.query(`DELETE FROM products WHERE id = $1`, [result.productId]).catch(() => undefined);
      await sql.query(`DELETE FROM clients WHERE id = $1`, [result.clientId]).catch(() => undefined);
    }
  }
}
