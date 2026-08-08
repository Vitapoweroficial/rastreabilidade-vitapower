import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getSql } from "@/lib/db";
import { submitPrivateLabelBriefing } from "@/lib/private-label-briefings";

export const dynamic = "force-dynamic";

export async function GET() {
  if (process.env.VERCEL_ENV !== "preview") {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  const token = randomUUID();
  const email = `smoke-${token}@example.invalid`;
  let result: Awaited<ReturnType<typeof submitPrivateLabelBriefing>> | null = null;

  try {
    result = await submitPrivateLabelBriefing({
      submissionKey: token,
      source: "preview_self_test",
      answers: {
        companyName: `Smoke Test ${token.slice(0, 8)}`,
        tradeName: `Smoke ${token.slice(0, 8)}`,
        contactName: "Teste automatizado",
        email,
        projectName: "Projeto de integração",
        productName: "Produto de integração",
        category: "Proteína",
        format: "Pó",
        primaryPackaging: "Pouch",
        quantity: "1000",
        website: "https://example.invalid",
        audienceGender: "Misto"
      }
    });

    const duplicate = await submitPrivateLabelBriefing({
      submissionKey: token,
      source: "preview_self_test",
      answers: {
        companyName: `Smoke Test ${token.slice(0, 8)}`,
        tradeName: `Smoke ${token.slice(0, 8)}`,
        contactName: "Teste automatizado",
        email,
        projectName: "Projeto de integração",
        productName: "Produto de integração"
      }
    });

    const sql = getSql();
    const [briefing] = await sql.query(
      `SELECT client_id, project_id, product_id, status, answers->>'website' AS website
       FROM private_label_briefings WHERE id = $1`,
      [result.briefingId]
    ) as unknown as { client_id: number; project_id: number; product_id: number; status: string; website: string }[];

    const ok = Boolean(
      briefing && briefing.client_id === result.clientId && briefing.project_id === result.projectId &&
      briefing.product_id === result.productId && briefing.status === "submitted" &&
      briefing.website === "https://example.invalid" && duplicate.alreadySubmitted
    );

    return NextResponse.json({ ok, idempotent: duplicate.alreadySubmitted, linked: Boolean(briefing?.client_id && briefing?.project_id && briefing?.product_id), preservesAnswers: briefing?.website === "https://example.invalid" });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "self-test failed" }, { status: 500 });
  } finally {
    if (result) {
      const sql = getSql();
      await sql.query(`DELETE FROM private_label_briefings WHERE id = $1`, [result.briefingId]).catch(() => undefined);
      await sql.query(`DELETE FROM engineering_projects WHERE id = $1`, [result.projectId]).catch(() => undefined);
      if (result.productId) await sql.query(`DELETE FROM products WHERE id = $1`, [result.productId]).catch(() => undefined);
      await sql.query(`DELETE FROM clients WHERE id = $1`, [result.clientId]).catch(() => undefined);
    }
  }
}
