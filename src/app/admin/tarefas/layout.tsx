import { requireWorkspaceModule } from "@/lib/workspace-auth";
export default async function TasksLayout({ children }: { children: React.ReactNode }) { await requireWorkspaceModule("tarefas"); return children; }
