import { NextResponse } from "next/server";
import { submitPrivateLabelBriefing } from "@/lib/private-label-briefings";

export const dynamic = "force-dynamic";

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

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível enviar o briefing.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
