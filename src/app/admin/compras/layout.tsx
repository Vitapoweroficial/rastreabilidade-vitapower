import { requireWorkspaceModule } from "@/lib/workspace-auth";

export default async function PurchasesLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  await requireWorkspaceModule("compras");
  return children;
}
