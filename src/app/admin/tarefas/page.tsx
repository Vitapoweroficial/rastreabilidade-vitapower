import { WorkspaceTaskBoard } from "@/components/workspace-task-board";
import { listWorkspaceAlerts } from "@/lib/workspace-alerts";
import { listWorkspaceMembers } from "@/lib/workspace-members";

export const dynamic = "force-dynamic";

export default async function WorkspaceTasksPage() {
  const [tasks, members] = await Promise.all([
    listWorkspaceAlerts(100),
    listWorkspaceMembers({ activeOnly: false })
  ]);
  return <WorkspaceTaskBoard initialTasks={tasks} members={members} />;
}
