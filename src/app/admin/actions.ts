"use server";

import { revalidatePath } from "next/cache";
import { addFormulaItem, approveEngineeringFormula, createClient, createEngineeringFormula, createEngineeringSupplier, createLot, createPackagingMaterial, createProduct, createRawMaterial, duplicateEngineeringFormula } from "@/lib/repository";
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
  createClient({
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
  createProduct({
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
  createLot({
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
  createEngineeringSupplier({
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
  createRawMaterial({
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
  createPackagingMaterial({
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
  createEngineeringFormula({
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
  addFormulaItem({
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
  duplicateEngineeringFormula(numberValue(formData, "formulaId"));
  revalidatePath("/admin/engenharia");
}

export async function approveEngineeringFormulaAction(formData: FormData) {
  approveEngineeringFormula(numberValue(formData, "formulaId"));
  revalidatePath("/admin/engenharia");
}
