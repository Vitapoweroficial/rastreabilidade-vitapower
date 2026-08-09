import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { PrintProposalButton } from "@/components/print-proposal-button";
import { getCommercialProposalDocument } from "@/lib/private-label-production";

export const dynamic = "force-dynamic";

function money(value: unknown) { return Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); }
function date(value: unknown) { return new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" }).format(new Date(String(value))); }

export default async function ProposalDocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const proposalId = Number(id);
  if (!Number.isFinite(proposalId)) notFound();
  const proposal = await getCommercialProposalDocument(proposalId);
  if (!proposal) notFound();

  return (
    <div className="mx-auto max-w-5xl space-y-5 pb-10 print:max-w-none print:bg-white print:p-0">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link href={`/admin/modulos/private-label/${proposal.project_id}`} className="btn-secondary"><ArrowLeft size={16} /> Voltar ao projeto</Link>
        <PrintProposalButton />
      </div>

      <article className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_25px_80px_rgba(15,23,42,0.12)] print:rounded-none print:border-0 print:shadow-none">
        <header className="bg-gradient-to-br from-slate-950 via-slate-900 to-red-950 p-8 text-white print:bg-slate-950">
          <div className="flex items-start justify-between gap-5"><div><div className="grid h-14 w-14 place-items-center rounded-2xl bg-red-700 text-sm font-black tracking-wide">VP</div><p className="mt-5 text-xs font-black uppercase tracking-[0.2em] text-red-200">Vita Power Nutrition</p><h1 className="mt-2 text-4xl font-black tracking-tight">Proposta Private Label</h1></div><div className="text-right"><p className="text-xs font-black uppercase tracking-[0.15em] text-slate-400">Proposta</p><p className="mt-1 text-2xl font-black">#{String(proposal.id).padStart(5, "0")}</p><p className="mt-2 text-xs text-slate-400">Emitida em {date(proposal.created_at)}</p></div></div>
        </header>

        <div className="space-y-8 p-7 sm:p-9 print:p-8">
          <section className="grid gap-5 md:grid-cols-2">
            <div><p className="text-xs font-black uppercase tracking-[0.15em] text-red-700">Cliente</p><h2 className="mt-2 text-2xl font-black text-slate-950">{String(proposal.brand_name)}</h2><p className="mt-1 text-sm text-slate-500">{String(proposal.legal_name)}</p><div className="mt-3 space-y-1 text-sm text-slate-600">{proposal.tax_id ? <p>CNPJ/CPF: {String(proposal.tax_id)}</p> : null}{proposal.contact_name ? <p>Contato: {String(proposal.contact_name)}</p> : null}{proposal.email ? <p>{String(proposal.email)}</p> : null}{proposal.phone ? <p>{String(proposal.phone)}</p> : null}</div></div>
            <div className="rounded-2xl bg-slate-50 p-5"><p className="text-xs font-black uppercase tracking-[0.15em] text-slate-500">Projeto</p><p className="mt-2 font-black text-slate-950">{String(proposal.project_name || proposal.title)}</p><p className="mt-2 text-sm text-slate-600">{String(proposal.product_name || proposal.formula_name)}</p><p className="mt-1 text-xs text-slate-500">Fórmula {String(proposal.formula_code)} · {String(proposal.formula_version)}</p></div>
          </section>

          <section><p className="text-xs font-black uppercase tracking-[0.15em] text-red-700">Condição comercial</p><div className="mt-3 grid gap-3 sm:grid-cols-3"><Card label="Quantidade" value={`${Number(proposal.quantity).toLocaleString("pt-BR")} unidades`} /><Card label="Preço unitário" value={money(proposal.unit_price)} /><Card label="Valor total" value={money(proposal.total_price)} strong /></div><p className="mt-3 text-sm text-slate-500">Validade desta proposta: {Number(proposal.validity_days)} dias.</p></section>

          <section className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 p-5"><h3 className="font-black text-slate-950">Escopo Private Label</h3><div className="mt-3 space-y-2 text-sm text-slate-600">{["Desenvolvimento e gestão do projeto", "Engenharia de formulação e composição", "Planejamento de matérias-primas e embalagens", "Produção, envase e identificação do lote", "Qualidade e rastreabilidade do produto acabado"].map((item) => <p key={item} className="flex items-start gap-2"><CheckCircle2 size={15} className="mt-0.5 shrink-0 text-emerald-600" /> {item}</p>)}</div></div>
            <div className="rounded-2xl border border-slate-200 p-5"><h3 className="font-black text-slate-950">Condições e observações</h3><p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">{String(proposal.notes || "Condições específicas de pagamento, frete, arte, documentação ou serviços adicionais devem ser formalizadas na aprovação comercial do projeto.")}</p></div>
          </section>

          <section className="rounded-2xl bg-slate-950 p-6 text-white"><p className="text-xs font-black uppercase tracking-[0.17em] text-red-200">Próximo passo</p><h3 className="mt-2 text-xl font-black">Aprovação comercial → programação de produção.</h3><p className="mt-2 text-sm leading-6 text-slate-300">Após a aprovação, o VITA OS gera a ordem de produção vinculada ao projeto e preserva a rastreabilidade entre briefing, fórmula, precificação, proposta e lote.</p></section>

          <footer className="border-t border-slate-200 pt-5 text-xs leading-5 text-slate-400">Vita Power Nutrition · Documento gerado pelo VITA OS · Proposta #{String(proposal.id).padStart(5, "0")}</footer>
        </div>
      </article>
    </div>
  );
}

function Card({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) { return <div className={`rounded-2xl p-4 ${strong ? "bg-red-700 text-white" : "bg-slate-50 text-slate-950"}`}><p className={`text-[10px] font-black uppercase tracking-[0.13em] ${strong ? "text-red-100" : "text-slate-400"}`}>{label}</p><p className="mt-2 text-xl font-black">{value}</p></div>; }
