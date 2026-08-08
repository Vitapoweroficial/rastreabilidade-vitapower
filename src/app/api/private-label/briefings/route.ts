import { NextResponse } from "next/server";
import { submitPrivateLabelBriefing } from "@/lib/private-label-briefings";
import { createWorkspaceAlert } from "@/lib/workspace-alerts";

export const dynamic = "force-dynamic";

function answerText(answers: Record<string, string | boolean>, key: string) {
  const value = answers[key];
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  try {
    const payload = await request.json() as {
      submissionKey?: string;
      answers?: Record<string, string | boolean>;
      source?: string;
    };

    if (!payload.submissionKey || !payload.answers) {
      return NextResponse.json({ ok: false, error: "Briefing incompleto." }, { status: 400 });
    }

    const result = await submitPrivateLabelBriefing({
      submissionKey: payload.submissionKey,
      answers: payload.answers,
      source: payload.source ?? "public_form"
    });

    const client = answerText(payload.answers, "tradeName") || answerText(payload.answers, "companyName") || "Novo cliente";
    const product = answerText(payload.answers, "productName") || answerText(payload.answers, "category") || "Produto em definição";
    const project = answerText(payload.answers, "projectName") || product;

    await createWorkspaceAlert({
      sourceKey: `private-label-briefing:${result.briefingId}`,
      type: "private_label_briefing",
      audience: "Comercial + Engenharia",
      title: `${client} enviou um novo briefing`,
      message: `${project} · ${product}. O cliente, produto e projeto já estão vinculados no VITA OS.`,
      href: `/admin/clientes/${result.clientId}`,
      entityType: "private_label_briefing",
      entityId: result.briefingId
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível enviar o briefing.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
