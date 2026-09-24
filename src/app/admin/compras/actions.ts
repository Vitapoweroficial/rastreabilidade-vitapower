"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { assertWorkspaceWrite } from "@/lib/workspace-auth";
import { recordWorkspaceAudit } from "@/lib/workspace-audit";
import {
  addSupplierPerformance,
  approveSupplierOffer,
  createProcurementQuote,
  createProcurementSupplier,
  createSupplierOffer,
  markPurchaseCompleted,
  procurementStatuses,
  saveOfferAttachment,
  updateProcurementQuoteStatus,
  type ProcurementItemType,
  type ProcurementStatus
} from "@/lib/procurement";

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function optionalText(formData: FormData, key: string) {
  return text(formData, key) || null;
}

function numberValue(formData: FormData, key: string) {
  const value = Number(formData.get(key) ?? 0);
  return Number.isFinite(value) ? value : 0;
}

function optionalNumber(formData: FormData, key: string) {
  const raw = text(formData, key);
  if (!raw) return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

function revalidatePurchasing() {
  revalidatePath("/admin");
  revalidatePath("/admin/compras");
  revalidatePath("/admin/engenharia");
}

export async function createProcurementQuoteAction(formData: FormData) {
  const session = await assertWorkspaceWrite("compras");
  const [itemTypeRaw, itemIdRaw] = text(formData, "item").split(":");
  const itemType = itemTypeRaw as ProcurementItemType;
  const itemId = Number(itemIdRaw);
  if (!(["raw_material", "packaging"] as string[]).includes(itemType) || !Number.isInteger(itemId)) {
    throw new Error("Selecione um item válido.");
  }

  const title = text(formData, "title");
  const quoteId = await createProcurementQuote({
    title,
    itemType,
    itemId,
    requestedQuantity: numberValue(formData, "requestedQuantity"),
    normalizedUnit: itemType === "raw_material" ? "kg" : "un",
    priority: (text(formData, "priority") || "Normal") as "Baixa" | "Normal" | "Alta" | "Urgente",
    requiredBy: optionalText(formData, "requiredBy"),
    source: text(formData, "source") === "pcp" ? "pcp" : "manual",
    pcpReference: optionalText(formData, "pcpReference"),
    notes: optionalText(formData, "notes"),
    createdByMemberId: session.member.id
  });
  await recordWorkspaceAudit({ actorMemberId: session.member.id, action: "procurement.quote_created", entityType: "procurement_quote", entityId: quoteId, summary: `${session.member.name} abriu a cotação ${title}.` });
  revalidatePurchasing();
  redirect(`/admin/compras?cotacao=${quoteId}`);
}

export async function createProcurementSupplierAction(formData: FormData) {
  const session = await assertWorkspaceWrite("compras");
  const name = text(formData, "name");
  const supplierId = await createProcurementSupplier({
    name,
    contactName: optionalText(formData, "contactName"),
    email: optionalText(formData, "email"),
    phone: optionalText(formData, "phone"),
    category: optionalText(formData, "category"),
    document: optionalText(formData, "document"),
    website: optionalText(formData, "website"),
    notes: optionalText(formData, "notes")
  });
  await recordWorkspaceAudit({ actorMemberId: session.member.id, action: "procurement.supplier_created", entityType: "supplier", entityId: supplierId, summary: `${session.member.name} cadastrou o fornecedor ${name} em Compras.` });
  revalidatePurchasing();
}

export async function createSupplierOfferAction(formData: FormData) {
  const session = await assertWorkspaceWrite("compras");
  const quoteId = numberValue(formData, "quoteId");
  const offerId = await createSupplierOffer({
    quoteId,
    supplierId: numberValue(formData, "supplierId"),
    reference: optionalText(formData, "reference"),
    quotedQuantity: numberValue(formData, "quotedQuantity"),
    purchaseUnit: text(formData, "purchaseUnit"),
    unitsPerPurchaseUnit: numberValue(formData, "unitsPerPurchaseUnit") || 1,
    initialUnitPrice: optionalNumber(formData, "initialUnitPrice"),
    unitPrice: numberValue(formData, "unitPrice"),
    freightCost: optionalNumber(formData, "freightCost"),
    taxPercent: numberValue(formData, "taxPercent"),
    taxAmount: numberValue(formData, "taxAmount"),
    otherCost: numberValue(formData, "otherCost"),
    discountAmount: numberValue(formData, "discountAmount"),
    moq: numberValue(formData, "moq"),
    paymentTerms: optionalText(formData, "paymentTerms"),
    leadTimeDays: numberValue(formData, "leadTimeDays"),
    quoteDate: text(formData, "quoteDate"),
    validUntil: optionalText(formData, "validUntil"),
    manufacturer: optionalText(formData, "manufacturer"),
    distributor: optionalText(formData, "distributor"),
    concentrationPurity: optionalText(formData, "concentrationPurity"),
    origin: optionalText(formData, "origin"),
    minimumShelfLife: optionalText(formData, "minimumShelfLife"),
    notes: optionalText(formData, "notes"),
    createdByMemberId: session.member.id
  });

  const attachment = formData.get("attachment");
  if (attachment instanceof File && attachment.size > 0) {
    if (attachment.size > 5 * 1024 * 1024) throw new Error("O anexo deve ter no máximo 5 MB.");
    const allowed = new Set(["application/pdf", "image/png", "image/jpeg", "image/webp", "text/plain", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]);
    if (!allowed.has(attachment.type)) throw new Error("Formato de anexo não permitido. Use PDF, imagem, TXT ou DOCX.");
    const contentBase64 = Buffer.from(await attachment.arrayBuffer()).toString("base64");
    await saveOfferAttachment({ offerId, fileName: attachment.name, contentType: attachment.type, sizeBytes: attachment.size, contentBase64, memberId: session.member.id });
  }

  await recordWorkspaceAudit({ actorMemberId: session.member.id, action: "procurement.offer_received", entityType: "procurement_offer", entityId: offerId, summary: `${session.member.name} registrou uma proposta na cotação #${quoteId}.` });
  revalidatePurchasing();
  redirect(`/admin/compras?cotacao=${quoteId}`);
}

export async function updateProcurementQuoteStatusAction(formData: FormData) {
  const session = await assertWorkspaceWrite("compras");
  const quoteId = numberValue(formData, "quoteId");
  const status = text(formData, "status") as ProcurementStatus;
  if (!procurementStatuses.includes(status)) throw new Error("Status inválido.");
  await updateProcurementQuoteStatus(quoteId, status);
  await recordWorkspaceAudit({ actorMemberId: session.member.id, action: "procurement.status_changed", entityType: "procurement_quote", entityId: quoteId, summary: `${session.member.name} alterou a cotação #${quoteId} para ${status}.` });
  revalidatePurchasing();
}

export async function approveSupplierOfferAction(formData: FormData) {
  const session = await assertWorkspaceWrite("compras");
  const quoteId = numberValue(formData, "quoteId");
  const offerId = numberValue(formData, "offerId");
  await approveSupplierOffer(quoteId, offerId, session.member.id);
  await recordWorkspaceAudit({ actorMemberId: session.member.id, action: "procurement.offer_approved", entityType: "procurement_quote", entityId: quoteId, summary: `${session.member.name} aprovou a proposta #${offerId} na cotação #${quoteId}.` });
  revalidatePurchasing();
}

export async function markPurchaseCompletedAction(formData: FormData) {
  const session = await assertWorkspaceWrite("compras");
  const quoteId = numberValue(formData, "quoteId");
  await markPurchaseCompleted({ quoteId, purchaseReference: optionalText(formData, "purchaseReference"), blingPurchaseOrderId: optionalText(formData, "blingPurchaseOrderId") });
  await recordWorkspaceAudit({ actorMemberId: session.member.id, action: "procurement.purchase_completed", entityType: "procurement_quote", entityId: quoteId, summary: `${session.member.name} marcou a compra da cotação #${quoteId} como realizada.` });
  revalidatePurchasing();
}

export async function addSupplierPerformanceAction(formData: FormData) {
  const session = await assertWorkspaceWrite("compras");
  const supplierId = numberValue(formData, "supplierId");
  await addSupplierPerformance({
    supplierId,
    purchaseOrderId: optionalNumber(formData, "purchaseOrderId"),
    qualityScore: numberValue(formData, "qualityScore"),
    deliveryScore: numberValue(formData, "deliveryScore"),
    commercialScore: numberValue(formData, "commercialScore"),
    deliveredOnTime: text(formData, "deliveredOnTime") === "sim" ? true : text(formData, "deliveredOnTime") === "nao" ? false : null,
    nonconformityCount: numberValue(formData, "nonconformityCount"),
    notes: optionalText(formData, "notes"),
    memberId: session.member.id
  });
  await recordWorkspaceAudit({ actorMemberId: session.member.id, action: "procurement.supplier_evaluated", entityType: "supplier", entityId: supplierId, summary: `${session.member.name} avaliou o desempenho do fornecedor #${supplierId}.` });
  revalidatePurchasing();
}
