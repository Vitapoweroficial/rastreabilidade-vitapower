import { WorkspaceTeamBoard } from "@/components/workspace-team-board";
import { listWorkspaceAlerts } from "@/lib/workspace-alerts";
import { getWorkspaceMemberAccessStates, requireWorkspaceSession } from "@/lib/workspace-auth";
import { listWorkspaceAudit } from "@/lib/workspace-audit";
import { listWorkspaceMembers } from "@/lib/workspace-members";

export const dynamic = "force-dynamic";

export default async function WorkspaceTeamPage() {
  const session = await requireWorkspaceSession();
  const [members, tasks, accessStates, auditRows] = await Promise.all([
    listWorkspaceMembers(),
    listWorkspaceAlerts(100),
    getWorkspaceMemberAccessStates(),
    listWorkspaceAudit(40)
  ]);

  const openTaskCounts = tasks.reduce<Record<string, number>>((acc, task) => {
    if (task.taskStatus === "concluido" || !task.assigneeMemberId) return acc;
    const key = String(task.assigneeMemberId);
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  const audit = (auditRows as unknown as Array<{
    id: number;
    actor_name: string | null;
    action: string;
    summary: string;
    created_at: string | Date;
  }>).map((row) => ({
    id: Number(row.id),
    actorName: row.actor_name,
    action: row.action,
    summary: row.summary,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at)
  }));

  return (
    <WorkspaceTeamBoard
      initialMembers={members}
      openTaskCounts={openTaskCounts}
      accessStates={accessStates}
      audit={audit}
      canManage={session.member.accessLevel === "admin"}
    />
  );
}
