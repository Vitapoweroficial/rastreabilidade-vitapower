import { WorkspaceDashboard } from "@/components/workspace-dashboard";
import { formatDate, formatQuantity } from "@/lib/format";
import { getDashboardData } from "@/lib/repository";
import { requireWorkspaceModule } from "@/lib/workspace-auth";
import type { WorkspaceModuleId } from "@/lib/workspace-members";
import { workspaceModules } from "@/lib/workspace";

export const dynamic = "force-dynamic";

const permissionByWorkspaceSlug: Partial<Record<(typeof workspaceModules)[number]["slug"], WorkspaceModuleId>> = {
  crm: "clientes",
  "private-label": "private_label",
  engenharia: "engenharia",
  rastreabilidade: "lotes"
};

export default async function AdminDashboardPage() {
  const session = await requireWorkspaceModule("dashboard");
  const { stats, recentLots } = await getDashboardData();
  const visibleModules = workspaceModules.filter((module) => {
    if (module.slug === "dashboard") return false;
    if (session.member.accessLevel === "admin") return true;
    const requiredPermission = permissionByWorkspaceSlug[module.slug];
    return Boolean(requiredPermission && session.member.permissions.includes(requiredPermission));
  });

  return (
    <WorkspaceDashboard
      stats={stats}
      modules={visibleModules.map(({ slug, href, label, description, status }) => ({ slug, href, label, description, status }))}
      recentLots={recentLots.map((lot) => ({
        id: lot.id,
        code: lot.code,
        clientBrandName: lot.clientBrandName,
        productName: lot.productName,
        sku: lot.sku,
        expirationDate: formatDate(lot.expirationDate),
        quantity: formatQuantity(lot.quantity, lot.unit),
        status: lot.status
      }))}
    />
  );
}
