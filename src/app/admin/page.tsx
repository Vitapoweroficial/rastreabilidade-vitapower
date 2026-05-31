import Link from "next/link";
import { Boxes, CheckCircle2, Clock3, PackageCheck, PackageOpen, UsersRound } from "lucide-react";
import { StatCard } from "@/components/stat-card";
import { StatusBadge } from "@/components/status-badge";
import { getDashboardData } from "@/lib/repository";
import { formatDate, formatQuantity } from "@/lib/format";

export const dynamic = "force-dynamic";

export default function AdminDashboardPage() {
  const { stats, recentLots } = getDashboardData();

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-bold uppercase text-brass">Admin</p>
          <h1 className="mt-2 text-3xl font-black text-ink">Dashboard administrativo</h1>
        </div>
        <Link href="/admin/lotes" className="btn-primary w-full sm:w-auto">
          <PackageCheck size={18} aria-hidden="true" />
          Novo lote
        </Link>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard icon={<UsersRound size={22} />} label="Clientes ativos" value={stats.activeClients} />
        <StatCard icon={<Boxes size={22} />} label="Produtos ativos" value={stats.activeProducts} />
        <StatCard icon={<PackageOpen size={22} />} label="Lotes cadastrados" value={stats.totalLots} />
        <StatCard icon={<CheckCircle2 size={22} />} label="Lotes liberados" value={stats.releasedLots} />
        <StatCard icon={<Clock3 size={22} />} label="Em quarentena" value={stats.quarantineLots} />
        <StatCard icon={<PackageCheck size={22} />} label="Validade em 45 dias" value={stats.expiringLots} />
      </section>

      <section className="panel overflow-hidden">
        <div className="flex flex-col justify-between gap-3 border-b border-line px-5 py-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-lg font-black text-ink">Lotes recentes</h2>
            <p className="mt-1 text-sm text-slate-600">Últimas movimentações de rastreabilidade.</p>
          </div>
          <Link href="/admin/lotes" className="btn-secondary">
            Ver lotes
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-left">
            <thead>
              <tr className="table-head">
                <th className="px-4 py-3">Lote</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Produto</th>
                <th className="px-4 py-3">Validade</th>
                <th className="px-4 py-3">Quantidade</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentLots.map((lot) => (
                <tr key={lot.id}>
                  <td className="table-cell font-black text-moss">{lot.code}</td>
                  <td className="table-cell">{lot.clientBrandName}</td>
                  <td className="table-cell">
                    <span className="font-bold text-ink">{lot.productName}</span>
                    <span className="block text-xs text-slate-500">{lot.sku}</span>
                  </td>
                  <td className="table-cell">{formatDate(lot.expirationDate)}</td>
                  <td className="table-cell">{formatQuantity(lot.quantity, lot.unit)}</td>
                  <td className="table-cell">
                    <StatusBadge status={lot.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
