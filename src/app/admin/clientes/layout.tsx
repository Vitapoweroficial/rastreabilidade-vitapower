import { requireWorkspaceModule } from "@/lib/workspace-auth";
export default async function ClientsLayout({ children }: { children: React.ReactNode }) { await requireWorkspaceModule("clientes"); return children; }
