import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";
import { getPublicLotByCode } from "@/lib/repository";

type RouteContext = {
  params: Promise<{
    code: string;
  }>;
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, { params }: RouteContext) {
  const { code } = await params;
  const lot = getPublicLotByCode(code);

  if (!lot) {
    return NextResponse.json({ error: "Lote nao encontrado" }, { status: 404 });
  }

  const origin = process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin;
  const targetUrl = new URL(`/lote/${encodeURIComponent(lot.code)}`, origin).toString();
  const svg = await QRCode.toString(targetUrl, {
    type: "svg",
    width: 512,
    margin: 1,
    errorCorrectionLevel: "M",
    color: {
      dark: "#184c38",
      light: "#ffffff"
    }
  });

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}
