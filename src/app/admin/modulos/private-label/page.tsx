import Link from "next/link";
import { ArrowRight, Boxes, ClipboardList, FileText, FlaskConical, PackageCheck, Sparkles, Tags, UsersRound } from "lucide-react";
import { listActiveClients, listActiveProducts } from "@/lib/repository";
import { getPrivateLabelMetrics, listPrivateLabelProjects } from "@/lib/private-label-repository";
import { privateLabelStages, privateLabelStageProgress } from "@/lib/private-label-config";
import { createPrivateLabelProjectAction, updatePrivateLabelProjectStageAction } from "./actions";

export const dynamic = "force-dynamic";

const metricCards = [
  ["clients", "Clientes", UsersRound],
  ["projects", "Projetos", ClipboardList],
  ["formulas", "Fórmulas", FlaskConical],
  ["pricing", "Precificações", Tags],
  ["proposals", "Propostas", FileText],
  ["lots", "Lotes", PackageCheck]
] as const;

export default async function PrivateLabelModulePage() {
  const [projects, metrics, clients, products] = await Promise.all([
    listPrivateLabelProjects(),
    getPrivateLabelMetrics(),
    listActiveClients(),
    listActiveProducts()
  ]);

  return (
    <div className="space-y-7 pb-8">
      <section className="relative overflow-hidden rounded-[28px] border border-slate-800 bg-slate-950 p-6 text-white shadow-[0_28px_80px_rgba(15,23,42,0.24)] sm:p-8">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-red-600/20 blur-3xl" />
        <div className="relative grid gap-8 xl:grid-cols-[1.15fr_.85fr] xl:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-red-400/20 bg-red-500/10 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-red-200">
              <Sparkles size={14} /> Private Label operacional
            </div>
            <h1 className="mt-5 max-w-4xl text-4xl font-black tracking-[-0.04em] sm:text-5xl">
              Do primeiro briefing ao lote entregue, sem perder o fio do projeto.
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300">
              Cliente, produto, fórmula, embalagem, precificação, proposta, produção e rastreabilidade conectados no mesmo fluxo.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/admin/modulos/private-label/questionario" className="btn-primary bg-red-600 hover:bg-red-500">
                <ClipboardList size={18} /> Abrir briefing completo
              </Link>
              <Link href="/admin/engenharia" className="btn-secondary border-white/15 bg-white/[0.08] text-white hover:bg-white/[0.14]">
                <FlaskConical size={18} /> Abrir engenharia
              </Link>
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-5 backdrop-blur-xl">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Esteira industrial</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {privateLabelStages.map((stage, index) => (
                <span key={stage.id} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-950/40 px-3 py-2 text-xs font-bold text-slate-200">
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-red-600 text-[10px] font-black text-white">{index + 1}</span>
                  {stage.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        {metricCards.map(([key, label, Icon]) => (
          <div key={key} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-slate-950 text-white"><Icon size={18} /></div>
              <span className="text-2xl font-black text-slate-950">{metrics[key]}</span>
            </div>
            <p className="mt-3 text-sm font-bold text-slate-600">{label}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 2xl:grid-cols-[380px_1fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Novo projeto</p>
          <h2 className="mt-2 text-xl font-black text-slate-950">Abrir desenvolvimento</h2>
          <form action={createPrivateLabelProjectAction} className="mt-5 space-y-4">
            <div>
              <label className="label" htmlFor="clientId">Cliente</label>
              <select className="field" id="clientId" name="clientId" required defaultValue="">
                <option value="" disabled>Selecione o cliente</option>
                {clients.map((client) => <option key={client.id} value={client.id}>{client.brandName}</option>)}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="productId">Produto existente (opcional)</label>
              <select className="field" id="productId" name="productId" defaultValue="0">
                <option value="0">Novo produto / ainda sem SKU</option>
                {products.map((product) => <option key={product.id} value={product.id}>{product.clientBrandName} · {product.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="name">Nome do projeto</label>
              <input className="field" id="name" name="name" required placeholder="Ex.: Whey 900g - lançamento" />
            </div>
            <div>
              <label className="label" htmlFor="briefing">Resumo do briefing</label>
              <textarea className="field min-h-28" id="briefing" name="briefing" placeholder="Objetivo, quantidade, sabor, embalagem, prazo e pontos críticos." />
            </div>
            <button className="btn-primary w-full" type="submit">Criar projeto <ArrowRight size={17} /></button>
          </form>
        </div>

        <div className="space-y-4">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Projetos em andamento</p>
              <h2 className="mt-1 text-2xl font-black text-slate-950">Pipeline Private Label</h2>
            </div>
            <p className="text-sm font-semibold text-slate-500">{projects.length} projeto(s) no histórico</p>
          </div>

          {projects.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm font-semibold text-slate-500">
              Nenhum projeto ainda. Abra o primeiro desenvolvimento ao lado.
            </div>
          ) : projects.map((project) => {
            const progress = privateLabelStageProgress(project.stageId);
            return (
              <article key={project.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-black text-red-700">{project.stageLabel}</span>
                      <span className="text-xs font-bold text-slate-400">Projeto #{project.id}</span>
                    </div>
                    <h3 className="mt-3 text-xl font-black text-slate-950">{project.name}</h3>
                    <p className="mt-1 text-sm font-bold text-slate-600">{project.clientBrandName}{project.productName ? ` · ${project.productName}` : " · produto em definição"}</p>
                    {project.briefing ? <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">{project.briefing}</p> : null}
                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-gradient-to-r from-red-600 to-amber-400 transition-all" style={{ width: `${progress}%` }} />
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold text-slate-500">
                      <span className="rounded-lg bg-slate-100 px-2.5 py-1.5">{project.formulaCount} fórmula(s)</span>
                      <span className="rounded-lg bg-slate-100 px-2.5 py-1.5">{project.pricingCount} precificação(ões)</span>
                      <span className="rounded-lg bg-slate-100 px-2.5 py-1.5">{project.proposalCount} proposta(s)</span>
                      <span className="rounded-lg bg-slate-100 px-2.5 py-1.5">{project.lotCount} lote(s)</span>
                    </div>
                  </div>
                  <div className="flex w-full flex-col gap-2 xl:w-64">
                    <Link href={`/admin/clientes/${project.clientId}`} className="btn-secondary w-full justify-center">Abrir DNA do cliente</Link>
                    <form action={updatePrivateLabelProjectStageAction} className="flex gap-2">
                      <input type="hidden" name="projectId" value={project.id} />
                      <select name="stageId" defaultValue={project.stageId} className="field h-11 flex-1 py-0 text-sm">
                        {privateLabelStages.map((stage) => <option key={stage.id} value={stage.id}>{stage.label}</option>)}
                      </select>
                      <button type="submit" className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-slate-950 text-white transition hover:bg-red-700" aria-label="Atualizar etapa"><ArrowRight size={17} /></button>
                    </form>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Link href="/admin/clientes" className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-red-200 hover:shadow-xl">
          <UsersRound className="text-red-700" size={26} /><h3 className="mt-4 text-lg font-black">CRM / Clientes</h3><p className="mt-2 text-sm leading-6 text-slate-600">Cadastre o cliente e concentre o DNA completo da operação.</p>
        </Link>
        <Link href="/admin/engenharia" className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-red-200 hover:shadow-xl">
          <FlaskConical className="text-red-700" size={26} /><h3 className="mt-4 text-lg font-black">Engenharia + custos</h3><p className="mt-2 text-sm leading-6 text-slate-600">Fórmula, matérias-primas, embalagens, precificação e proposta.</p>
        </Link>
        <Link href="/admin/lotes" className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-red-200 hover:shadow-xl">
          <Boxes className="text-red-700" size={26} /><h3 className="mt-4 text-lg font-black">Produção + lote</h3><p className="mt-2 text-sm leading-6 text-slate-600">Feche o ciclo transformando o projeto aprovado em lote rastreável.</p>
        </Link>
      </section>
    </div>
  );
}
