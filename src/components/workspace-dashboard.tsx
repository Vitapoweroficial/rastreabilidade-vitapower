"use client";

import { useDeferredValue, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BarChart3,
  Boxes,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  ClipboardCheck,
  Clock3,
  Factory,
  FileBadge2,
  FlaskConical,
  Landmark,
  PackageCheck,
  PackageOpen,
  Search,
  Settings2,
  ShoppingCart,
  Sparkles,
  UsersRound,
  Warehouse,
  X,
} from "lucide-react";

export type WorkspaceDashboardStats = {
  activeClients: number;
  totalLots: number;
  activeProjects: number;
  formulas: number;
  activeProducts: number;
  releasedLots: number;
  quarantineLots: number;
  expiringLots: number;
  rawMaterials: number;
  packagingMaterials: number;
  pricingModels: number;
};

export type WorkspaceModuleView = {
  slug: string;
  href: string;
  label: string;
  description: string;
  status: string;
};

export type RecentLotView = {
  id: number | string;
  code: string;
  clientBrandName: string;
  productName: string;
  sku: string;
  expirationDate: string;
  quantity: string;
  status: string;
};

type Props = {
  stats: WorkspaceDashboardStats;
  modules: WorkspaceModuleView[];
  recentLots: RecentLotView[];
};

const moduleIcons = {
  crm: UsersRound,
  "private-label": ClipboardCheck,
  engenharia: FlaskConical,
  pcp: Factory,
  qualidade: ClipboardCheck,
  regulatorio: FileBadge2,
  rastreabilidade: PackageCheck,
  compras: ShoppingCart,
  estoque: Warehouse,
  financeiro: Landmark,
  configuracoes: Settings2,
} as const;

const metrics = [
  ["activeClients", "Clientes ativos", UsersRound],
  ["totalLots", "Lotes cadastrados", PackageOpen],
  ["activeProjects", "Projetos ativos", ClipboardCheck],
  ["formulas", "Fórmulas", FlaskConical],
  ["activeProducts", "Produtos ativos", Boxes],
  ["releasedLots", "Lotes liberados", CheckCircle2],
  ["quarantineLots", "Em quarentena", Clock3],
  ["expiringLots", "Validade em 45 dias", PackageCheck],
] as const;

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function statusTone(status: string) {
  const value = normalize(status);
  if (value.includes("ativa") || value.includes("ativo") || value.includes("preservado") || value.includes("liberado")) {
    return "border-emerald-400/25 bg-emerald-400/10 text-emerald-200";
  }
  if (value.includes("arquitetado") || value.includes("quarentena")) {
    return "border-amber-400/25 bg-amber-400/10 text-amber-200";
  }
  return "border-white/10 bg-white/[0.05] text-slate-300";
}

export function WorkspaceDashboard({ stats, modules, recentLots }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [moduleFilter, setModuleFilter] = useState<"all" | "active" | "planned">("all");
  const [isPending, startTransition] = useTransition();

  const activeModules = modules.filter((module) => {
    const status = normalize(module.status);
    return status.includes("ativa") || status.includes("ativo") || status.includes("preservado") || status.includes("mvp");
  }).length;

  const filteredModules = useMemo(() => {
    const term = normalize(deferredQuery.trim());
    return modules.filter((module) => {
      const status = normalize(module.status);
      const active = status.includes("ativa") || status.includes("ativo") || status.includes("preservado") || status.includes("mvp");
      const matchesFilter = moduleFilter === "all" || (moduleFilter === "active" ? active : !active);
      const matchesQuery = !term || normalize(`${module.label} ${module.description} ${module.status}`).includes(term);
      return matchesFilter && matchesQuery;
    });
  }, [deferredQuery, moduleFilter, modules]);

  const filteredLots = useMemo(() => {
    const term = normalize(deferredQuery.trim());
    if (!term) return recentLots;
    return recentLots.filter((lot) => normalize(`${lot.code} ${lot.clientBrandName} ${lot.productName} ${lot.sku} ${lot.status}`).includes(term));
  }, [deferredQuery, recentLots]);

  function navigate(href: string) {
    startTransition(() => router.push(href));
  }

  return (
    <div className="relative space-y-7 pb-8">
      <div
        className={[
          "pointer-events-none fixed inset-x-0 top-0 z-50 h-0.5 origin-left bg-gradient-to-r from-red-600 via-red-400 to-amber-300 transition-transform duration-300",
          isPending ? "scale-x-100 opacity-100" : "scale-x-0 opacity-0",
        ].join(" ")}
      />

      <section className="relative overflow-hidden rounded-[28px] border border-slate-800 bg-slate-950 text-white shadow-[0_28px_80px_rgba(15,23,42,0.24)]">
        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-red-600/20 blur-3xl" />
        <div className="absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-amber-400/10 blur-3xl" />
        <div className="relative grid gap-8 p-6 sm:p-8 xl:grid-cols-[1.25fr_.75fr] xl:p-10">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-red-400/20 bg-red-500/10 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-red-200">
                <Sparkles size={14} /> Vita Power Workspace
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-200">
                <CircleDot size={12} className="animate-pulse" /> Operação conectada
              </span>
            </div>

            <h1 className="mt-5 max-w-4xl text-4xl font-black tracking-[-0.04em] sm:text-5xl xl:text-6xl">
              A operação inteira em uma visão viva.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
              Navegue pelos módulos, encontre registros em segundos e acompanhe os sinais mais importantes da fábrica sem perder o contexto.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <button onClick={() => navigate("/admin/lotes")} className="group inline-flex min-h-11 items-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-black text-white shadow-lg shadow-red-950/30 transition hover:-translate-y-0.5 hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-300">
                <PackageCheck size={18} /> Novo lote rastreável
                <ArrowRight size={16} className="transition group-hover:translate-x-0.5" />
              </button>
              <button onClick={() => navigate("/admin/engenharia")} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/15 bg-white/[0.07] px-4 text-sm font-black text-white backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/[0.12] focus:outline-none focus:ring-2 focus:ring-white/30">
                <FlaskConical size={18} /> Abrir engenharia
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-5 backdrop-blur-xl sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Fundação digital</p>
                <p className="mt-1 text-2xl font-black">{activeModules}/{modules.length} módulos ativos</p>
              </div>
              <div className="grid h-12 w-12 place-items-center rounded-2xl border border-red-400/20 bg-red-500/10 text-red-200">
                <BarChart3 size={22} />
              </div>
            </div>
            <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-gradient-to-r from-red-600 to-amber-300 transition-all duration-700" style={{ width: `${Math.max(8, Math.round((activeModules / Math.max(1, modules.length)) * 100))}%` }} />
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3">
              {[
                ["Banco", "Neon Postgres"],
                ["Rastreabilidade", "Preservada"],
                ["Busca", "Instantânea"],
                ["Interface", "Responsiva"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl border border-white/10 bg-slate-950/35 p-3">
                  <p className="text-xs font-semibold text-slate-400">{label}</p>
                  <p className="mt-1 text-sm font-black text-white">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="sticky top-3 z-20 rounded-2xl border border-slate-200/80 bg-white/90 p-3 shadow-[0_18px_50px_rgba(15,23,42,0.10)] backdrop-blur-xl sm:p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar módulo, lote, cliente, SKU ou status..."
              className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-10 text-sm font-semibold text-slate-900 outline-none transition focus:border-red-300 focus:bg-white focus:ring-4 focus:ring-red-100"
            />
            {query ? (
              <button onClick={() => setQuery("")} aria-label="Limpar busca" className="absolute right-2.5 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-200 hover:text-slate-700">
                <X size={16} />
              </button>
            ) : null}
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 lg:pb-0">
            {[
              ["all", "Todos"],
              ["active", "Ativos"],
              ["planned", "Roadmap"],
            ].map(([value, label]) => (
              <button
                key={value}
                onClick={() => setModuleFilter(value as typeof moduleFilter)}
                className={[
                  "min-h-10 whitespace-nowrap rounded-xl px-4 text-sm font-black transition",
                  moduleFilter === value ? "bg-slate-950 text-white shadow-md" : "bg-slate-100 text-slate-600 hover:bg-slate-200",
                ].join(" ")}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        {query ? (
          <p className="mt-3 px-1 text-xs font-semibold text-slate-500">
            {filteredModules.length} módulos e {filteredLots.length} lotes correspondem a “{query}”.
          </p>
        ) : null}
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(([key, label, Icon]) => (
          <div key={key} className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-red-200 hover:shadow-lg">
            <div className="flex items-center justify-between gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-slate-950 text-white transition group-hover:bg-red-600">
                <Icon size={19} />
              </div>
              <span className="text-2xl font-black tracking-tight text-slate-950">{stats[key]}</span>
            </div>
            <p className="mt-3 text-sm font-bold text-slate-600">{label}</p>
          </div>
        ))}
      </section>

      <section>
        <div className="mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Módulos enterprise</p>
            <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">Escolha onde agir agora</h2>
          </div>
          <p className="text-sm font-semibold text-slate-500">{stats.rawMaterials} matérias-primas · {stats.packagingMaterials} embalagens · {stats.pricingModels} precificações</p>
        </div>

        {filteredModules.length ? (
          <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {filteredModules.map((module) => {
              const Icon = moduleIcons[module.slug as keyof typeof moduleIcons] ?? Boxes;
              return (
                <button
                  key={module.slug}
                  onClick={() => navigate(module.href)}
                  className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition duration-200 hover:-translate-y-1 hover:border-red-200 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-red-100"
                >
                  <div className="absolute right-0 top-0 h-24 w-24 translate-x-10 -translate-y-10 rounded-full bg-red-500/0 blur-2xl transition group-hover:bg-red-500/10" />
                  <div className="relative flex items-start justify-between gap-4">
                    <div className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-950 text-white shadow-lg transition group-hover:scale-105 group-hover:bg-red-600">
                      <Icon size={21} />
                    </div>
                    <span className={`rounded-full border px-2.5 py-1 text-[11px] font-black uppercase tracking-wide ${statusTone(module.status)}`}>{module.status}</span>
                  </div>
                  <h3 className="relative mt-5 text-lg font-black text-slate-950">{module.label}</h3>
                  <p className="relative mt-2 min-h-12 text-sm leading-6 text-slate-600">{module.description}</p>
                  <div className="relative mt-4 flex items-center justify-between border-t border-slate-100 pt-4 text-sm font-black text-red-700">
                    Abrir módulo <ChevronRight size={18} className="transition group-hover:translate-x-1" />
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <Search className="mx-auto text-slate-400" />
            <p className="mt-3 font-black text-slate-900">Nenhum módulo encontrado</p>
            <button onClick={() => { setQuery(""); setModuleFilter("all"); }} className="mt-3 text-sm font-black text-red-700 hover:text-red-600">Limpar filtros</button>
          </div>
        )}
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-3 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Rastreabilidade</p>
            <h2 className="mt-1 text-xl font-black text-slate-950">Lotes recentes</h2>
          </div>
          <button onClick={() => navigate("/admin/lotes")} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-black text-slate-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700">
            Ver todos <ArrowRight size={16} />
          </button>
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[780px] border-collapse text-left">
            <thead>
              <tr className="bg-slate-50 text-xs font-black uppercase tracking-wide text-slate-500">
                <th className="px-5 py-3">Lote</th>
                <th className="px-5 py-3">Cliente</th>
                <th className="px-5 py-3">Produto</th>
                <th className="px-5 py-3">Validade</th>
                <th className="px-5 py-3">Quantidade</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredLots.map((lot) => (
                <tr key={lot.id} className="border-t border-slate-100 transition hover:bg-slate-50/80">
                  <td className="px-5 py-4 font-black text-red-700">{lot.code}</td>
                  <td className="px-5 py-4 text-sm font-semibold text-slate-700">{lot.clientBrandName}</td>
                  <td className="px-5 py-4"><span className="block text-sm font-black text-slate-900">{lot.productName}</span><span className="text-xs text-slate-500">{lot.sku}</span></td>
                  <td className="px-5 py-4 text-sm text-slate-600">{lot.expirationDate}</td>
                  <td className="px-5 py-4 text-sm font-semibold text-slate-700">{lot.quantity}</td>
                  <td className="px-5 py-4"><span className={`rounded-full border px-2.5 py-1 text-xs font-black ${statusTone(lot.status)}`}>{lot.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="divide-y divide-slate-100 md:hidden">
          {filteredLots.map((lot) => (
            <div key={lot.id} className="p-4 transition active:bg-slate-50">
              <div className="flex items-start justify-between gap-3">
                <div><p className="font-black text-red-700">{lot.code}</p><p className="mt-1 text-sm font-black text-slate-900">{lot.productName}</p></div>
                <span className={`rounded-full border px-2 py-1 text-[11px] font-black ${statusTone(lot.status)}`}>{lot.status}</span>
              </div>
              <p className="mt-2 text-sm font-semibold text-slate-600">{lot.clientBrandName} · {lot.sku}</p>
              <div className="mt-3 flex justify-between text-xs font-semibold text-slate-500"><span>Val. {lot.expirationDate}</span><span>{lot.quantity}</span></div>
            </div>
          ))}
        </div>

        {!filteredLots.length ? <div className="p-8 text-center text-sm font-semibold text-slate-500">Nenhum lote corresponde à busca atual.</div> : null}
      </section>
    </div>
  );
}
