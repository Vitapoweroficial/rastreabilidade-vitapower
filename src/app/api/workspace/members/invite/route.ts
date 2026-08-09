import { NextResponse } from "next/server";
import { assertWorkspaceAdmin, createWorkspaceInvite, WorkspaceAccessError } from "@/lib/workspace-auth";

export async function POST(request: Request) {
  try {
    const session = await assertWorkspaceAdmin();
    const body = await request.json() as { memberId?: number };
    const memberId = Number(body.memberId);
    if (!Number.isFinite(memberId) || memberId <= 0) return NextResponse.json({ ok: false, error: "Colaborador inválido." }, { status: 400 });
    const token = await createWorkspaceInvite(memberId, session.member.id);
    return NextResponse.json({ ok: true, path: `/acesso/${token}`, expiresInHours: 72 });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Não foi possível gerar o acesso." }, { status: error instanceof WorkspaceAccessError ? 403 : 400 });
  }
}
