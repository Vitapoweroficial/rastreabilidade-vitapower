import { WorkspaceTaskBoard } from "@/components/workspace-task-board";
import { listWorkspaceAlerts } from "@/lib/workspace-alerts";

export const dynamic = "force-dynamic";

export default async function WorkspaceTasksPage() {
  const tasks = await listWorkspaceAlerts(100);
  return <WorkspaceTaskBoard initialTasks={tasks} />;
}
