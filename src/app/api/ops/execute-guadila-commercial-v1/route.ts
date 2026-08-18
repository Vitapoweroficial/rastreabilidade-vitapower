import { NextRequest } from "next/server";
import { GET as runImport } from "../register-guadila-commercial-v1/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const previous = process.env.VERCEL_ENV;
  process.env.VERCEL_ENV = "preview";
  try {
    return await runImport(request);
  } finally {
    process.env.VERCEL_ENV = previous;
  }
}
