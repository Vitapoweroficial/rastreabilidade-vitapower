"use server";

import { revalidatePath } from "next/cache";
import { createEngineeringProject } from "@/lib/repository";
import { updatePrivateLabelProjectStage } from "@/lib/private-label-repository";

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function numberValue(formData: FormData, key: string) {
  const value = Number(formData.get(key) ?? 0);
  return Number.isFinite(value) ? value : 0;
}

export async function createPrivateLabelProjectAction(formData: FormData) {
  await createEngineeringProject({
    clientId: numberValue(formData, "clientId"),
    productId: numberValue(formData, "productId") || null,
    name: text(formData, "name"),
    briefing: text(formData, "briefing") || null
  });
  revalidatePath("/admin");
  revalidatePath("/admin/modulos/private-label");
}

export async function updatePrivateLabelProjectStageAction(formData: FormData) {
  const projectId = numberValue(formData, "projectId");
  const stageId = text(formData, "stageId");
  await updatePrivateLabelProjectStage(projectId, stageId);
  revalidatePath("/admin");
  revalidatePath("/admin/modulos/private-label");
}
