import { NextRequest, NextResponse } from "next/server";
import { exchangeBlingCode } from "@/lib/bling";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  if (!code) return NextResponse.redirect(new URL("/test/bling?error=missing_code", request.url));
  try { await exchangeBlingCode(code); return NextResponse.redirect(new URL("/test/bling?connected=1", request.url)); }
  catch (error) { return NextResponse.redirect(new URL(`/test/bling?error=${encodeURIComponent(error instanceof Error ? error.message : "oauth_error")}`, request.url)); }
}
