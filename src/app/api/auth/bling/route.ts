import { NextResponse } from "next/server";
import { getBlingAuthorizationUrl } from "@/lib/bling";

export async function GET() {
  try { return NextResponse.redirect(getBlingAuthorizationUrl()); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Erro ao iniciar OAuth do Bling." }, { status: 500 }); }
}
