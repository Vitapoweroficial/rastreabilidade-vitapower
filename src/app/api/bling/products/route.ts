import { NextRequest, NextResponse } from "next/server";
import { blingGet } from "@/lib/bling";

export async function GET(request: NextRequest) {
  try {
    const data = await blingGet("/produtos", {
      pagina: request.nextUrl.searchParams.get("pagina") ?? 1,
      limite: request.nextUrl.searchParams.get("limite") ?? 20,
      criterio: request.nextUrl.searchParams.get("q") ?? undefined
    });

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao listar produtos." },
      { status: 500 }
    );
  }
}
