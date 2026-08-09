import { requireWorkspaceModule } from "@/lib/workspace-auth";
export default async function LotsLayout({ children }: { children: React.ReactNode }) { await requireWorkspaceModule("lotes"); return children; }
