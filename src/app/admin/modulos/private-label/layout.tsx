import { requireWorkspaceModule } from "@/lib/workspace-auth";
export default async function PrivateLabelLayout({ children }: { children: React.ReactNode }) { await requireWorkspaceModule("private_label"); return children; }
