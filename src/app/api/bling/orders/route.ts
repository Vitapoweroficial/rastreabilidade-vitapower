import { NextRequest, NextResponse } from "next/server";
import { blingGet } from "@/lib/bling";

export async function GET(request: NextRequest) {
  try {
    const data = await blingGet("/pedidos/vendas", {
      pagina: request.nextUrl.searchParams.get("pagina") ?? 1,
      limite: request.nextUrl.searchParams.get("limite") ?? 20,
      situacao: request.nextUrl.searchParams.get("situacao") ?? undefined
    });

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao consultar pedidos." },
      { status: 500 }
    );
  }
}
