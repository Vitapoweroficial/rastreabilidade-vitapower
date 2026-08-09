"use server";

import { revalidatePath } from "next/cache";
import { createEngineeringProject } from "@/lib/repository";
import { updatePrivateLabelProjectStage } from "@/lib/private-label-repository";
import { assertWorkspaceWrite } from "@/lib/workspace-auth";
import { recordWorkspaceAudit } from "@/lib/workspace-audit";

function text(formData: FormData, key: string) { return String(formData.get(key) ?? "").trim(); }
function numberValue(formData: FormData, key: string) { const value = Number(formData.get(key) ?? 0); return Number.isFinite(value) ? value : 0; }

export async function createPrivateLabelProjectAction(formData: FormData) {
  const session = await assertWorkspaceWrite("private_label");
  const name = text(formData, "name");
  await createEngineeringProject({ clientId: numberValue(formData, "clientId"), productId: numberValue(formData, "productId") || null, name, briefing: text(formData, "briefing") || null });
  await recordWorkspaceAudit({ actorMemberId: session.member.id, action: "private_label.project_created", entityType: "engineering_project", summary: `${session.member.name} abriu o projeto Private Label ${name}.` });
  revalidatePath("/admin"); revalidatePath("/admin/modulos/private-label");
}

export async function updatePrivateLabelProjectStageAction(formData: FormData) {
  const session = await assertWorkspaceWrite("private_label");
  const projectId = numberValue(formData, "projectId"); const stageId = text(formData, "stageId");
  await updatePrivateLabelProjectStage(projectId, stageId);
  await recordWorkspaceAudit({ actorMemberId: session.member.id, action: "private_label.stage_updated", entityType: "engineering_project", entityId: projectId, summary: `${session.member.name} moveu o projeto #${projectId} para ${stageId}.`, metadata: { stageId } });
  revalidatePath("/admin"); revalidatePath("/admin/modulos/private-label");
}
