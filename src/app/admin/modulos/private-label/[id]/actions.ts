"use server";

import { revalidatePath } from "next/cache";
import { assertWorkspaceWrite } from "@/lib/workspace-auth";
import { recordWorkspaceAudit } from "@/lib/workspace-audit";
import {
  createAdvancedPricingFromFormula,
  createAdvancedProposalFromPricing,
  createProjectFormula
} from "@/lib/private-label-enterprise";
import { updatePrivateLabelProjectStage } from "@/lib/private-label-repository";

function text(formData: FormData, key: string) { return String(formData.get(key) ?? "").trim(); }
function num(formData: FormData, key: string, fallback = 0) { const value = Number(formData.get(key) ?? fallback); return Number.isFinite(value) ? value : fallback; }
function refresh(projectId: number) {
  revalidatePath("/admin");
  revalidatePath("/admin/engenharia");
  revalidatePath("/admin/modulos/private-label");
  revalidatePath(`/admin/modulos/private-label/${projectId}`);
}

export async function createProjectFormulaAction(formData: FormData) {
  const session = await assertWorkspaceWrite("private_label");
  const projectId = num(formData, "projectId");
  const result = await createProjectFormula({
    projectId,
    name: text(formData, "name"),
    code: text(formData, "code"),
    version: text(formData, "version") || "v1",
    category: text(formData, "category") || null,
    responsible: text(formData, "responsible") || session.member.name,
    batchUnits: num(formData, "batchUnits", 1),
    netWeightG: num(formData, "netWeightG")
  });
  await recordWorkspaceAudit({ actorMemberId: session.member.id, action: "private_label.formula_created", entityType: "engineering_formula", entityId: result?.id, summary: `${session.member.name} criou uma fórmula vinculada ao projeto #${projectId}.`, metadata: { projectId } });
  refresh(projectId);
}

export async function createProjectPricingAction(formData: FormData) {
  const session = await assertWorkspaceWrite("private_label");
  const projectId = num(formData, "projectId");
  const formulaId = num(formData, "formulaId");
  const result = await createAdvancedPricingFromFormula({
    formulaId,
    projectId,
    manufacturingCost: num(formData, "manufacturingCost"),
    overheadCost: num(formData, "overheadCost"),
    otherCost: num(formData, "otherCost"),
    targetMarginPercent: num(formData, "targetMarginPercent"),
    notes: text(formData, "notes") || null
  });
  await recordWorkspaceAudit({ actorMemberId: session.member.id, action: "private_label.pricing_created", entityType: "pricing_request", entityId: result?.id, summary: `${session.member.name} fechou uma precificação do projeto #${projectId}.`, metadata: { projectId, formulaId } });
  refresh(projectId);
}

export async function createProjectProposalAction(formData: FormData) {
  const session = await assertWorkspaceWrite("private_label");
  const projectId = num(formData, "projectId");
  const pricingRequestId = num(formData, "pricingRequestId");
  const result = await createAdvancedProposalFromPricing({
    pricingRequestId,
    validityDays: num(formData, "validityDays", 15),
    notes: text(formData, "notes") || null
  });
  await recordWorkspaceAudit({ actorMemberId: session.member.id, action: "private_label.proposal_created", entityType: "commercial_proposal", entityId: result?.id, summary: `${session.member.name} gerou a proposta comercial do projeto #${projectId}.`, metadata: { projectId, pricingRequestId } });
  refresh(projectId);
}

export async function updateProjectStageFromDetailAction(formData: FormData) {
  const session = await assertWorkspaceWrite("private_label");
  const projectId = num(formData, "projectId");
  const stageId = text(formData, "stageId");
  await updatePrivateLabelProjectStage(projectId, stageId);
  await recordWorkspaceAudit({ actorMemberId: session.member.id, action: "private_label.stage_updated", entityType: "engineering_project", entityId: projectId, summary: `${session.member.name} atualizou a etapa do projeto #${projectId} para ${stageId}.`, metadata: { stageId } });
  refresh(projectId);
}
