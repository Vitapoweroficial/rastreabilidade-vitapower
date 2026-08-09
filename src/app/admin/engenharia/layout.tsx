import { requireWorkspaceModule } from "@/lib/workspace-auth";
export default async function EngineeringLayout({ children }: { children: React.ReactNode }) { await requireWorkspaceModule("engenharia"); return children; }
