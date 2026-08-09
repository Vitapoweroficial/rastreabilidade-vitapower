import { WorkspaceTaskBoard } from "@/components/workspace-task-board";
import { listWorkspaceAlertsForMember } from "@/lib/workspace-alerts";
import { requireWorkspaceModule } from "@/lib/workspace-auth";
import { listWorkspaceMembers } from "@/lib/workspace-members";

export const dynamic = "force-dynamic";

export default async function WorkspaceTasksPage() {
  const session = await requireWorkspaceModule("tarefas");
  const canSeeAll = session.member.accessLevel === "admin" || session.member.accessLevel === "gestor";
  const [tasks, members] = await Promise.all([
    listWorkspaceAlertsForMember(100, session.member.id, canSeeAll),
    canSeeAll ? listWorkspaceMembers({ activeOnly: false }) : Promise.resolve([session.member])
  ]);
  return <WorkspaceTaskBoard initialTasks={tasks} members={members} />;
}
