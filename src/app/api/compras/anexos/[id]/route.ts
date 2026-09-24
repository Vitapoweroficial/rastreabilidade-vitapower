import { NextResponse } from "next/server";
import { getOfferAttachment } from "@/lib/procurement";
import { assertWorkspaceModule } from "@/lib/workspace-auth";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await assertWorkspaceModule("compras");
    const { id } = await context.params;
    const attachment = await getOfferAttachment(Number(id));
    if (!attachment) return NextResponse.json({ error: "Anexo não encontrado." }, { status: 404 });

    const safeName = attachment.fileName.replace(/[\r\n"\\]/g, "_");
    return new NextResponse(Buffer.from(attachment.contentBase64, "base64"), {
      headers: {
        "content-type": attachment.contentType,
        "content-length": String(attachment.sizeBytes),
        "content-disposition": `attachment; filename="${safeName}"`,
        "cache-control": "private, no-store",
        "x-content-type-options": "nosniff"
      }
    });
  } catch {
    return NextResponse.json({ error: "Acesso não autorizado." }, { status: 401 });
  }
}
