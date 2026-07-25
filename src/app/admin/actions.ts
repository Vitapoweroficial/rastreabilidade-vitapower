"use server";

import { revalidatePath } from "next/cache";
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
  createProposalFromPricing,
  createRawMaterial,
  duplicateEngineeringFormula,
  sendFormulaToPricing
} from "@/lib/repository";
import type { LotStatus } from "@/lib/types";

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function nullableText(formData: FormData, key: string) {
  const value = text(formData, key);
  return value || null;
}

function numberValue(formData: FormData, key: string) {
  return Number(formData.get(key) ?? 0);
}

export async function createClientAction(formData: FormData) {
  await createClient({
    brandName: text(formData, "brandName"),
    legalName: text(formData, "legalName"),
    taxId: nullableText(formData, "taxId"),
    contactName: nullableText(formData, "contactName"),
    email: nullableText(formData, "email"),
    phone: nullableText(formData, "phone"),
    active: formData.get("active") === "on"
  });

  revalidatePath("/admin");
  revalidatePath("/admin/clientes");
}

export async function createProductAction(formData: FormData) {
  await createProduct({
    clientId: numberValue(formData, "clientId"),
    sku: text(formData, "sku"),
    name: text(formData, "name"),
    category: nullableText(formData, "category"),
    description: nullableText(formData, "description"),
    formulaVersion: nullableText(formData, "formulaVersion"),
    active: formData.get("active") === "on"
  });

  revalidatePath("/admin");
  revalidatePath("/admin/produtos");
}

export async function createLotAction(formData: FormData) {
  await createLot({
    productId: numberValue(formData, "productId"),
    code: text(formData, "code"),
    manufacturingDate: text(formData, "manufacturingDate"),
    expirationDate: text(formData, "expirationDate"),
    quantity: numberValue(formData, "quantity"),
    unit: nullableText(formData, "unit") ?? "un",
    status: text(formData, "status") as LotStatus,
    origin: nullableText(formData, "origin"),
    analysisSummary: nullableText(formData, "analysisSummary"),
    traceabilityNotes: nullableText(formData, "traceabilityNotes")
  });

  revalidatePath("/admin");
  revalidatePath("/admin/lotes");
}

export async function createEngineeringSupplierAction(formData: FormData) {
  await createEngineeringSupplier({
    name: text(formData, "name"),
    contactName: nullableText(formData, "contactName"),
    email: nullableText(formData, "email"),
    phone: nullableText(formData, "phone"),
    category: nullableText(formData, "category"),
    active: formData.get("active") !== "off"
  });
  revalidatePath("/admin/engenharia");
}

export async function createRawMaterialAction(formData: FormData) {
  await createRawMaterial({
    name: text(formData, "name"),
    internalCode: text(formData, "internalCode"),
    category: nullableText(formData, "category"),
    primarySupplierId: numberValue(formData, "primarySupplierId"),
    secondarySupplierId: numberValue(formData, "secondarySupplierId"),
    unit: text(formData, "unit"),
    pricePerKg: numberValue(formData, "pricePerKg"),
    minimumStock: numberValue(formData, "minimumStock"),
    leadTimeDays: numberValue(formData, "leadTimeDays"),
    lot: nullableText(formData, "lot"),
    manufacturer: nullableText(formData, "manufacturer"),
    expirationDate: nullableText(formData, "expirationDate"),
    technicalSpecification: nullableText(formData, "technicalSpecification"),
    status: text(formData, "status") || "Ativo"
  });
  revalidatePath("/admin/engenharia");
}

export async function createPackagingMaterialAction(formData: FormData) {
  await createPackagingMaterial({
    name: text(formData, "name"),
    internalCode: text(formData, "internalCode"),
    category: text(formData, "category"),
    supplierId: numberValue(formData, "supplierId"),
    unitCost: numberValue(formData, "unitCost"),
    minimumStock: numberValue(formData, "minimumStock"),
    leadTimeDays: numberValue(formData, "leadTimeDays"),
    lot: nullableText(formData, "lot"),
    manufacturer: nullableText(formData, "manufacturer"),
    technicalSpecification: nullableText(formData, "technicalSpecification"),
    status: text(formData, "status") || "Ativo"
  });
  revalidatePath("/admin/engenharia");
}

export async function createEngineeringFormulaAction(formData: FormData) {
  await createEngineeringFormula({
    name: text(formData, "name"),
    code: text(formData, "code"),
    version: text(formData, "version"),
    clientId: numberValue(formData, "clientId"),
    productId: numberValue(formData, "productId"),
    category: nullableText(formData, "category"),
    responsible: nullableText(formData, "responsible"),
    formulaDate: text(formData, "formulaDate")
  });
  revalidatePath("/admin/engenharia");
}

export async function addFormulaItemAction(formData: FormData) {
  await addFormulaItem({
    formulaId: numberValue(formData, "formulaId"),
    rawMaterialId: numberValue(formData, "rawMaterialId"),
    percentage: numberValue(formData, "percentage"),
    gramsPerServing: numberValue(formData, "gramsPerServing"),
    gramsPerContainer: numberValue(formData, "gramsPerContainer"),
    kgPerBatch: numberValue(formData, "kgPerBatch"),
    notes: nullableText(formData, "notes")
  });
  revalidatePath("/admin/engenharia");
}

export async function duplicateEngineeringFormulaAction(formData: FormData) {
  await duplicateEngineeringFormula(numberValue(formData, "formulaId"));
  revalidatePath("/admin/engenharia");
}

export async function approveEngineeringFormulaAction(formData: FormData) {
  await approveEngineeringFormula(numberValue(formData, "formulaId"));
  revalidatePath("/admin/engenharia");
}

export async function createEngineeringProjectAction(formData: FormData) {
  await createEngineeringProject({
    clientId: numberValue(formData, "clientId"),
    productId: numberValue(formData, "productId"),
    name: text(formData, "name"),
    briefing: nullableText(formData, "briefing")
  });
  revalidatePath("/admin/engenharia");
}

export async function addFormulaPackagingItemAction(formData: FormData) {
  await addFormulaPackagingItem({
    formulaId: numberValue(formData, "formulaId"),
    packagingMaterialId: numberValue(formData, "packagingMaterialId"),
    quantity: numberValue(formData, "quantity") || 1
  });
  revalidatePath("/admin/engenharia");
}

export async function sendFormulaToPricingAction(formData: FormData) {
  await sendFormulaToPricing({
    formulaId: numberValue(formData, "formulaId"),
    projectId: numberValue(formData, "projectId")
  });
  revalidatePath("/admin/engenharia");
}

export async function createProposalFromPricingAction(formData: FormData) {
  await createProposalFromPricing(numberValue(formData, "pricingRequestId"));
  revalidatePath("/admin/engenharia");
}
