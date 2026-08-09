"use server";

import { revalidatePath } from "next/cache";
import { assertWorkspaceWrite } from "@/lib/workspace-auth";
import { recordWorkspaceAudit } from "@/lib/workspace-audit";
import { createWorkspaceAlert } from "@/lib/workspace-alerts";
import {
  createAdvancedPricingFromFormula,
  createAdvancedProposalFromPricing,
  createProjectFormula
} from "@/lib/private-label-enterprise";
import {
  approveCommercialProposalAndCreateOrder,
  productionOrderStatuses,
  updateProductionOrderStatus,
  type ProductionOrderStatus
} from "@/lib/private-label-production";
import { updatePrivateLabelProjectStage } from "@/lib/private-label-repository";

function text(formData: FormData, key: string) { return String(formData.get(key) ?? "").trim(); }
function num(formData: FormData, key: string, fallback = 0) { const value = Number(formData.get(key) ?? fallback); return Number.isFinite(value) ? value : fallback; }
function refresh(projectId: number) {
  revalidatePath("/admin");
  revalidatePath("/admin/engenharia");
  revalidatePath("/admin/tarefas");
  revalidatePath("/admin/modulos/private-label");
  revalidatePath(`/admin/modulos/private-label/${projectId}`);
}

export async function createProjectFormulaAction(formData: FormData) {
  const session = await assertWorkspaceWrite("private_label");
  const projectId = num(formData, "projectId");
  const result = await createProjectFormula({ projectId, name: text(formData, "name"), code: text(formData, "code"), version: text(formData, "version") || "v1", category: text(formData, "category") || null, responsible: text(formData, "responsible") || session.member.name, batchUnits: num(formData, "batchUnits", 1), netWeightG: num(formData, "netWeightG") });
  await recordWorkspaceAudit({ actorMemberId: session.member.id, action: "private_label.formula_created", entityType: "engineering_formula", entityId: result?.id, summary: `${session.member.name} criou uma fórmula vinculada ao projeto #${projectId}.`, metadata: { projectId } });
  refresh(projectId);
}

export async function createProjectPricingAction(formData: FormData) {
  const session = await assertWorkspaceWrite("private_label");
  const projectId = num(formData, "projectId");
  const formulaId = num(formData, "formulaId");
  const result = await createAdvancedPricingFromFormula({ formulaId, projectId, manufacturingCost: num(formData, "manufacturingCost"), overheadCost: num(formData, "overheadCost"), otherCost: num(formData, "otherCost"), targetMarginPercent: num(formData, "targetMarginPercent"), notes: text(formData, "notes") || null });
  await recordWorkspaceAudit({ actorMemberId: session.member.id, action: "private_label.pricing_created", entityType: "pricing_request", entityId: result?.id, summary: `${session.member.name} fechou uma precificação do projeto #${projectId}.`, metadata: { projectId, formulaId } });
  refresh(projectId);
}

export async function createProjectProposalAction(formData: FormData) {
  const session = await assertWorkspaceWrite("private_label");
  const projectId = num(formData, "projectId");
  const pricingRequestId = num(formData, "pricingRequestId");
  const result = await createAdvancedProposalFromPricing({ pricingRequestId, validityDays: num(formData, "validityDays", 15), notes: text(formData, "notes") || null });
  await recordWorkspaceAudit({ actorMemberId: session.member.id, action: "private_label.proposal_created", entityType: "commercial_proposal", entityId: result?.id, summary: `${session.member.name} gerou a proposta comercial do projeto #${projectId}.`, metadata: { projectId, pricingRequestId } });
  refresh(projectId);
}

export async function approveProjectProposalAction(formData: FormData) {
  const session = await assertWorkspaceWrite("private_label");
  const projectId = num(formData, "projectId");
  const proposalId = num(formData, "proposalId");
  const order = await approveCommercialProposalAndCreateOrder(proposalId);
  await createWorkspaceAlert({
    sourceKey: `production-order-${order.id}`,
    type: "production_order",
    audience: "Operações + PCP",
    title: `OP #${String(order.id).padStart(5, "0")} aguardando programação`,
    message: `Projeto #${projectId} aprovado comercialmente. Programar ${Number(order.quantity).toLocaleString("pt-BR")} unidade(s) e validar materiais antes da produção.`,
    href: `/admin/modulos/private-label/${projectId}`,
    entityType: "production_order",
    entityId: order.id
  });
  await recordWorkspaceAudit({ actorMemberId: session.member.id, action: "proposal.approved", entityType: "commercial_proposal", entityId: proposalId, summary: `${session.member.name} aprovou a proposta #${proposalId} e gerou a OP #${order.id}.`, metadata: { projectId, productionOrderId: order.id } });
  refresh(projectId);
}

export async function updateProjectProductionOrderAction(formData: FormData) {
  const session = await assertWorkspaceWrite("private_label");
  const projectId = num(formData, "projectId");
  const orderId = num(formData, "orderId");
  const status = text(formData, "status") as ProductionOrderStatus;
  if (!productionOrderStatuses.includes(status)) throw new Error("Status de produção inválido.");
  const order = await updateProductionOrderStatus({ orderId, status, scheduledDate: text(formData, "scheduledDate") || null, notes: text(formData, "notes") || null });
  await recordWorkspaceAudit({ actorMemberId: session.member.id, action: "production_order.updated", entityType: "production_order", entityId: order.id, summary: `${session.member.name} atualizou a OP #${order.id} para ${order.status}.`, metadata: { projectId, status: order.status } });
  refresh(projectId);
}

export async function updateProjectStageFromDetailAction(formData: FormData) {
  const session = await assertWorkspaceWrite("private_label");
  const projectId = num(formData, "projectId"); const stageId = text(formData, "stageId");
  await updatePrivateLabelProjectStage(projectId, stageId);
  await recordWorkspaceAudit({ actorMemberId: session.member.id, action: "private_label.stage_updated", entityType: "engineering_project", entityId: projectId, summary: `${session.member.name} atualizou a etapa do projeto #${projectId} para ${stageId}.`, metadata: { stageId } });
  refresh(projectId);
}
