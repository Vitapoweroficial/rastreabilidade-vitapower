import { WorkspaceTeamBoard } from "@/components/workspace-team-board";
import { listWorkspaceAlerts } from "@/lib/workspace-alerts";
import { listWorkspaceMembers } from "@/lib/workspace-members";

export const dynamic = "force-dynamic";

export default async function WorkspaceTeamPage() {
  const [members, tasks] = await Promise.all([
    listWorkspaceMembers(),
    listWorkspaceAlerts(100)
  ]);
  const openTaskCounts = tasks.reduce<Record<string, number>>((acc, task) => {
    if (task.taskStatus === "concluido" || !task.assigneeMemberId) return acc;
    const key = String(task.assigneeMemberId);
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
  return <WorkspaceTeamBoard initialMembers={members} openTaskCounts={openTaskCounts} />;
}
