import Link from "next/link";
import { notFound } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { ArrowLeft, Boxes, ClipboardList, FileInput, FileText, FlaskConical, Mail, PackageCheck, Phone, Tags } from "lucide-react";
import { privateLabelSteps } from "@/components/private-label/questionnaire-data";
import { formatDateTime } from "@/lib/format";
import { listPrivateLabelBriefingsForClient } from "@/lib/private-label-briefings";
import { getClientDNA } from "@/lib/private-label-repository";
import { privateLabelStageProgress } from "@/lib/private-label-config";

type PageProps = { params: Promise<{ id: string }> };
type MetricCard = { label: string; value: number; icon: LucideIcon };

function money(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function briefingValue(value: string | boolean | undefined) {
  if (typeof value === "boolean") return value ? "Sim" : "Não";
  const normalized = String(value ?? "").trim();
  return normalized || "—";
}

export const dynamic = "force-dynamic";

export default async function ClientDNAPage({ params }: PageProps) {
  const { id } = await params;
  const clientId = Number(id);
  if (!Number.isFinite(clientId)) notFound();

  const [dna, briefings] = await Promise.all([
    getClientDNA(clientId),
    listPrivateLabelBriefingsForClient(clientId)
  ]);
  if (!dna) notFound();

  const { client, products, projects, formulas, proposals, lots } = dna;
  const metrics: MetricCard[] = [
    { label: "Briefings", value: briefings.length, icon: FileInput },
    { label: "Produtos", value: products.length, icon: Boxes },
    { label: "Projetos", value: projects.length, icon: ClipboardList },
    { label: "Fórmulas", value: formulas.length, icon: FlaskConical },
    { label: "Propostas", value: proposals.length, icon: FileText },
    { label: "Lotes", value: lots.length, icon: PackageCheck }
  ];

  return (
    <div className="space-y-7 pb-8">
      <Link href="/admin/clientes" className="btn-secondary w-fit"><ArrowLeft size={16} /> Voltar aos clientes</Link>

      <section className="relative overflow-hidden rounded-[28px] border border-slate-800 bg-slate-950 p-6 text-white shadow-[0_28px_80px_rgba(15,23,42,0.24)] sm:p-8">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-red-600/20 blur-3xl" />
        <div className="relative grid gap-6 xl:grid-cols-[1.2fr_.8fr] xl:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-red-200">DNA do cliente</p>
            <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">{client.brandName}</h1>
            <p className="mt-3 text-base text-slate-300">{client.legalName}</p>
            <div className="mt-5 flex flex-wrap gap-2 text-sm text-slate-300">
              {client.taxId ? <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5">{client.taxId}</span> : null}
              <span className={`rounded-full border px-3 py-1.5 font-bold ${client.active ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200" : "border-slate-400/20 bg-slate-400/10 text-slate-300"}`}>{client.active ? "Cliente ativo" : "Cliente inativo"}</span>
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-5">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Contato principal</p>
            <p className="mt-3 text-lg font-black">{client.contactName ?? "Responsável não informado"}</p>
            <div className="mt-3 space-y-2 text-sm text-slate-300">
              {client.email ? <div className="flex items-center gap-2"><Mail size={15} /> {client.email}</div> : null}
              {client.phone ? <div className="flex items-center gap-2"><Phone size={15} /> {client.phone}</div> : null}
              <div className="text-xs text-slate-400">Cliente desde {formatDateTime(client.createdAt)}</div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        {metrics.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between"><div className="grid h-10 w-10 place-items-center rounded-xl bg-slate-950 text-white"><Icon size={18} /></div><span className="text-2xl font-black">{value}</span></div>
            <p className="mt-3 text-sm font-bold text-slate-600">{label}</p>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Entrada do cliente</p><h2 className="mt-1 text-2xl font-black">Briefings recebidos</h2><p className="mt-1 text-sm text-slate-500">Respostas originais enviadas pelo cliente, preservadas no histórico.</p></div>
          <Link href="/private-label/briefing" className="btn-secondary">Abrir formulário público</Link>
        </div>
        <div className="mt-5 space-y-3">
          {briefings.length === 0 ? <Empty text="Nenhum briefing enviado pelo formulário integrado." /> : briefings.map((briefing) => (
            <details key={briefing.id} className="group rounded-2xl border border-slate-200 bg-slate-50 p-4 open:bg-white">
              <summary className="cursor-pointer list-none">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div><div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">Recebido</span><span className="text-xs font-bold text-slate-400">VP-PL-{String(briefing.id).padStart(5, "0")}</span></div><p className="mt-2 text-lg font-black text-slate-950">{briefingValue(briefing.answers.projectName)} · {briefingValue(briefing.answers.productName)}</p><p className="mt-1 text-xs text-slate-500">Enviado em {formatDateTime(briefing.submittedAt)}</p></div>
                  <span className="text-sm font-black text-red-700">Ver briefing completo</span>
                </div>
              </summary>
              <div className="mt-5 space-y-3 border-t border-slate-200 pt-5">
                {privateLabelSteps.filter((section) => section.questions.length > 0).map((section) => (
                  <div key={section.id} className="rounded-xl border border-slate-100 bg-white p-4">
                    <h3 className="font-black text-slate-950">{section.eyebrow}. {section.title}</h3>
                    <dl className="mt-3 grid gap-3 md:grid-cols-2">
                      {section.questions.map((question) => <div key={question.id}><dt className="text-[11px] font-black uppercase tracking-wide text-slate-400">{question.label}</dt><dd className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{briefingValue(briefing.answers[question.id])}</dd></div>)}
                    </dl>
                  </div>
                ))}
              </div>
            </details>
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_.85fr]">
        <div className="space-y-4">
          <div><p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Projetos</p><h2 className="mt-1 text-2xl font-black">Linha do tempo Private Label</h2></div>
          {projects.length === 0 ? <Empty text="Nenhum projeto ligado a este cliente." /> : projects.map((project) => (
            <article key={project.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3"><div><span className="rounded-full bg-red-50 px-3 py-1 text-xs font-black text-red-700">{project.stageLabel}</span><h3 className="mt-3 text-lg font-black">{project.name}</h3><p className="mt-1 text-sm font-semibold text-slate-500">{project.productName ?? "Produto em definição"}</p></div><Link href="/admin/modulos/private-label" className="btn-secondary">Abrir pipeline</Link></div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-r from-red-600 to-amber-400" style={{ width: `${privateLabelStageProgress(project.stageId)}%` }} /></div>
              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4"><Mini label="Fórmulas" value={project.formulaCount} /><Mini label="Precificações" value={project.pricingCount} /><Mini label="Propostas" value={project.proposalCount} /><Mini label="Lotes" value={project.lotCount} /></div>
            </article>
          ))}
        </div>

        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between"><div><p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Produtos</p><h2 className="mt-1 text-xl font-black">Portfólio do cliente</h2></div><Link href="/admin/produtos" className="text-sm font-black text-red-700">Gerenciar</Link></div>
            <div className="mt-4 space-y-3">{products.length === 0 ? <p className="text-sm text-slate-500">Nenhum produto cadastrado.</p> : products.map((product) => <div key={product.id} className="rounded-xl bg-slate-50 p-3"><div className="flex items-center justify-between gap-3"><div><p className="font-black">{product.name}</p><p className="text-xs text-slate-500">{product.sku} · {product.category ?? "Sem categoria"}</p></div><span className={`text-xs font-black ${product.active ? "text-emerald-700" : "text-slate-400"}`}>{product.active ? "Ativo" : "Inativo"}</span></div></div>)}</div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between"><div><p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Engenharia</p><h2 className="mt-1 text-xl font-black">Fórmulas e custo</h2></div><Link href="/admin/engenharia" className="text-sm font-black text-red-700">Abrir</Link></div>
            <div className="mt-4 space-y-3">{formulas.length === 0 ? <p className="text-sm text-slate-500">Nenhuma fórmula vinculada.</p> : formulas.map((formula) => <div key={formula.id} className="rounded-xl bg-slate-50 p-3"><div className="flex items-center justify-between gap-3"><div><p className="font-black">{formula.name}</p><p className="text-xs text-slate-500">{formula.code} · v{formula.version} · {formula.status}</p></div><span className="text-sm font-black text-slate-900">{money(formula.total_cost)}</span></div></div>)}</div>
          </section>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center gap-2"><Tags className="text-red-700" size={20} /><h2 className="text-lg font-black">Propostas comerciais</h2></div><div className="mt-4 space-y-3">{proposals.length === 0 ? <p className="text-sm text-slate-500">Nenhuma proposta gerada.</p> : proposals.map((proposal) => <div key={proposal.id} className="rounded-xl border border-slate-100 p-3"><p className="font-black">{proposal.title}</p><p className="mt-1 text-xs font-bold text-slate-500">PDF: {proposal.pdf_status} · envio: {proposal.send_status}</p></div>)}</div></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center gap-2"><PackageCheck className="text-red-700" size={20} /><h2 className="text-lg font-black">Histórico de lotes</h2></div><div className="mt-4 space-y-3">{lots.length === 0 ? <p className="text-sm text-slate-500">Nenhum lote produzido para este cliente.</p> : lots.map((lot) => <div key={lot.id} className="rounded-xl border border-slate-100 p-3"><div className="flex items-center justify-between gap-3"><div><p className="font-black text-red-700">{lot.code}</p><p className="text-xs text-slate-500">{lot.product_name} · validade {lot.expiration_date}</p></div><span className="text-xs font-black uppercase text-slate-600">{lot.status}</span></div></div>)}</div></div>
      </section>
    </div>
  );
}

function Empty({ text }: { text: string }) { return <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm font-semibold text-slate-500">{text}</div>; }
function Mini({ label, value }: { label: string; value: number }) { return <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs font-bold text-slate-500">{label}</p><p className="mt-1 text-lg font-black">{value}</p></div>; }
