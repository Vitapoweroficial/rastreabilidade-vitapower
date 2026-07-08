"use server";

import { revalidatePath } from "next/cache";
import {
  createClient,
  createEngineeringMaterialFromForm,
  createEngineeringPackagingFromForm,
  createLot,
  createProduct,
  duplicateEngineeringMaterial,
  duplicateEngineeringPackaging
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


export async function createEngineeringMaterialAction(formData: FormData) {
  createEngineeringMaterialFromForm(formData);
  revalidatePath("/admin");
  revalidatePath("/admin/engenharia");
}

export async function createEngineeringPackagingAction(formData: FormData) {
  createEngineeringPackagingFromForm(formData);
  revalidatePath("/admin");
  revalidatePath("/admin/engenharia");
}

export async function duplicateEngineeringMaterialAction(formData: FormData) {
  duplicateEngineeringMaterial(numberValue(formData, "id"));
  revalidatePath("/admin/engenharia");
}

export async function duplicateEngineeringPackagingAction(formData: FormData) {
  duplicateEngineeringPackaging(numberValue(formData, "id"));
  revalidatePath("/admin/engenharia");
}
