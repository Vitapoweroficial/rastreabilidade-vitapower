import { WorkspaceDashboard } from "@/components/workspace-dashboard";
import { formatDate, formatQuantity } from "@/lib/format";
import { getDashboardData } from "@/lib/repository";
import { workspaceModules } from "@/lib/workspace";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const { stats, recentLots } = await getDashboardData();

  return (
    <WorkspaceDashboard
      stats={stats}
      modules={workspaceModules
        .filter((module) => module.slug !== "dashboard")
        .map(({ slug, href, label, description, status }) => ({ slug, href, label, description, status }))}
      recentLots={recentLots.map((lot) => ({
        id: lot.id,
        code: lot.code,
        clientBrandName: lot.clientBrandName,
        productName: lot.productName,
        sku: lot.sku,
        expirationDate: formatDate(lot.expirationDate),
        quantity: formatQuantity(lot.quantity, lot.unit),
        status: lot.status,
      }))}
    />
  );
}
