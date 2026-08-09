import { requireWorkspaceModule } from "@/lib/workspace-auth";
export default async function TeamLayout({ children }: { children: React.ReactNode }) { await requireWorkspaceModule("equipe"); return children; }
