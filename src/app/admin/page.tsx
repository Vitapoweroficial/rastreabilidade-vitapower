import Link from "next/link";
import { Boxes, CheckCircle2, Clock3, FlaskConical, PackageCheck, PackageOpen, UsersRound } from "lucide-react";
import { StatCard } from "@/components/stat-card";
import { StatusBadge } from "@/components/status-badge";
import { getDashboardData } from "@/lib/repository";
import { workspaceModules } from "@/lib/workspace";
import { formatDate, formatQuantity } from "@/lib/format";

export const dynamic = "force-dynamic";

export default function AdminDashboardPage() {
  const { stats, recentLots } = getDashboardData();

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-950 text-white shadow-soft">
        <div className="grid gap-6 bg-[radial-gradient(circle_at_top_right,rgba(220,38,38,0.32),transparent_34%),linear-gradient(135deg,#020617,#111827_52%,#450a0a)] p-6 sm:p-8 lg:grid-cols-[1fr_360px]">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.24em] text-red-200">Vita Power Workspace</p>
            <h1 className="mt-4 max-w-3xl text-4xl font-black tracking-tight sm:text-5xl">
              O coração digital da operação industrial.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
              Base enterprise para CRM, private label, engenharia, PCP, qualidade, regulatório, rastreabilidade,
              compras, estoque e financeiro — preservando a consulta pública por lote já existente.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link href="/admin/lotes" className="btn-primary bg-red-700 hover:bg-red-800">
                <PackageCheck size={18} aria-hidden="true" />
                Novo lote rastreável
              </Link>
              <Link href="/admin/clientes" className="btn-secondary border-white/20 bg-white/10 text-white hover:bg-white/15">
                <UsersRound size={18} aria-hidden="true" />
                Ver clientes
              </Link>
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-red-100">Status da fundação</p>
            <div className="mt-5 space-y-4">
              <FoundationItem label="Rastreabilidade" value="Preservada" />
              <FoundationItem label="Banco industrial" value="Estrutura inicial" />
              <FoundationItem label="Módulos" value={`${workspaceModules.length} domínios`} />
              <FoundationItem label="Arquitetura" value="Documentada" />
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={<UsersRound size={22} />} label="Clientes ativos" value={stats.activeClients} />
        <StatCard icon={<PackageOpen size={22} />} label="Lotes cadastrados" value={stats.totalLots} />
        <StatCard icon={<ClipboardIcon />} label="Projetos ativos" value={stats.activeProjects} />
        <StatCard icon={<FlaskConical size={22} />} label="Fórmulas" value={stats.formulas} />
        <StatCard icon={<Boxes size={22} />} label="Produtos ativos" value={stats.activeProducts} />
        <StatCard icon={<CheckCircle2 size={22} />} label="Lotes liberados" value={stats.releasedLots} />
        <StatCard icon={<Clock3 size={22} />} label="Em quarentena" value={stats.quarantineLots} />
        <StatCard icon={<PackageCheck size={22} />} label="Validade em 45 dias" value={stats.expiringLots} />
      </section>

      <section>
        <div className="mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-bold uppercase text-red-700">Módulos enterprise</p>
            <h2 className="mt-1 text-2xl font-black text-ink">Base modular do Workspace</h2>
          </div>
          <p className="text-sm font-semibold text-slate-500">
            {stats.rawMaterials} matérias-primas · {stats.packagingMaterials} embalagens · {stats.pricingModels} precificações
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {workspaceModules.filter((module) => module.slug !== "dashboard").map((module) => {
            const Icon = module.icon;
            return (
              <Link key={module.slug} href={module.href} className="panel group p-5 transition hover:-translate-y-0.5 hover:border-red-200 hover:shadow-lg">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-950 text-white group-hover:bg-red-700">
                    <Icon size={20} aria-hidden="true" />
                  </div>
                  <span className="rounded-full border border-slate-200 px-3 py-1 text-xs font-black uppercase text-slate-500">
                    {module.status}
                  </span>
                </div>
                <h3 className="mt-4 text-lg font-black text-ink">{module.label}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{module.description}</p>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="panel overflow-hidden">
        <div className="flex flex-col justify-between gap-3 border-b border-line px-5 py-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-lg font-black text-ink">Lotes recentes</h2>
            <p className="mt-1 text-sm text-slate-600">Últimas movimentações do módulo preservado de rastreabilidade.</p>
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
                  <td className="table-cell font-black text-red-700">{lot.code}</td>
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

function FoundationItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-3 last:border-0 last:pb-0">
      <span className="text-sm font-semibold text-slate-300">{label}</span>
      <span className="text-sm font-black text-white">{value}</span>
    </div>
  );
}

function ClipboardIcon() {
  return <span className="text-lg leading-none">OP</span>;
}
