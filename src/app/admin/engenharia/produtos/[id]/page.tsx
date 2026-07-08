import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calculator, ClipboardList, FileText, FlaskConical, History, Package, TrendingUp } from "lucide-react";
import { formatDate } from "@/lib/format";
import { calculateEngineeringPricingScenario, getEngineeringProductDevelopment } from "@/lib/repository";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const tabs = [
  { label: "Informações Gerais", href: "#informacoes", icon: ClipboardList },
  { label: "Fórmula", href: "#formula", icon: FlaskConical },
  { label: "Embalagem", href: "#embalagem", icon: Package },
  { label: "Custos", href: "#custos", icon: Calculator },
  { label: "Precificação", href: "#precificacao", icon: TrendingUp },
  { label: "Histórico", href: "#historico", icon: History }
];

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function money(cents: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format((cents || 0) / 100);
}

export default async function EngineeringProductPage({ params, searchParams }: PageProps) {
  const [{ id }, resolvedSearchParams] = await Promise.all([params, searchParams]);
  const development = getEngineeringProductDevelopment(Number(id));

  if (!development) {
    notFound();
  }

  const activeFormula = development.formulas[0];
  const materialCostCents = activeFormula?.totalMaterialCostCents ?? 0;
  const packagingCostCents = development.packagingCosts.reduce((sum, item) => sum + item.unitCostCents, 0);
  const scenario = calculateEngineeringPricingScenario({
    materialCostCents,
    packagingCostCents,
    labor: first(resolvedSearchParams.labor) ?? "0",
    losses: first(resolvedSearchParams.losses) ?? "3",
    industrialExpenses: first(resolvedSearchParams.industrialExpenses) ?? "0",
    taxes: first(resolvedSearchParams.taxes) ?? "0",
    commission: first(resolvedSearchParams.commission) ?? "0",
    freight: first(resolvedSearchParams.freight) ?? "0",
    financialCost: first(resolvedSearchParams.financialCost) ?? "0",
    desiredMargin: first(resolvedSearchParams.desiredMargin) ?? "35"
  });

  return (
    <div className="space-y-8">
      <Link href="/admin/engenharia#produtos" className="btn-secondary w-fit"><ArrowLeft size={16} /> Voltar para Engenharia</Link>

      <header className="panel overflow-hidden">
        <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-red-950 p-6 text-white sm:p-8">
          <p className="text-sm font-black uppercase tracking-[0.24em] text-red-200">Desenvolvimento de Produto</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">{development.product.name}</h1>
          <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-300">{development.product.clientBrandName} · {development.product.sku} · {development.product.category ?? "Sem categoria"}</p>
        </div>
      </header>

      <nav className="panel flex flex-wrap gap-2 p-3" aria-label="Abas internas do produto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return <Link key={tab.label} href={tab.href} className="inline-flex items-center gap-2 rounded-xl border border-line bg-white px-3 py-2 text-sm font-black text-ink transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"><Icon size={16} /> {tab.label}</Link>;
        })}
      </nav>

      <section className="grid gap-4 md:grid-cols-4">
        <Metric label="Custo MP" value={money(scenario.materialCostCents)} />
        <Metric label="Custo embalagem" value={money(scenario.packagingCostCents)} />
        <Metric label="Custo industrial" value={money(scenario.industrialCostCents)} />
        <Metric label="Preço sugerido" value={money(scenario.suggestedPriceCents)} highlight />
      </section>

      <section id="informacoes" className="panel p-5">
        <SectionTitle icon={<ClipboardList size={20} />} title="Informações Gerais" description="Ponto de partida do fluxo Cliente → Produto → Formulação → Embalagem → Custos → Precificação → Proposta." />
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <Info label="Cliente" value={development.product.clientBrandName} />
          <Info label="Produto" value={development.product.name} />
          <Info label="SKU" value={development.product.sku} />
          <Info label="Categoria" value={development.product.category ?? "-"} />
          <Info label="Versão de fórmula" value={development.product.formulaVersion ?? "Em desenvolvimento"} />
          <Info label="Criado em" value={formatDate(development.product.createdAt.slice(0, 10))} />
        </div>
      </section>

      <section id="formula" className="panel overflow-hidden">
        <SectionHeader icon={<FlaskConical size={20} />} title="Fórmula" description="Matérias-primas, quantidade, unidade, fornecedor, custo/kg, rendimento e observações carregados do banco mestre." />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left">
            <thead><tr className="table-head"><th className="px-4 py-3">Matéria-prima</th><th className="px-4 py-3">Quantidade</th><th className="px-4 py-3">Unidade</th><th className="px-4 py-3">Fornecedor</th><th className="px-4 py-3">Custo/kg</th><th className="px-4 py-3">Rendimento</th><th className="px-4 py-3">Custo</th><th className="px-4 py-3">Observações</th></tr></thead>
            <tbody>{activeFormula?.items.length ? activeFormula.items.map((item) => <tr key={item.id}><td className="table-cell"><span className="font-black text-ink">{item.rawMaterialName}</span><span className="block text-xs text-slate-500">{item.rawMaterialCode}</span></td><td className="table-cell">{item.quantity}</td><td className="table-cell">{item.unit}</td><td className="table-cell">{item.supplierName ?? "-"}</td><td className="table-cell">{money(item.costPerKgCents)}</td><td className="table-cell">{(100 - item.lossPercentage).toFixed(2)}%</td><td className="table-cell">{money(item.costCents)}</td><td className="table-cell text-xs text-slate-600">{item.notes ?? "-"}</td></tr>) : <EmptyRow colSpan={8} text="Nenhuma fórmula vinculada a este produto." />}</tbody>
          </table>
        </div>
      </section>

      <section id="embalagem" className="panel overflow-hidden">
        <SectionHeader icon={<Package size={20} />} title="Embalagem" description="Pote, tampa, lacre, scoop, rótulo, caixa e etiqueta com custo individual vindo do banco mestre." />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left">
            <thead><tr className="table-head"><th className="px-4 py-3">Item</th><th className="px-4 py-3">Tipo</th><th className="px-4 py-3">Fornecedor</th><th className="px-4 py-3">Custo individual</th></tr></thead>
            <tbody>{development.packagingCosts.length ? development.packagingCosts.map((item) => <tr key={item.id}><td className="table-cell"><span className="font-black text-ink">{item.name}</span><span className="block text-xs text-slate-500">{item.code}</span></td><td className="table-cell">{item.type ?? "-"}</td><td className="table-cell">{item.supplierName ?? "-"}</td><td className="table-cell">{money(item.unitCostCents)}</td></tr>) : <EmptyRow colSpan={4} text="Nenhum item de embalagem cadastrado no banco mestre." />}</tbody>
          </table>
        </div>
      </section>

      <section id="custos" className="panel p-5">
        <SectionTitle icon={<Calculator size={20} />} title="Custos" description="Cálculo automático do custo industrial do produto." />
        <div className="mt-5 grid gap-3 md:grid-cols-3"><Info label="Matérias-primas" value={money(scenario.materialCostCents)} /><Info label="Embalagens" value={money(scenario.packagingCostCents)} /><Info label="Mão de obra" value={money(scenario.laborCostCents)} /><Info label="Perdas" value={money(scenario.lossCostCents)} /><Info label="Despesas industriais" value={money(scenario.industrialExpenseCents)} /><Info label="Custo total industrial" value={money(scenario.industrialCostCents)} strong /></div>
      </section>

      <section id="precificacao" className="panel p-5">
        <SectionTitle icon={<TrendingUp size={20} />} title="Precificação" description="Informe impostos, comissão, frete, custo financeiro e margem desejada para calcular preços automaticamente." />
        <form className="mt-5 grid gap-3 md:grid-cols-5">
          <Field name="labor" label="Mão de obra" defaultValue={first(resolvedSearchParams.labor) ?? "0"} />
          <Field name="losses" label="Perdas %" defaultValue={first(resolvedSearchParams.losses) ?? "3"} />
          <Field name="industrialExpenses" label="Despesas industriais" defaultValue={first(resolvedSearchParams.industrialExpenses) ?? "0"} />
          <Field name="taxes" label="Impostos" defaultValue={first(resolvedSearchParams.taxes) ?? "0"} />
          <Field name="commission" label="Comissão" defaultValue={first(resolvedSearchParams.commission) ?? "0"} />
          <Field name="freight" label="Frete" defaultValue={first(resolvedSearchParams.freight) ?? "0"} />
          <Field name="financialCost" label="Custo financeiro" defaultValue={first(resolvedSearchParams.financialCost) ?? "0"} />
          <Field name="desiredMargin" label="Margem desejada %" defaultValue={first(resolvedSearchParams.desiredMargin) ?? "35"} />
          <button className="btn-primary md:col-span-2" type="submit">Calcular precificação</button>
        </form>
        <div className="mt-5 grid gap-3 md:grid-cols-3"><Info label="Custo final" value={money(scenario.finalCostCents)} /><Info label="Preço atacado" value={money(scenario.wholesalePriceCents)} /><Info label="Preço distribuidor" value={money(scenario.distributorPriceCents)} /><Info label="Preço sugerido" value={money(scenario.suggestedPriceCents)} strong /><Info label="Lucro bruto" value={money(scenario.grossProfitCents)} /><Info label="Margem" value={`${scenario.grossMarginPercentage.toFixed(2)}%`} /></div>
      </section>

      <section id="proposta" className="panel p-5">
        <SectionTitle icon={<FileText size={20} />} title="Proposta Comercial" description="Gerador integrado com as informações do produto, fórmula, embalagem, custos e precificação." />
        <div className="mt-5 rounded-2xl border border-line bg-white p-5">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-red-700">Proposta Vita Power Nutrition</p>
          <h2 className="mt-2 text-2xl font-black text-ink">{development.product.name}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">Cliente: {development.product.clientBrandName}. Produto desenvolvido com {activeFormula?.items.length ?? 0} matérias-primas e {development.packagingCosts.length} componentes de embalagem cadastrados no Banco Mestre de Engenharia.</p>
          <div className="mt-4 grid gap-3 md:grid-cols-3"><Info label="Custo industrial" value={money(scenario.industrialCostCents)} /><Info label="Preço sugerido" value={money(scenario.suggestedPriceCents)} /><Info label="Margem estimada" value={`${scenario.grossMarginPercentage.toFixed(2)}%`} /></div>
        </div>
      </section>

      <section id="historico" className="panel p-5">
        <SectionTitle icon={<History size={20} />} title="Histórico" description="Linha do tempo técnica preparada para versões de fórmula, revisões de embalagem, custos, propostas e memorial técnico." />
        <div className="mt-5 space-y-3"><Timeline title="Produto criado" description={`Cadastro base criado em ${formatDate(development.product.createdAt.slice(0, 10))}.`} /><Timeline title="Fórmula ativa" description={activeFormula ? `${activeFormula.code} v${activeFormula.version} em status ${activeFormula.status}.` : "Aguardando vínculo de fórmula."} /><Timeline title="Memorial técnico" description="Estrutura reservada para especificações, modo de preparo, rotulagem técnica e parâmetros de CQ." /></div>
      </section>
    </div>
  );
}

function Metric({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) { return <div className={highlight ? "rounded-2xl bg-slate-950 p-5 text-white" : "panel p-5"}><p className={highlight ? "text-xs font-black uppercase tracking-[0.16em] text-red-200" : "text-xs font-black uppercase tracking-[0.16em] text-slate-500"}>{label}</p><p className="mt-2 text-2xl font-black">{value}</p></div>; }
function SectionHeader({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) { return <div className="flex gap-3 border-b border-line p-5"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white">{icon}</div><div><h2 className="text-lg font-black text-ink">{title}</h2><p className="text-sm text-slate-600">{description}</p></div></div>; }
function SectionTitle({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) { return <div className="flex gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white">{icon}</div><div><h2 className="text-lg font-black text-ink">{title}</h2><p className="text-sm text-slate-600">{description}</p></div></div>; }
function Info({ label, value, strong }: { label: string; value: string; strong?: boolean }) { return <div className="rounded-2xl border border-line bg-slate-50 p-4"><p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">{label}</p><p className={strong ? "mt-1 text-xl font-black text-red-700" : "mt-1 font-black text-ink"}>{value}</p></div>; }
function Field(props: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) { const { label, ...inputProps } = props; return <label><span className="label">{label}</span><input className="field" type="number" step="0.01" {...inputProps} /></label>; }
function EmptyRow({ colSpan, text }: { colSpan: number; text: string }) { return <tr><td className="table-cell text-sm text-slate-500" colSpan={colSpan}>{text}</td></tr>; }
function Timeline({ title, description }: { title: string; description: string }) { return <div className="rounded-2xl border border-line bg-white p-4"><p className="font-black text-ink">{title}</p><p className="mt-1 text-sm text-slate-600">{description}</p></div>; }
