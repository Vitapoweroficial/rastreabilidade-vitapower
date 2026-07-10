import { NextRequest, NextResponse } from "next/server";
import { blingGet } from "@/lib/bling";

export async function GET(request: NextRequest) {
  try {
    const productId = request.nextUrl.searchParams.get("produtoId");
    const data = await blingGet(productId ? `/estoques/saldos/${productId}` : "/estoques/saldos", {
      pagina: request.nextUrl.searchParams.get("pagina") ?? 1,
      limite: request.nextUrl.searchParams.get("limite") ?? 20
    });

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao consultar estoque." },
      { status: 500 }
    );
  }
}
