"use server";

import { revalidatePath } from "next/cache";
import { assertWorkspaceWrite } from "@/lib/workspace-auth";
import { recordWorkspaceAudit } from "@/lib/workspace-audit";
import { createAdvancedPricingFromFormula, createAdvancedProposalFromPricing } from "@/lib/private-label-enterprise";
import {
  addFormulaItem,
  addFormulaPackagingItem,
  approveEngineeringFormula,
  createClient,
  createEngineeringFormula,
  createEngineeringProject,
  createEngineeringSupplier,
  createLot,
  createPackagingMaterial,
  createProduct,
  createRawMaterial,
  duplicateEngineeringFormula
} from "@/lib/repository";
import type { LotStatus } from "@/lib/types";

function text(formData: FormData, key: string) { return String(formData.get(key) ?? "").trim(); }
function nullableText(formData: FormData, key: string) { const value = text(formData, key); return value || null; }
function numberValue(formData: FormData, key: string) { return Number(formData.get(key) ?? 0); }

export async function createClientAction(formData: FormData) {
  const session = await assertWorkspaceWrite("clientes");
  const brandName = text(formData, "brandName");
  await createClient({ brandName, legalName: text(formData, "legalName"), taxId: nullableText(formData, "taxId"), contactName: nullableText(formData, "contactName"), email: nullableText(formData, "email"), phone: nullableText(formData, "phone"), active: formData.get("active") === "on" });
  await recordWorkspaceAudit({ actorMemberId: session.member.id, action: "client.created", entityType: "client", summary: `${session.member.name} cadastrou o cliente ${brandName}.` });
  revalidatePath("/admin"); revalidatePath("/admin/clientes");
}

export async function createProductAction(formData: FormData) {
  const session = await assertWorkspaceWrite("produtos");
  const name = text(formData, "name");
  await createProduct({ clientId: numberValue(formData, "clientId"), sku: text(formData, "sku"), name, category: nullableText(formData, "category"), description: nullableText(formData, "description"), formulaVersion: nullableText(formData, "formulaVersion"), active: formData.get("active") === "on" });
  await recordWorkspaceAudit({ actorMemberId: session.member.id, action: "product.created", entityType: "product", summary: `${session.member.name} cadastrou o produto ${name}.` });
  revalidatePath("/admin"); revalidatePath("/admin/produtos");
}

export async function createLotAction(formData: FormData) {
  const session = await assertWorkspaceWrite("lotes");
  const code = text(formData, "code");
  await createLot({ productId: numberValue(formData, "productId"), code, manufacturingDate: text(formData, "manufacturingDate"), expirationDate: text(formData, "expirationDate"), quantity: numberValue(formData, "quantity"), unit: nullableText(formData, "unit") ?? "un", status: text(formData, "status") as LotStatus, origin: nullableText(formData, "origin"), analysisSummary: nullableText(formData, "analysisSummary"), traceabilityNotes: nullableText(formData, "traceabilityNotes") });
  await recordWorkspaceAudit({ actorMemberId: session.member.id, action: "lot.created", entityType: "lot", summary: `${session.member.name} cadastrou o lote ${code}.` });
  revalidatePath("/admin"); revalidatePath("/admin/lotes");
}

export async function createEngineeringSupplierAction(formData: FormData) {
  const session = await assertWorkspaceWrite("engenharia"); const name = text(formData, "name");
  await createEngineeringSupplier({ name, contactName: nullableText(formData, "contactName"), email: nullableText(formData, "email"), phone: nullableText(formData, "phone"), category: nullableText(formData, "category"), active: formData.get("active") !== "off" });
  await recordWorkspaceAudit({ actorMemberId: session.member.id, action: "supplier.created", entityType: "supplier", summary: `${session.member.name} cadastrou o fornecedor ${name}.` }); revalidatePath("/admin/engenharia");
}

export async function createRawMaterialAction(formData: FormData) {
  const session = await assertWorkspaceWrite("engenharia"); const name = text(formData, "name");
  await createRawMaterial({ name, internalCode: text(formData, "internalCode"), category: nullableText(formData, "category"), primarySupplierId: numberValue(formData, "primarySupplierId"), secondarySupplierId: numberValue(formData, "secondarySupplierId"), unit: text(formData, "unit"), pricePerKg: numberValue(formData, "pricePerKg"), minimumStock: numberValue(formData, "minimumStock"), leadTimeDays: numberValue(formData, "leadTimeDays"), lot: nullableText(formData, "lot"), manufacturer: nullableText(formData, "manufacturer"), expirationDate: nullableText(formData, "expirationDate"), technicalSpecification: nullableText(formData, "technicalSpecification"), status: text(formData, "status") || "Ativo" });
  await recordWorkspaceAudit({ actorMemberId: session.member.id, action: "raw_material.created", entityType: "raw_material", summary: `${session.member.name} cadastrou a matéria-prima ${name}.` }); revalidatePath("/admin/engenharia");
}

export async function createPackagingMaterialAction(formData: FormData) {
  const session = await assertWorkspaceWrite("engenharia"); const name = text(formData, "name");
  await createPackagingMaterial({ name, internalCode: text(formData, "internalCode"), category: text(formData, "category"), supplierId: numberValue(formData, "supplierId"), unitCost: numberValue(formData, "unitCost"), minimumStock: numberValue(formData, "minimumStock"), leadTimeDays: numberValue(formData, "leadTimeDays"), lot: nullableText(formData, "lot"), manufacturer: nullableText(formData, "manufacturer"), technicalSpecification: nullableText(formData, "technicalSpecification"), status: text(formData, "status") || "Ativo" });
  await recordWorkspaceAudit({ actorMemberId: session.member.id, action: "packaging.created", entityType: "packaging", summary: `${session.member.name} cadastrou a embalagem ${name}.` }); revalidatePath("/admin/engenharia");
}

export async function createEngineeringFormulaAction(formData: FormData) {
  const session = await assertWorkspaceWrite("engenharia"); const name = text(formData, "name");
  await createEngineeringFormula({ name, code: text(formData, "code"), version: text(formData, "version"), clientId: numberValue(formData, "clientId"), productId: numberValue(formData, "productId"), category: nullableText(formData, "category"), responsible: nullableText(formData, "responsible"), formulaDate: text(formData, "formulaDate") });
  await recordWorkspaceAudit({ actorMemberId: session.member.id, action: "formula.created", entityType: "formula", summary: `${session.member.name} criou a fórmula ${name}.` }); revalidatePath("/admin/engenharia");
}

export async function addFormulaItemAction(formData: FormData) {
  const session = await assertWorkspaceWrite("engenharia"); const formulaId = numberValue(formData, "formulaId");
  await addFormulaItem({ formulaId, rawMaterialId: numberValue(formData, "rawMaterialId"), percentage: numberValue(formData, "percentage"), gramsPerServing: numberValue(formData, "gramsPerServing"), gramsPerContainer: numberValue(formData, "gramsPerContainer"), kgPerBatch: numberValue(formData, "kgPerBatch"), notes: nullableText(formData, "notes") });
  await recordWorkspaceAudit({ actorMemberId: session.member.id, action: "formula.item_added", entityType: "formula", entityId: formulaId, summary: `${session.member.name} adicionou um insumo à fórmula #${formulaId}.` }); revalidatePath("/admin/engenharia");
}

export async function duplicateEngineeringFormulaAction(formData: FormData) {
  const session = await assertWorkspaceWrite("engenharia"); const id = numberValue(formData, "formulaId");
  await duplicateEngineeringFormula(id);
  await recordWorkspaceAudit({ actorMemberId: session.member.id, action: "formula.duplicated", entityType: "formula", entityId: id, summary: `${session.member.name} duplicou a fórmula #${id}.` }); revalidatePath("/admin/engenharia");
}

export async function approveEngineeringFormulaAction(formData: FormData) {
  const session = await assertWorkspaceWrite("engenharia"); const id = numberValue(formData, "formulaId");
  await approveEngineeringFormula(id);
  await recordWorkspaceAudit({ actorMemberId: session.member.id, action: "formula.approved", entityType: "formula", entityId: id, summary: `${session.member.name} aprovou a fórmula #${id}.` }); revalidatePath("/admin/engenharia");
}

export async function createEngineeringProjectAction(formData: FormData) {
  const session = await assertWorkspaceWrite("engenharia"); const name = text(formData, "name");
  await createEngineeringProject({ clientId: numberValue(formData, "clientId"), productId: numberValue(formData, "productId"), name, briefing: nullableText(formData, "briefing") });
  await recordWorkspaceAudit({ actorMemberId: session.member.id, action: "project.created", entityType: "engineering_project", summary: `${session.member.name} abriu o projeto ${name}.` }); revalidatePath("/admin/engenharia");
}

export async function addFormulaPackagingItemAction(formData: FormData) {
  const session = await assertWorkspaceWrite("engenharia"); const formulaId = numberValue(formData, "formulaId");
  await addFormulaPackagingItem({ formulaId, packagingMaterialId: numberValue(formData, "packagingMaterialId"), quantity: numberValue(formData, "quantity") || 1 });
  await recordWorkspaceAudit({ actorMemberId: session.member.id, action: "formula.packaging_added", entityType: "formula", entityId: formulaId, summary: `${session.member.name} adicionou embalagem à fórmula #${formulaId}.` }); revalidatePath("/admin/engenharia");
}

export async function sendFormulaToPricingAction(formData: FormData) {
  const session = await assertWorkspaceWrite("engenharia"); const formulaId = numberValue(formData, "formulaId"); const projectId = numberValue(formData, "projectId") || null;
  const pricing = await createAdvancedPricingFromFormula({ formulaId, projectId, manufacturingCost: 0, overheadCost: 0, otherCost: 0, targetMarginPercent: 0 });
  await recordWorkspaceAudit({ actorMemberId: session.member.id, action: "pricing.created", entityType: "pricing_request", entityId: pricing?.id, summary: `${session.member.name} gerou o snapshot técnico de custo da fórmula #${formulaId}.`, metadata: { projectId, formulaId } }); revalidatePath("/admin/engenharia"); if (projectId) revalidatePath(`/admin/modulos/private-label/${projectId}`);
}

export async function createProposalFromPricingAction(formData: FormData) {
  const session = await assertWorkspaceWrite("engenharia"); const pricingId = numberValue(formData, "pricingRequestId");
  const proposal = await createAdvancedProposalFromPricing({ pricingRequestId: pricingId, validityDays: 15 });
  await recordWorkspaceAudit({ actorMemberId: session.member.id, action: "proposal.created", entityType: "commercial_proposal", entityId: proposal?.id, summary: `${session.member.name} gerou proposta a partir da precificação #${pricingId}.` }); revalidatePath("/admin/engenharia");
}
