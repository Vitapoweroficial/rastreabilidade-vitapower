import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Boxes,
  CheckCircle2,
  CircleDollarSign,
  FileText,
  FlaskConical,
  PackageCheck,
  Sparkles,
  UserRound
} from "lucide-react";
import { privateLabelStages, privateLabelStageProgress } from "@/lib/private-label-config";
import { getPrivateLabelProjectDetail } from "@/lib/private-label-enterprise";
import {
  createProjectFormulaAction,
  createProjectPricingAction,
  createProjectProposalAction,
  updateProjectStageFromDetailAction
} from "./actions";

export const dynamic = "force-dynamic";

type FormulaRow = { id: number; name: string; code: string; version: string; status: string; batch_units: number; net_weight_g: number; responsible: string | null; created_at: string | Date; total_percentage: number; raw_cost: number; packaging_unit_cost: number };
type PricingRow = { id: number; formula_id: number; formula_name: string; batch_units: number; raw_material_cost: number; packaging_cost: number; manufacturing_cost: number; overhead_cost: number; other_cost: number; total_cost: number; unit_cost: number; target_margin_percent: number; suggested_unit_price: number; status: string; notes: string | null; created_at: string | Date };
type ProposalRow = { id: number; pricing_request_id: number; title: string; quantity: number; unit_price: number; total_price: number; validity_days: number; status: string; pdf_status: string; send_status: string; notes: string | null; created_at: string | Date };
type LotRow = { id: number; code: string; status: string; manufacturing_date: string; expiration_date: string; quantity: number; unit: string };

function money(value: number) { return Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); }
function date(value: string | Date) { return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value)); }

export default async function PrivateLabelProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const projectId = Number(id);
  if (!Number.isFinite(projectId)) notFound();
  const detail = await getPrivateLabelProjectDetail(projectId);
  if (!detail) notFound();

  const project = detail.project;
  const formulas = detail.formulas as unknown as FormulaRow[];
  const pricing = detail.pricing as unknown as PricingRow[];
  const proposals = detail.proposals as unknown as ProposalRow[];
  const lots = detail.lots as unknown as LotRow[];
  const stage = privateLabelStages.find((item) => item.id === project.status) ?? privateLabelStages[0];
  const progress = privateLabelStageProgress(stage.id);

  return (
    <div className="space-y-7 pb-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/admin/modulos/private-label" className="btn-secondary"><ArrowLeft size={16} /> Voltar ao pipeline</Link>
        <div className="flex flex-wrap gap-2"><Link href={`/admin/clientes/${project.client_id}`} className="btn-secondary">DNA do cliente</Link><Link href="/admin/engenharia" className="btn-primary">Abrir engenharia</Link></div>
      </div>

      <section className="relative overflow-hidden rounded-[30px] border border-slate-800 bg-slate-950 p-6 text-white shadow-[0_30px_90px_rgba(15,23,42,0.25)] sm:p-8">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-red-600/20 blur-3xl" />
        <div className="relative grid gap-7 xl:grid-cols-[1.25fr_.75fr] xl:items-end">
          <div>
            <div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-red-500/10 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-red-200">Projeto #{project.id}</span><span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-black text-slate-200">{stage.label}</span></div>
            <h1 className="mt-4 text-4xl font-black tracking-[-0.04em] sm:text-5xl">{project.name}</h1>
            <p className="mt-3 text-base font-bold text-slate-300">{project.brand_name}{project.product_name ? ` · ${project.product_name}` : " · produto em definição"}</p>
            <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-red-500 to-amber-300" style={{ width: `${progress}%` }} /></div>
            <p className="mt-2 text-xs font-bold text-slate-400">{progress}% da esteira percorrida</p>
          </div>
          <form action={updateProjectStageFromDetailAction} className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
            <input type="hidden" name="projectId" value={project.id} />
            <label className="text-xs font-black uppercase tracking-[0.15em] text-slate-400">Etapa operacional</label>
            <select name="stageId" defaultValue={stage.id} className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-slate-900 px-3 text-sm font-bold text-white outline-none">{privateLabelStages.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select>
            <button className="btn-primary mt-3 w-full justify-center" type="submit">Atualizar etapa</button>
          </form>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric icon={FlaskConical} label="Fórmulas" value={formulas.length} />
        <Metric icon={CircleDollarSign} label="Precificações" value={pricing.length} />
        <Metric icon={FileText} label="Propostas" value={proposals.length} />
        <Metric icon={PackageCheck} label="Lotes" value={lots.length} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_.85fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.17em] text-red-700">Briefing consolidado</p>
          <h2 className="mt-1 text-xl font-black text-slate-950">O que precisa ser desenvolvido</h2>
          <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-600">{project.briefing || "O projeto ainda não possui resumo de briefing."}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2"><UserRound size={19} className="text-red-700" /><h2 className="text-lg font-black text-slate-950">Cliente</h2></div>
          <p className="mt-4 font-black text-slate-950">{project.brand_name}</p><p className="mt-1 text-sm text-slate-500">{project.legal_name}</p>
          <div className="mt-4 space-y-1 text-sm text-slate-600"><p>{project.contact_name || "Responsável não informado"}</p><p>{project.email || "E-mail não informado"}</p><p>{project.phone || "Telefone não informado"}</p></div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-black uppercase tracking-[0.17em] text-red-700">1. Desenvolvimento técnico</p><h2 className="mt-1 text-2xl font-black text-slate-950">Fórmulas do projeto</h2></div><Link href="/admin/engenharia" className="text-sm font-black text-red-700">Editar composição completa na Engenharia →</Link></div>
        <div className="mt-5 grid gap-4 xl:grid-cols-[.8fr_1.2fr]">
          <form action={createProjectFormulaAction} className="rounded-2xl bg-slate-50 p-4">
            <input type="hidden" name="projectId" value={project.id} />
            <p className="font-black text-slate-950">Criar fórmula vinculada</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2"><Field label="Nome"><input className="field" name="name" required placeholder="Whey 900g" /></Field><Field label="Código"><input className="field" name="code" required placeholder="PL-WHEY-001" /></Field><Field label="Versão"><input className="field" name="version" defaultValue="v1" required /></Field><Field label="Categoria"><input className="field" name="category" /></Field><Field label="Unidades do lote"><input className="field" name="batchUnits" type="number" min="1" defaultValue="1000" required /></Field><Field label="Peso líquido (g)"><input className="field" name="netWeightG" type="number" min="0" step="0.01" placeholder="900" /></Field></div>
            <Field label="Responsável"><input className="field" name="responsible" placeholder="Preenchido com seu nome se vazio" /></Field>
            <button className="btn-primary mt-4 w-full justify-center" type="submit">Criar e iniciar engenharia</button>
          </form>
          <div className="space-y-3">
            {formulas.length === 0 ? <Empty text="Nenhuma fórmula vinculada. Crie a primeira para iniciar a engenharia deste projeto." /> : formulas.map((formula) => <article key={formula.id} className="rounded-2xl border border-slate-200 p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex items-center gap-2"><span className="rounded-full bg-slate-950 px-2.5 py-1 text-[10px] font-black uppercase text-white">{formula.status}</span><span className="text-xs font-bold text-slate-400">{formula.code} · {formula.version}</span></div><h3 className="mt-2 text-lg font-black text-slate-950">{formula.name}</h3><p className="mt-1 text-xs text-slate-500">{formula.batch_units.toLocaleString("pt-BR")} un. · {formula.net_weight_g ? `${formula.net_weight_g}g` : "peso a definir"} · {formula.responsible || "sem responsável"}</p></div><div className="text-right"><p className="text-xs font-bold text-slate-500">MP do lote</p><p className="font-black text-slate-950">{money(formula.raw_cost)}</p></div></div><div className="mt-4 grid grid-cols-3 gap-2"><Small label="Composição" value={`${Number(formula.total_percentage || 0).toFixed(2)}%`} /><Small label="Embalagem/un." value={money(formula.packaging_unit_cost)} /><Small label="Criada" value={date(formula.created_at)} /></div></article>)}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-black uppercase tracking-[0.17em] text-red-700">2. Custo e margem</p><h2 className="mt-1 text-2xl font-black text-slate-950">Precificação industrial</h2>
        {formulas.length > 0 ? <form action={createProjectPricingAction} className="mt-5 grid gap-3 rounded-2xl bg-slate-50 p-4 md:grid-cols-2 xl:grid-cols-6"><input type="hidden" name="projectId" value={project.id} /><Field label="Fórmula"><select className="field" name="formulaId" required>{formulas.map((f) => <option key={f.id} value={f.id}>{f.code} · {f.version} · {f.name}</option>)}</select></Field><Field label="Fabricação / lote"><input className="field" name="manufacturingCost" type="number" min="0" step="0.01" defaultValue="0" /></Field><Field label="Overhead / lote"><input className="field" name="overheadCost" type="number" min="0" step="0.01" defaultValue="0" /></Field><Field label="Outros / lote"><input className="field" name="otherCost" type="number" min="0" step="0.01" defaultValue="0" /></Field><Field label="Margem alvo %"><input className="field" name="targetMarginPercent" type="number" min="0" max="99.99" step="0.01" defaultValue="0" /></Field><Field label="Observação"><input className="field" name="notes" placeholder="Frete, condições..." /></Field><button className="btn-primary md:col-span-2 xl:col-span-6" type="submit">Calcular snapshot de precificação</button></form> : null}
        <div className="mt-5 space-y-3">{pricing.length === 0 ? <Empty text="Nenhuma precificação ainda. A composição e as embalagens precisam estar cadastradas antes de fechar o custo." /> : pricing.map((item) => <article key={item.id} className="rounded-2xl border border-slate-200 p-4"><div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between"><div><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase text-emerald-700">{item.status}</span><h3 className="mt-2 font-black text-slate-950">{item.formula_name}</h3><p className="mt-1 text-xs text-slate-500">Snapshot #{item.id} · {date(item.created_at)} · {item.batch_units.toLocaleString("pt-BR")} un.</p></div><div className="grid grid-cols-2 gap-2 sm:grid-cols-4"><Small label="Custo total" value={money(item.total_cost)} /><Small label="Custo/un." value={money(item.unit_cost)} /><Small label="Margem alvo" value={`${Number(item.target_margin_percent).toFixed(2)}%`} /><Small label="Preço sugerido" value={money(item.suggested_unit_price)} /></div></div><div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-slate-500"><span>MP {money(item.raw_material_cost)}</span><span>•</span><span>Embalagens {money(item.packaging_cost)}</span><span>•</span><span>Fabricação {money(item.manufacturing_cost)}</span><span>•</span><span>Overhead {money(item.overhead_cost)}</span><span>•</span><span>Outros {money(item.other_cost)}</span></div></article>)}</div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-black uppercase tracking-[0.17em] text-red-700">3. Comercial</p><h2 className="mt-1 text-2xl font-black text-slate-950">Proposta pronta para decisão</h2>
        {pricing.length > 0 ? <form action={createProjectProposalAction} className="mt-5 grid gap-3 rounded-2xl bg-slate-50 p-4 md:grid-cols-[1fr_180px_1fr_auto]"><input type="hidden" name="projectId" value={project.id} /><Field label="Precificação"><select className="field" name="pricingRequestId" required>{pricing.map((p) => <option key={p.id} value={p.id}>#{p.id} · {p.formula_name} · {money(p.suggested_unit_price)}/un.</option>)}</select></Field><Field label="Validade (dias)"><input className="field" name="validityDays" type="number" min="1" max="180" defaultValue="15" /></Field><Field label="Condições / observações"><input className="field" name="notes" placeholder="Pagamento, frete, escopo..." /></Field><button className="btn-primary self-end" type="submit">Gerar proposta</button></form> : null}
        <div className="mt-5 grid gap-3 lg:grid-cols-2">{proposals.length === 0 ? <div className="lg:col-span-2"><Empty text="Nenhuma proposta gerada para este projeto." /></div> : proposals.map((proposal) => <article key={proposal.id} className="rounded-2xl border border-slate-200 p-4"><div className="flex items-start justify-between gap-3"><div><span className="rounded-full bg-red-50 px-2.5 py-1 text-[10px] font-black uppercase text-red-700">{proposal.status}</span><h3 className="mt-2 font-black text-slate-950">{proposal.title}</h3><p className="mt-1 text-xs text-slate-500">Validade: {proposal.validity_days} dias · PDF {proposal.pdf_status} · {proposal.send_status}</p></div><FileText size={22} className="text-red-700" /></div><div className="mt-4 grid grid-cols-3 gap-2"><Small label="Quantidade" value={`${proposal.quantity.toLocaleString("pt-BR")} un.`} /><Small label="Preço/un." value={money(proposal.unit_price)} /><Small label="Total" value={money(proposal.total_price)} /></div>{proposal.notes ? <p className="mt-3 text-xs leading-5 text-slate-500">{proposal.notes}</p> : null}</article>)}</div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2"><Boxes size={20} className="text-red-700" /><div><p className="text-xs font-black uppercase tracking-[0.17em] text-red-700">4. Produção e rastreabilidade</p><h2 className="text-xl font-black text-slate-950">Lotes do produto</h2></div></div>
        <div className="mt-5 grid gap-3 lg:grid-cols-2">{lots.length === 0 ? <div className="lg:col-span-2"><Empty text="Ainda não há lote produzido. Quando a proposta for aprovada, o projeto segue para produção e o lote fecha a rastreabilidade." /></div> : lots.map((lot) => <article key={lot.id} className="rounded-2xl border border-slate-200 p-4"><div className="flex items-center justify-between"><div><p className="font-black text-red-700">{lot.code}</p><p className="mt-1 text-xs text-slate-500">{lot.quantity} {lot.unit} · fabricação {lot.manufacturing_date} · validade {lot.expiration_date}</p></div><span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase text-slate-600">{lot.status}</span></div></article>)}</div>
      </section>

      <section className="rounded-[24px] border border-emerald-200 bg-gradient-to-r from-emerald-50 to-white p-5"><div className="flex items-start gap-3"><CheckCircle2 className="mt-0.5 shrink-0 text-emerald-600" size={22} /><div><p className="font-black text-emerald-950">Fluxo conectado</p><p className="mt-1 text-sm leading-6 text-emerald-900/70">Briefing, cliente, projeto, fórmula, lote econômico, precificação, proposta e rastreabilidade agora compartilham o mesmo contexto. Cada evolução mantém o DNA do projeto em vez de exigir redigitação.</p></div></div></section>
    </div>
  );
}

function Metric({ icon: Icon, label, value }: { icon: typeof Sparkles; label: string; value: number }) { return <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-center justify-between"><div className="grid h-10 w-10 place-items-center rounded-xl bg-slate-950 text-white"><Icon size={18} /></div><span className="text-2xl font-black text-slate-950">{value}</span></div><p className="mt-3 text-sm font-bold text-slate-600">{label}</p></div>; }
function Small({ label, value }: { label: string; value: string }) { return <div className="rounded-xl bg-slate-50 p-2.5"><p className="text-[10px] font-black uppercase tracking-wide text-slate-400">{label}</p><p className="mt-1 text-sm font-black text-slate-900">{value}</p></div>; }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block space-y-1.5"><span className="text-[11px] font-black uppercase tracking-wide text-slate-500">{label}</span>{children}</label>; }
function Empty({ text }: { text: string }) { return <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm font-semibold text-slate-500">{text}</div>; }
