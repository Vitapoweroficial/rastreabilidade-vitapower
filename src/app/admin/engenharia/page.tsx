import Link from "next/link";
import { ArrowDownUp, Boxes, Calculator, ClipboardList, Clock3, Copy, Factory, FileText, Filter, FlaskConical, Package, PackageCheck, Search, TrendingUp, TriangleAlert } from "lucide-react";
import {
  createEngineeringMaterialAction,
  createEngineeringPackagingAction,
  duplicateEngineeringMaterialAction,
  duplicateEngineeringPackagingAction
} from "@/app/admin/actions";
import { formatDate } from "@/lib/format";
import {
  listEngineeringMaterialCategories,
  listEngineeringPackagingCategories,
  getEngineeringDashboard,
  listEngineeringPackaging,
  listEngineeringRawMaterials,
  listEngineeringSuppliers,
  listProducts,
  type EngineeringFilters,
  type EngineeringSort
} from "@/lib/repository";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const packagingCategories = ["Pote", "Tampa", "Rótulo", "Caixa", "Lacre", "Sleeve", "Sachê", "Display", "Caixa master"];
const engineeringMenu = [
  { label: "Produtos", href: "#produtos", icon: PackageCheck },
  { label: "Fórmulas", href: "#materias-primas", icon: FlaskConical },
  { label: "Embalagens", href: "#embalagens", icon: Package },
  { label: "Custos", href: "#produtos", icon: Calculator },
  { label: "Precificação", href: "#produtos", icon: TrendingUp },
  { label: "Propostas", href: "#produtos", icon: FileText },
  { label: "Memorial Técnico", href: "#produtos", icon: ClipboardList }
];

const statusLabels: Record<string, string> = { active: "Ativo", quarantine: "Quarentena", blocked: "Bloqueado", inactive: "Inativo" };

function money(cents: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format((cents || 0) / 100);
}

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function filtersFromSearch(searchParams: Record<string, string | string[] | undefined>): EngineeringFilters {
  return {
    query: first(searchParams.q) ?? "",
    category: first(searchParams.category) ?? "",
    supplierId: Number(first(searchParams.supplierId)) || undefined,
    status: first(searchParams.status) ?? "",
    sort: (first(searchParams.sort) as EngineeringSort | undefined) ?? "name"
  };
}

export default async function EngenhariaMasterDataPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const filters = filtersFromSearch(resolvedSearchParams);
  const suppliers = listEngineeringSuppliers();
  const materials = listEngineeringRawMaterials(filters);
  const packaging = listEngineeringPackaging(filters);
  const products = listProducts();
  const materialCategories = listEngineeringMaterialCategories();
  const packagingExistingCategories = listEngineeringPackagingCategories();
  const dashboard = getEngineeringDashboard();
  const sort = filters.sort ?? "name";

  return (
    <div className="space-y-8">
      <header className="panel overflow-hidden">
        <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-red-950 p-6 text-white sm:p-8">
          <p className="text-sm font-black uppercase tracking-[0.24em] text-red-200">Banco Mestre de Engenharia</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Matérias-primas e embalagens</h1>
          <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-300">Base única reutilizada por fórmulas, precificação, compras, estoque, qualidade, memorial técnico e futuras ordens de produção.</p>
        </div>
      </header>



      <nav className="panel flex flex-wrap gap-2 p-3" aria-label="Menu interno da Engenharia">
        {engineeringMenu.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.label} href={item.href} className="inline-flex items-center gap-2 rounded-xl border border-line bg-white px-3 py-2 text-sm font-black text-ink transition hover:border-red-200 hover:bg-red-50 hover:text-red-700">
              <Icon size={16} aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <section id="produtos" className="panel overflow-hidden">
        <TableTitle title="Produtos em desenvolvimento" subtitle="Fluxo industrial: Cliente → Produto → Formulação → Embalagem → Custos → Precificação → Proposta." />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left">
            <thead>
              <tr className="table-head"><th className="px-4 py-3">Produto</th><th className="px-4 py-3">Cliente</th><th className="px-4 py-3">Categoria</th><th className="px-4 py-3">Fórmula</th><th className="px-4 py-3">Fluxo</th><th className="px-4 py-3">Ação</th></tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-slate-50">
                  <td className="table-cell"><span className="font-black text-ink">{product.name}</span><span className="block text-xs text-slate-500">{product.sku}</span></td>
                  <td className="table-cell">{product.clientBrandName}</td>
                  <td className="table-cell">{product.category ?? "-"}</td>
                  <td className="table-cell">{product.formulaVersion ?? "Em desenvolvimento"}</td>
                  <td className="table-cell"><span className="rounded-full bg-red-50 px-2 py-1 text-xs font-black text-red-700">Formulação → Custos → Proposta</span></td>
                  <td className="table-cell"><Link className="btn-secondary" href={`/admin/engenharia/produtos/${product.id}`}>Abrir produto</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <Metric icon={<Factory size={18} />} label="Matérias-primas" value={dashboard.materialCount.toString()} />
        <Metric icon={<Package size={18} />} label="Embalagens" value={dashboard.packagingCount.toString()} />
        <Metric icon={<Boxes size={18} />} label="Valor do estoque" value={money(dashboard.stockValueCents)} />
        <Metric icon={<TriangleAlert size={18} />} label="Sem fornecedor" value={dashboard.missingSupplier.toString()} tone="warning" />
        <Metric icon={<TriangleAlert size={18} />} label="Estoque mínimo" value={dashboard.lowStock.toString()} tone="danger" />
      </section>

      <section className="panel p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <form className="grid flex-1 gap-3 md:grid-cols-5">
            <label className="md:col-span-2"><span className="label">Pesquisa instantânea</span><div className="relative"><Search className="pointer-events-none absolute left-3 top-3 text-slate-400" size={16} /><input className="field pl-9" name="q" placeholder="Código, nome ou categoria" defaultValue={filters.query} /></div></label>
            <Select name="category" label="Categoria" defaultValue={filters.category} options={[...new Set([...materialCategories, ...packagingExistingCategories, ...packagingCategories])].map((item) => [item, item])} />
            <Select name="supplierId" label="Fornecedor" defaultValue={String(filters.supplierId ?? "")} options={suppliers.map((supplier) => [String(supplier.id), supplier.name])} />
            <Select name="sort" label="Ordenação" defaultValue={sort} options={[["name", "Nome"], ["code", "Código"], ["category", "Categoria"], ["supplier", "Fornecedor"], ["cost", "Custo"], ["stock", "Estoque/MOQ"], ["validity", "Validade/Lead time"], ["status", "Status"]]} />
            <button className="btn-primary md:col-span-5" type="submit"><Filter size={16} /> Aplicar filtros</button>
          </form>
          <div className="rounded-2xl border border-line bg-slate-50 p-4 lg:w-80">
            <div className="flex items-center gap-2 text-sm font-black text-ink"><TrendingUp size={17} /> Últimos preços alterados</div>
            <div className="mt-3 space-y-2">
              {dashboard.latestPriceChanges.length ? dashboard.latestPriceChanges.map((item) => <div key={item.id} className="text-xs text-slate-600"><strong className="text-ink">{item.item_code}</strong> · {money(item.cost_cents)} · {formatDate(item.created_at.slice(0, 10))}</div>) : <p className="text-xs text-slate-500">Nenhum histórico registrado ainda.</p>}
            </div>
          </div>
        </div>
      </section>

      <div id="materias-primas" className="grid gap-6 xl:grid-cols-[380px_1fr]">
        <section className="panel h-fit p-5">
          <h2 className="text-lg font-black text-ink">Cadastrar matéria-prima</h2>
          <form action={createEngineeringMaterialAction} className="mt-4 grid gap-3">
            <Field name="code" label="Código" required /><Field name="name" label="Nome" required /><Field name="category" label="Categoria" /><Select name="supplierId" label="Fornecedor" options={suppliers.map((supplier) => [String(supplier.id), supplier.name])} />
            <Field name="manufacturer" label="Fabricante" /><Field name="unit" label="Unidade" defaultValue="kg" /><Field name="costPerKg" label="Preço por kg" type="number" step="0.01" /><Field name="pricePerDose" label="Preço por dose" type="number" step="0.01" />
            <div className="grid gap-3 sm:grid-cols-2"><Field name="stockQuantity" label="Estoque" type="number" step="0.001" /><Field name="minimumStockQuantity" label="Estoque mínimo" type="number" step="0.001" /></div>
            <div className="grid gap-3 sm:grid-cols-2"><Field name="lotCode" label="Lote" /><Field name="expirationDate" label="Validade" type="date" /></div>
            <Field name="storageLocation" label="Localização" /><Select name="status" label="Status" defaultValue="active" options={Object.entries(statusLabels)} /><Textarea name="notes" label="Observações" />
            <button className="btn-primary" type="submit">Salvar matéria-prima</button>
          </form>
        </section>

        <section className="panel overflow-hidden">
          <TableTitle title="Banco de Matérias-Primas" subtitle="Tabela estilo Notion com filtros, ordenação, duplicação e dados de custo para fórmulas." />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1500px] text-left">
              <thead><tr className="table-head"><SortHead label="Código" sort="code" /><SortHead label="Nome" sort="name" /><SortHead label="Categoria" sort="category" /><SortHead label="Fornecedor" sort="supplier" /><th className="px-4 py-3">Fabricante</th><th className="px-4 py-3">Un.</th><SortHead label="Preço/kg" sort="cost" /><th className="px-4 py-3">Preço/g</th><th className="px-4 py-3">Preço/dose</th><SortHead label="Estoque" sort="stock" /><th className="px-4 py-3">Mínimo</th><th className="px-4 py-3">Lote</th><SortHead label="Validade" sort="validity" /><th className="px-4 py-3">Localização</th><SortHead label="Status" sort="status" /><th className="px-4 py-3">Observações</th><th className="px-4 py-3">Ações</th></tr></thead>
              <tbody>{materials.map((item) => <tr key={item.id} className="hover:bg-slate-50"><td className="table-cell font-black text-ink">{item.internal_code}</td><td className="table-cell">{item.name}</td><td className="table-cell">{item.category ?? "-"}</td><td className="table-cell">{item.supplier_name ?? <span className="font-bold text-red-700">Sem fornecedor</span>}</td><td className="table-cell">{item.manufacturer ?? "-"}</td><td className="table-cell">{item.unit}</td><td className="table-cell">{money(item.last_cost_cents)}</td><td className="table-cell">{money(Math.round(item.last_cost_cents / 1000))}</td><td className="table-cell">{money(item.price_per_dose_cents)}</td><td className="table-cell"><span className={item.stock_quantity <= item.minimum_stock_quantity ? "font-black text-red-700" : "font-bold text-ink"}>{item.stock_quantity}</span></td><td className="table-cell">{item.minimum_stock_quantity}</td><td className="table-cell">{item.lot_code ?? "-"}</td><td className="table-cell">{formatDate(item.expiration_date)}</td><td className="table-cell">{item.storage_location ?? "-"}</td><td className="table-cell"><Status value={item.status} /></td><td className="table-cell max-w-[220px] text-xs text-slate-600">{item.notes ?? "-"}</td><td className="table-cell"><DuplicateButton id={item.id} action={duplicateEngineeringMaterialAction} /></td></tr>)}</tbody>
            </table>
          </div>
        </section>
      </div>

      <div id="embalagens" className="grid gap-6 xl:grid-cols-[380px_1fr]">
        <section className="panel h-fit p-5">
          <h2 className="text-lg font-black text-ink">Cadastrar embalagem</h2>
          <form action={createEngineeringPackagingAction} className="mt-4 grid gap-3">
            <Field name="code" label="Código" required /><Field name="name" label="Nome" required /><Select name="category" label="Tipo" options={packagingCategories.map((item) => [item, item])} /><Select name="supplierId" label="Fornecedor" options={suppliers.map((supplier) => [String(supplier.id), supplier.name])} />
            <Field name="cost" label="Custo" type="number" step="0.01" /><div className="grid gap-3 sm:grid-cols-2"><Field name="moq" label="MOQ" type="number" /><Field name="leadTimeDays" label="Lead time (dias)" type="number" /></div>
            <Field name="color" label="Cor" /><Field name="material" label="Material" /><Textarea name="notes" label="Observações" />
            <button className="btn-primary" type="submit">Salvar embalagem</button>
          </form>
        </section>

        <section className="panel overflow-hidden">
          <TableTitle title="Banco de Embalagens" subtitle="Itens reutilizados automaticamente pela precificação: pote, tampa, rótulo, caixa, lacre e sleeve." />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-left">
              <thead><tr className="table-head"><SortHead label="Código" sort="code" /><SortHead label="Nome" sort="name" /><SortHead label="Tipo" sort="category" /><SortHead label="Fornecedor" sort="supplier" /><SortHead label="Custo" sort="cost" /><th className="px-4 py-3">MOQ</th><th className="px-4 py-3"><span className="inline-flex items-center gap-1"><Clock3 size={13} /> Lead time</span></th><th className="px-4 py-3">Cor</th><th className="px-4 py-3">Material</th><th className="px-4 py-3">Observações</th><th className="px-4 py-3">Ações</th></tr></thead>
              <tbody>{packaging.map((item) => <tr key={item.id} className="hover:bg-slate-50"><td className="table-cell font-black text-ink">{item.internal_code}</td><td className="table-cell">{item.name}</td><td className="table-cell">{item.packaging_type ?? "-"}</td><td className="table-cell">{item.supplier_name ?? <span className="font-bold text-red-700">Sem fornecedor</span>}</td><td className="table-cell">{money(item.last_cost_cents)}</td><td className="table-cell">{item.moq}</td><td className="table-cell">{item.lead_time_days} dias</td><td className="table-cell">{item.color ?? "-"}</td><td className="table-cell">{item.material ?? "-"}</td><td className="table-cell max-w-[260px] text-xs text-slate-600">{item.notes ?? "-"}</td><td className="table-cell"><DuplicateButton id={item.id} action={duplicateEngineeringPackagingAction} /></td></tr>)}</tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

function Metric({ icon, label, value, tone = "default" }: { icon: React.ReactNode; label: string; value: string; tone?: "default" | "warning" | "danger" }) { return <div className="panel p-4"><div className={tone === "danger" ? "text-red-700" : tone === "warning" ? "text-amber-700" : "text-red-700"}>{icon}</div><p className="mt-3 text-xs font-black uppercase tracking-[0.16em] text-slate-500">{label}</p><p className="mt-1 text-2xl font-black text-ink">{value}</p></div>; }
function Field(props: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) { const { label, ...inputProps } = props; return <label><span className="label">{label}</span><input className="field" {...inputProps} /></label>; }
function Textarea({ label, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) { return <label><span className="label">{label}</span><textarea className="textarea" {...props} /></label>; }
function Select({ label, name, options, defaultValue }: { label: string; name: string; options: [string, string][]; defaultValue?: string }) { return <label><span className="label">{label}</span><select className="select" name={name} defaultValue={defaultValue ?? ""}><option value="">Todos / selecionar</option>{options.map(([value, text]) => <option key={`${name}-${value}`} value={value}>{text}</option>)}</select></label>; }
function TableTitle({ title, subtitle }: { title: string; subtitle: string }) { return <div className="border-b border-line p-5"><h2 className="text-lg font-black text-ink">{title}</h2><p className="mt-1 text-sm text-slate-600">{subtitle}</p></div>; }
function SortHead({ label, sort }: { label: string; sort: EngineeringSort }) { return <th className="px-4 py-3"><Link className="inline-flex items-center gap-1 hover:text-red-700" href={`?sort=${sort}`}><ArrowDownUp size={13} />{label}</Link></th>; }
function Status({ value }: { value: string }) { return <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-black text-slate-700">{statusLabels[value] ?? value}</span>; }
function DuplicateButton({ id, action }: { id: number; action: (formData: FormData) => Promise<void> }) { return <form action={action}><input type="hidden" name="id" value={id} /><button className="btn-secondary min-h-0 px-2 py-1 text-xs" type="submit"><Copy size={13} />Duplicar</button></form>; }
