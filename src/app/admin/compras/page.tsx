import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  BadgeCheck,
  Banknote,
  CalendarClock,
  Check,
  CircleDollarSign,
  ClipboardList,
  FileDown,
  Filter,
  Gauge,
  History,
  Link2,
  PackageSearch,
  Plus,
  Search,
  Sparkles,
  Star,
  Truck,
  UsersRound
} from "lucide-react";
import {
  addSupplierPerformanceAction,
  approveSupplierOfferAction,
  createProcurementQuoteAction,
  createProcurementSupplierAction,
  createSupplierOfferAction,
  markPurchaseCompletedAction,
  updateProcurementQuoteStatusAction
} from "@/app/admin/compras/actions";
import {
  getProcurementDashboard,
  getPurchaseOrderByQuote,
  listOfferAttachments,
  listProcurementItems,
  listProcurementQuotes,
  listProcurementSuppliers,
  listSupplierOffers,
  procurementStatuses,
  type ProcurementQuote,
  type ProcurementStatus,
  type SupplierOffer
} from "@/lib/procurement";

export const dynamic = "force-dynamic";

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const number = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 3 });
const compactCurrency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", notation: "compact", maximumFractionDigits: 1 });

function Field({ label, hint, children, className = "" }: { label: string; hint?: string; children: ReactNode; className?: string }) {
  return <label className={`space-y-1 ${className}`}><span className="label">{label}</span>{children}{hint ? <small className="block text-xs text-slate-400">{hint}</small> : null}</label>;
}

function Kpi({ icon, label, value, detail, tone = "slate" }: { icon: ReactNode; label: string; value: string | number; detail: string; tone?: "slate" | "red" | "green" | "amber" }) {
  const tones = { slate: "bg-slate-950 text-white", red: "bg-red-700 text-white", green: "bg-emerald-700 text-white", amber: "bg-amber-500 text-slate-950" };
  return (
    <article className="panel flex items-start gap-4 p-4">
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${tones[tone]}`}>{icon}</span>
      <div><p className="text-xs font-black uppercase tracking-wide text-slate-500">{label}</p><p className="mt-1 text-2xl font-black tracking-tight text-slate-950">{value}</p><p className="mt-1 text-xs text-slate-500">{detail}</p></div>
    </article>
  );
}

function StatusPill({ status }: { status: ProcurementStatus }) {
  const colors: Record<ProcurementStatus, string> = {
    "Cotando": "border-sky-200 bg-sky-50 text-sky-800",
    "Aguardando fornecedor": "border-amber-200 bg-amber-50 text-amber-800",
    "Recebida": "border-violet-200 bg-violet-50 text-violet-800",
    "Em negociação": "border-orange-200 bg-orange-50 text-orange-800",
    "Aprovada": "border-emerald-200 bg-emerald-50 text-emerald-800",
    "Compra realizada": "border-slate-300 bg-slate-950 text-white",
    "Descartada": "border-slate-200 bg-slate-100 text-slate-500"
  };
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-black ${colors[status]}`}>{status}</span>;
}

function Score({ value }: { value: number | null }) {
  if (value === null) return <span className="text-xs text-slate-400">Sem avaliação</span>;
  return <span className="inline-flex items-center gap-1 font-black text-amber-600"><Star size={14} fill="currentColor" /> {value.toFixed(1)}</span>;
}

function PriceVariation({ value }: { value: number | null }) {
  if (value === null) return <span className="text-xs text-slate-400">Primeiro registro</span>;
  const positive = value > 0;
  return <span className={`inline-flex items-center gap-1 text-xs font-black ${positive ? "text-red-700" : "text-emerald-700"}`}>{positive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}{Math.abs(value).toFixed(1)}%</span>;
}

function QuoteCard({ quote, active, suffix }: { quote: ProcurementQuote; active: boolean; suffix: string }) {
  return (
    <Link href={`/admin/compras?cotacao=${quote.id}${suffix}`} className={`block rounded-2xl border p-4 transition ${active ? "border-red-300 bg-red-50 shadow-[0_12px_32px_rgba(185,28,28,0.10)]" : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-soft"}`}>
      <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-wide text-red-700">{quote.itemCode}</p><h3 className="mt-1 font-black text-slate-950">{quote.title}</h3><p className="mt-1 text-sm text-slate-500">{quote.itemName}</p></div><StatusPill status={quote.status} /></div>
      <div className="mt-4 grid grid-cols-3 gap-2 text-xs"><div><span className="block text-slate-400">Necessidade</span><strong>{number.format(quote.requestedQuantity)} {quote.normalizedUnit}</strong></div><div><span className="block text-slate-400">Propostas</span><strong>{quote.offerCount}</strong></div><div><span className="block text-slate-400">Melhor posto</span><strong>{quote.bestLandedUnitCost === null ? "Pendente" : currency.format(quote.bestLandedUnitCost)}</strong></div></div>
    </Link>
  );
}

function OfferComparison({ quote, offers, attachmentByOffer }: { quote: ProcurementQuote; offers: SupplierOffer[]; attachmentByOffer: Map<number, Array<{ id: number; fileName: string }>> }) {
  if (!offers.length) return <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center"><PackageSearch className="mx-auto text-slate-400" size={34} /><p className="mt-3 font-black text-slate-800">Nenhuma proposta recebida</p><p className="mt-1 text-sm text-slate-500">Registre abaixo a primeira resposta de fornecedor.</p></div>;
  const landedOffers = offers.filter((offer) => offer.landedUnitCost !== null);
  const bestCost = landedOffers.length ? Math.min(...landedOffers.map((offer) => offer.landedUnitCost as number)) : null;
  const fastest = Math.min(...offers.map((offer) => offer.leadTimeDays));
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200">
      <table className="w-full min-w-[1180px] text-left text-sm">
        <thead><tr className="bg-slate-950 text-xs uppercase tracking-wide text-slate-300"><th className="px-4 py-3">Fornecedor</th><th className="px-4 py-3">Preço normalizado</th><th className="px-4 py-3">Frete</th><th className="px-4 py-3">Custo posto</th><th className="px-4 py-3">MOQ / Qtd.</th><th className="px-4 py-3">Pagamento</th><th className="px-4 py-3">Prazo</th><th className="px-4 py-3">Histórico</th><th className="px-4 py-3">Ações</th></tr></thead>
        <tbody>
          {offers.map((offer) => {
            const isBest = bestCost !== null && offer.landedUnitCost === bestCost;
            const isFastest = offer.leadTimeDays === fastest;
            const attachments = attachmentByOffer.get(offer.id) ?? [];
            return (
              <tr key={offer.id} className={quote.awardedOfferId === offer.id ? "bg-emerald-50" : "bg-white"}>
                <td className="table-cell"><p className="font-black text-slate-950">{offer.supplierName}</p><p className="text-xs text-slate-400">{offer.reference ?? "Sem referência"}</p>{quote.awardedOfferId === offer.id ? <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-700 px-2 py-1 text-[10px] font-black text-white"><Check size={11} /> Escolhida</span> : null}</td>
                <td className="table-cell"><p className="font-black">{currency.format(offer.normalizedUnitCost)}/{quote.normalizedUnit}</p><p className="text-xs text-slate-400">{currency.format(offer.unitPrice)} por {offer.purchaseUnit}</p>{offer.negotiatedSavings > 0 ? <p className="mt-1 text-xs font-bold text-emerald-700">Economia {currency.format(offer.negotiatedSavings)}</p> : null}</td>
                <td className="table-cell">{offer.freightCost === null ? <span className="font-bold text-amber-700">Pendente</span> : currency.format(offer.freightCost)}</td>
                <td className="table-cell">{offer.landedUnitCost === null ? <span className="font-bold text-amber-700">Aguardando frete</span> : <><p className="font-black">{currency.format(offer.landedUnitCost)}/{quote.normalizedUnit}</p><p className="text-xs text-slate-400">Total {currency.format(offer.landedTotal ?? 0)}</p>{isBest ? <span className="mt-1 inline-flex rounded-full bg-red-700 px-2 py-1 text-[10px] font-black text-white">MENOR CUSTO</span> : null}</>}</td>
                <td className="table-cell"><p><strong>{number.format(offer.moq)}</strong> mínimo</p><p className="text-xs text-slate-400">{number.format(offer.quotedQuantity)} cotado</p></td>
                <td className="table-cell">{offer.paymentTerms ?? "—"}</td>
                <td className="table-cell"><strong>{offer.leadTimeDays} dias</strong>{isFastest ? <span className="mt-1 block text-[10px] font-black text-emerald-700">MAIS RÁPIDA</span> : null}<p className="mt-1 text-xs text-slate-400">Válida até {offer.validUntil ?? "não informado"}</p></td>
                <td className="table-cell"><PriceVariation value={offer.priceVariationPercent} />{attachments.map((file) => <a key={file.id} className="mt-2 flex max-w-36 items-center gap-1 truncate text-xs font-bold text-red-700 hover:underline" href={`/api/compras/anexos/${file.id}`}><FileDown size={13} />{file.fileName}</a>)}</td>
                <td className="table-cell">{quote.status !== "Compra realizada" && quote.status !== "Descartada" ? <form action={approveSupplierOfferAction}><input type="hidden" name="quoteId" value={quote.id} /><input type="hidden" name="offerId" value={offer.id} /><button className="btn-secondary whitespace-nowrap" type="submit"><BadgeCheck size={15} /> Aprovar</button></form> : null}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default async function PurchasesPage({ searchParams }: { searchParams: Promise<{ cotacao?: string; status?: string; busca?: string }> }) {
  const params = await searchParams;
  const [dashboard, items, suppliers, quotes] = await Promise.all([
    getProcurementDashboard(),
    listProcurementItems(),
    listProcurementSuppliers(),
    listProcurementQuotes({ status: params.status, search: params.busca })
  ]);
  const selectedId = Number(params.cotacao || quotes[0]?.id || 0);
  const selected = quotes.find((quote) => quote.id === selectedId) ?? quotes[0] ?? null;
  const [offers, attachments, purchaseOrder] = selected ? await Promise.all([listSupplierOffers(selected.id), listOfferAttachments(selected.id), getPurchaseOrderByQuote(selected.id)]) : [[], [], null];
  const attachmentByOffer = new Map<number, Array<{ id: number; fileName: string }>>();
  for (const attachment of attachments) attachmentByOffer.set(attachment.offerId, [...(attachmentByOffer.get(attachment.offerId) ?? []), attachment]);
  const filterSuffix = `${params.status ? `&status=${encodeURIComponent(params.status)}` : ""}${params.busca ? `&busca=${encodeURIComponent(params.busca)}` : ""}`;
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-7 pb-12">
      <section className="relative overflow-hidden rounded-[28px] bg-slate-950 px-6 py-7 text-white shadow-[0_24px_70px_rgba(15,23,42,0.22)] sm:px-8">
        <div className="absolute -right-20 -top-28 h-72 w-72 rounded-full bg-red-600/25 blur-3xl" />
        <div className="relative flex flex-col justify-between gap-6 xl:flex-row xl:items-end">
          <div><div className="inline-flex items-center gap-2 rounded-full border border-red-400/20 bg-red-500/10 px-3 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-red-200"><Sparkles size={14} /> VITA OS · Suprimentos</div><h1 className="mt-4 text-3xl font-black tracking-[-0.04em] sm:text-4xl">Cotações & Compras</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">Compare custo posto, prazo, pagamento, qualidade e histórico antes de decidir. Matérias-primas e embalagens na mesma visão operacional.</p></div>
          <div className="flex flex-wrap gap-2 text-xs font-bold text-slate-300"><span className="rounded-full border border-white/10 bg-white/5 px-3 py-2">MP em R$/kg</span><span className="rounded-full border border-white/10 bg-white/5 px-3 py-2">Embalagens em R$/un</span><span className="rounded-full border border-white/10 bg-white/5 px-3 py-2">PCP + Bling preparados</span></div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi icon={<ClipboardList size={20} />} label="Cotações abertas" value={dashboard.openQuotes} detail={`${dashboard.awaitingSupplier} aguardando fornecedor`} tone="slate" />
        <Kpi icon={<PackageSearch size={20} />} label="Em análise" value={dashboard.receivedOffers} detail="Recebidas ou em negociação" tone="amber" />
        <Kpi icon={<BadgeCheck size={20} />} label="Aprovadas" value={dashboard.approvedQuotes} detail={`${dashboard.purchasedQuotes} compras realizadas`} tone="green" />
        <Kpi icon={<CircleDollarSign size={20} />} label="Economia negociada" value={compactCurrency.format(dashboard.negotiatedSavings)} detail="Diferença entre preço inicial e final" tone="red" />
      </section>

      <details className="panel overflow-hidden" open={!quotes.length}>
        <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4"><div><p className="text-xs font-black uppercase tracking-wide text-red-700">Entrada rápida</p><h2 className="mt-1 text-xl font-black text-slate-950">Abrir nova cotação</h2></div><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-700 text-white"><Plus size={20} /></span></summary>
        <form action={createProcurementQuoteAction} className="grid gap-3 border-t border-slate-200 bg-slate-50/70 p-5 md:grid-cols-2 xl:grid-cols-4">
          <Field label="Título" className="xl:col-span-2"><input className="field" name="title" required placeholder="Ex.: Compra de WPC — lote outubro" /></Field>
          <Field label="Item padronizado" className="xl:col-span-2"><select className="select" name="item" required defaultValue=""><option value="" disabled>Selecionar matéria-prima ou embalagem</option>{items.map((item) => <option key={`${item.type}-${item.id}`} value={`${item.type}:${item.id}`}>{item.type === "raw_material" ? "MP" : "EMB"} · {item.code} · {item.name}</option>)}</select></Field>
          <Field label="Quantidade"><input className="field" name="requestedQuantity" type="number" min="0.001" step="0.001" required /></Field>
          <Field label="Prioridade"><select className="select" name="priority" defaultValue="Normal"><option>Baixa</option><option>Normal</option><option>Alta</option><option>Urgente</option></select></Field>
          <Field label="Necessário até"><input className="field" name="requiredBy" type="date" /></Field>
          <Field label="Origem"><select className="select" name="source" defaultValue="manual"><option value="manual">Entrada manual</option><option value="pcp">Necessidade do PCP</option></select></Field>
          <Field label="Referência PCP"><input className="field" name="pcpReference" placeholder="OP, plano ou solicitação" /></Field>
          <Field label="Observações" className="md:col-span-2"><input className="field" name="notes" placeholder="Especificação crítica, urgência ou contexto" /></Field>
          <button className="btn-primary xl:col-span-1" type="submit"><Plus size={16} /> Abrir cotação</button>
        </form>
      </details>

      <section className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="space-y-4">
          <form className="panel space-y-3 p-4" method="get"><div className="relative"><Search className="pointer-events-none absolute left-3 top-3 text-slate-400" size={17} /><input className="field pl-10" name="busca" defaultValue={params.busca ?? ""} placeholder="Buscar item, cotação ou PCP" /></div><div className="flex gap-2"><select className="select" name="status" defaultValue={params.status ?? ""}><option value="">Todos os estados</option>{procurementStatuses.map((status) => <option key={status}>{status}</option>)}</select><button className="flex h-[2.65rem] w-12 items-center justify-center rounded-lg bg-slate-950 text-white" aria-label="Aplicar filtros"><Filter size={17} /></button></div></form>
          <div className="max-h-[920px] space-y-3 overflow-y-auto pr-1">{quotes.map((quote) => <QuoteCard key={quote.id} quote={quote} active={selected?.id === quote.id} suffix={filterSuffix} />)}{!quotes.length ? <div className="panel p-8 text-center text-sm text-slate-500">Nenhuma cotação encontrada.</div> : null}</div>
        </aside>

        <div className="min-w-0 space-y-6">
          {selected ? (
            <>
              <section className="panel overflow-hidden">
                <div className="border-b border-slate-200 bg-white p-5 sm:p-6"><div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start"><div><div className="flex flex-wrap items-center gap-2"><StatusPill status={selected.status} /><span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-black text-slate-600">{selected.priority}</span>{selected.source === "pcp" ? <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-black text-blue-700">PCP · {selected.pcpReference ?? "sem referência"}</span> : null}</div><h2 className="mt-3 text-2xl font-black tracking-tight text-slate-950">{selected.title}</h2><p className="mt-1 text-sm text-slate-500">{selected.itemCode} · {selected.itemName} · {number.format(selected.requestedQuantity)} {selected.normalizedUnit}</p></div><form action={updateProcurementQuoteStatusAction} className="flex min-w-[280px] gap-2"><input type="hidden" name="quoteId" value={selected.id} /><select className="select" name="status" defaultValue={selected.status}>{procurementStatuses.map((status) => <option key={status}>{status}</option>)}</select><button className="btn-secondary" type="submit">Atualizar</button></form></div></div>
                <div className="grid gap-3 bg-slate-50 p-5 sm:grid-cols-2 lg:grid-cols-4"><div><p className="text-xs font-bold text-slate-400">Melhor custo posto</p><p className="mt-1 font-black text-slate-950">{selected.bestLandedUnitCost === null ? "Pendente" : `${currency.format(selected.bestLandedUnitCost)}/${selected.normalizedUnit}`}</p></div><div><p className="text-xs font-bold text-slate-400">Média recebida</p><p className="mt-1 font-black text-slate-950">{selected.averageLandedUnitCost === null ? "—" : currency.format(selected.averageLandedUnitCost)}</p></div><div><p className="text-xs font-bold text-slate-400">Economia negociada</p><p className="mt-1 font-black text-emerald-700">{currency.format(selected.totalNegotiatedSavings)}</p></div><div><p className="text-xs font-bold text-slate-400">Data necessária</p><p className="mt-1 font-black text-slate-950">{selected.requiredBy ?? "Não definida"}</p></div></div>
              </section>

              <section className="panel p-5 sm:p-6"><div className="mb-4 flex items-center justify-between"><div><p className="text-xs font-black uppercase tracking-wide text-red-700">Decisão lado a lado</p><h2 className="mt-1 text-xl font-black text-slate-950">Comparativo de fornecedores</h2></div><Gauge className="text-red-700" /></div><OfferComparison quote={selected} offers={offers} attachmentByOffer={attachmentByOffer} /></section>

              {selected.status === "Aprovada" ? <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5"><div className="flex items-start gap-3"><BadgeCheck className="mt-1 text-emerald-700" /><div className="flex-1"><h3 className="font-black text-emerald-950">Proposta aprovada para compra</h3><p className="mt-1 text-sm text-emerald-800">Registre o número do pedido. Se o pedido já existir no Bling, inclua o ID para confirmar a sincronização.</p><form action={markPurchaseCompletedAction} className="mt-4 grid gap-3 sm:grid-cols-3"><input type="hidden" name="quoteId" value={selected.id} /><input className="field" name="purchaseReference" placeholder="Pedido interno / OC" required /><input className="field" name="blingPurchaseOrderId" placeholder="ID no Bling (opcional)" /><button className="btn-primary" type="submit"><Check size={16} /> Compra realizada</button></form></div></div></section> : null}
              {purchaseOrder ? <section className="panel flex flex-col justify-between gap-3 p-5 sm:flex-row sm:items-center"><div><p className="text-xs font-black uppercase text-slate-400">Integração operacional</p><p className="mt-1 font-black text-slate-950">PCP: {selected.pcpReference ?? "sem vínculo"} · Bling: {purchaseOrder.blingPurchaseOrderId ?? "aguardando conector"}</p></div><span className={`rounded-full px-3 py-2 text-xs font-black ${purchaseOrder.blingSyncStatus === "sincronizada" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>{purchaseOrder.blingSyncStatus.replaceAll("_", " ")}</span></section> : null}

              <details className="panel overflow-hidden" open={!offers.length}>
                <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4"><div><p className="text-xs font-black uppercase tracking-wide text-red-700">Resposta recebida</p><h2 className="mt-1 text-xl font-black text-slate-950">Registrar proposta de fornecedor</h2></div><Plus className="text-red-700" /></summary>
                <form action={createSupplierOfferAction} className="grid gap-3 border-t border-slate-200 bg-slate-50/70 p-5 md:grid-cols-2 xl:grid-cols-4">
                  <input type="hidden" name="quoteId" value={selected.id} />
                  <Field label="Fornecedor" className="xl:col-span-2"><select className="select" name="supplierId" required defaultValue=""><option value="" disabled>Selecionar</option>{suppliers.filter((supplier) => supplier.active).map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}</select></Field>
                  <Field label="Referência da proposta"><input className="field" name="reference" placeholder="Número, e-mail ou vendedor" /></Field>
                  <Field label="Data da proposta"><input className="field" name="quoteDate" type="date" defaultValue={today} required /></Field>
                  <Field label={`Quantidade cotada (${selected.normalizedUnit})`}><input className="field" name="quotedQuantity" type="number" min="0.001" step="0.001" defaultValue={selected.requestedQuantity} required /></Field>
                  <Field label="Unidade de compra" hint="Ex.: saco 25 kg ou caixa 500 un"><input className="field" name="purchaseUnit" defaultValue={selected.itemType === "raw_material" ? "saco" : "caixa"} required /></Field>
                  <Field label={`Qtd. de ${selected.normalizedUnit} por unidade`}><input className="field" name="unitsPerPurchaseUnit" type="number" min="0.000001" step="0.000001" defaultValue="1" required /></Field>
                  <Field label="Preço inicial por unidade"><input className="field" name="initialUnitPrice" type="number" min="0" step="0.000001" /></Field>
                  <Field label="Preço final por unidade"><input className="field" name="unitPrice" type="number" min="0" step="0.000001" required /></Field>
                  <Field label="Frete" hint="Deixe vazio enquanto estiver pendente"><input className="field" name="freightCost" type="number" min="0" step="0.01" /></Field>
                  <Field label="Impostos (%)"><input className="field" name="taxPercent" type="number" min="0" step="0.01" defaultValue="0" /></Field>
                  <Field label="Impostos fixos"><input className="field" name="taxAmount" type="number" min="0" step="0.01" defaultValue="0" /></Field>
                  <Field label="Outros custos"><input className="field" name="otherCost" type="number" min="0" step="0.01" defaultValue="0" /></Field>
                  <Field label="Desconto total"><input className="field" name="discountAmount" type="number" min="0" step="0.01" defaultValue="0" /></Field>
                  <Field label="MOQ"><input className="field" name="moq" type="number" min="0" step="0.001" defaultValue="0" /></Field>
                  <Field label="Pagamento"><input className="field" name="paymentTerms" placeholder="Ex.: 28/35/42 dias" /></Field>
                  <Field label="Lead time (dias)"><input className="field" name="leadTimeDays" type="number" min="0" defaultValue="0" /></Field>
                  <Field label="Validade da proposta"><input className="field" name="validUntil" type="date" /></Field>
                  <Field label="Fabricante"><input className="field" name="manufacturer" /></Field>
                  <Field label="Distribuidor"><input className="field" name="distributor" /></Field>
                  {selected.itemType === "raw_material" ? <><Field label="Concentração / pureza"><input className="field" name="concentrationPurity" placeholder="Ex.: WPC 80%" /></Field><Field label="Origem"><input className="field" name="origin" placeholder="País / planta" /></Field><Field label="Validade mínima"><input className="field" name="minimumShelfLife" placeholder="Ex.: 18 meses" /></Field></> : <><Field label="Material, medidas e gramatura" className="xl:col-span-2"><input className="field" name="origin" placeholder="Ex.: PEAD · 150 × 220 mm · 42 g" /></Field><Field label="Cor, capacidade e caixa"><input className="field" name="concentrationPurity" placeholder="Ex.: preto · 900 ml · 60 un/cx" /></Field><Field label="Molde / clichê / personalização"><input className="field" name="minimumShelfLife" placeholder="Custos e prazo específicos" /></Field></>}
                  <Field label="Ficha técnica, COA ou proposta" className="md:col-span-2" hint="PDF, imagem, TXT ou DOCX · até 5 MB"><input className="field py-2" name="attachment" type="file" accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,.docx" /></Field>
                  <Field label="Observações" className="md:col-span-2"><textarea className="textarea" name="notes" placeholder="Detalhes técnicos, validade, amostra, negociação ou ressalvas" /></Field>
                  <button className="btn-primary md:col-span-2 xl:col-span-4" type="submit"><Banknote size={16} /> Calcular custo posto e registrar proposta</button>
                </form>
              </details>
            </>
          ) : <section className="panel p-12 text-center"><ClipboardList className="mx-auto text-slate-400" size={42} /><h2 className="mt-4 text-xl font-black">Abra a primeira cotação</h2><p className="mt-2 text-sm text-slate-500">O comparativo e o histórico aparecerão aqui.</p></section>}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_.9fr]">
        <div className="panel overflow-hidden"><div className="flex items-center justify-between border-b border-slate-200 px-5 py-4"><div><p className="text-xs font-black uppercase tracking-wide text-red-700">Base de relacionamento</p><h2 className="mt-1 text-xl font-black">Fornecedores e desempenho</h2></div><UsersRound className="text-red-700" /></div><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead><tr className="table-head"><th className="px-4 py-3">Fornecedor</th><th className="px-4 py-3">Categoria</th><th className="px-4 py-3">Histórico</th><th className="px-4 py-3">Qualidade</th><th className="px-4 py-3">Entrega</th><th className="px-4 py-3">Comercial</th></tr></thead><tbody>{suppliers.map((supplier) => <tr key={supplier.id}><td className="table-cell"><p className="font-black">{supplier.name}</p><p className="text-xs text-slate-400">{supplier.contactName ?? supplier.email ?? "Sem contato"}</p></td><td className="table-cell">{supplier.category ?? "—"}</td><td className="table-cell"><strong>{supplier.offerCount}</strong> propostas · <strong>{supplier.purchaseCount}</strong> compras</td><td className="table-cell"><Score value={supplier.averageQuality} /></td><td className="table-cell"><Score value={supplier.averageDelivery} /></td><td className="table-cell"><Score value={supplier.averageCommercial} /></td></tr>)}</tbody></table></div></div>
        <div className="space-y-6">
          <details className="panel overflow-hidden"><summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4"><div><p className="text-xs font-black uppercase tracking-wide text-red-700">Cadastro</p><h2 className="mt-1 text-lg font-black">Novo fornecedor</h2></div><Plus className="text-red-700" /></summary><form action={createProcurementSupplierAction} className="grid gap-3 border-t border-slate-200 p-5 sm:grid-cols-2"><Field label="Razão / nome" className="sm:col-span-2"><input className="field" name="name" required /></Field><Field label="Contato"><input className="field" name="contactName" /></Field><Field label="Categoria"><input className="field" name="category" placeholder="MP, embalagem ou ambos" /></Field><Field label="E-mail"><input className="field" name="email" type="email" /></Field><Field label="Telefone"><input className="field" name="phone" /></Field><Field label="CNPJ / documento"><input className="field" name="document" /></Field><Field label="Site"><input className="field" name="website" type="url" /></Field><Field label="Observações" className="sm:col-span-2"><textarea className="textarea" name="notes" /></Field><button className="btn-primary sm:col-span-2" type="submit"><Truck size={16} /> Salvar fornecedor</button></form></details>
          <details className="panel overflow-hidden"><summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4"><div><p className="text-xs font-black uppercase tracking-wide text-red-700">Pós-compra</p><h2 className="mt-1 text-lg font-black">Avaliar desempenho</h2></div><Star className="text-amber-500" /></summary><form action={addSupplierPerformanceAction} className="grid gap-3 border-t border-slate-200 p-5 sm:grid-cols-3"><Field label="Fornecedor" className="sm:col-span-3"><select className="select" name="supplierId" required><option value="">Selecionar</option>{suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}</select></Field>{["qualityScore", "deliveryScore", "commercialScore"].map((field, index) => <Field key={field} label={["Qualidade", "Entrega", "Comercial"][index]}><select className="select" name={field} defaultValue="5">{[1,2,3,4,5].map((score) => <option key={score} value={score}>{score}</option>)}</select></Field>)}<Field label="No prazo"><select className="select" name="deliveredOnTime"><option value="">Não informado</option><option value="sim">Sim</option><option value="nao">Não</option></select></Field><Field label="Não conformidades"><input className="field" name="nonconformityCount" type="number" min="0" defaultValue="0" /></Field><Field label="Observações" className="sm:col-span-3"><textarea className="textarea" name="notes" /></Field><button className="btn-primary sm:col-span-3" type="submit"><Star size={16} /> Registrar avaliação</button></form></details>
        </div>
      </section>

      <section className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600 md:grid-cols-3"><div className="flex gap-3"><History className="shrink-0 text-red-700" /><p><strong className="block text-slate-950">Histórico preservado</strong>Cada proposta vira uma versão comparável por fornecedor e item.</p></div><div className="flex gap-3"><CalendarClock className="shrink-0 text-red-700" /><p><strong className="block text-slate-950">Prazo e validade visíveis</strong>Propostas vencidas e lead times ficam no contexto da decisão.</p></div><div className="flex gap-3"><Link2 className="shrink-0 text-red-700" /><p><strong className="block text-slate-950">PCP e Bling rastreáveis</strong>Referências permanecem vinculadas à compra aprovada.</p></div></section>
    </div>
  );
}
