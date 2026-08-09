import { requireWorkspaceModule } from "@/lib/workspace-auth";
export default async function ProductsLayout({ children }: { children: React.ReactNode }) { await requireWorkspaceModule("produtos"); return children; }
