import { Beaker, Boxes, CheckCircle2, Copy, Factory, Package, Plus, Scale, Truck } from "lucide-react";
import {
  addFormulaItemAction,
  approveEngineeringFormulaAction,
  createEngineeringFormulaAction,
  createEngineeringSupplierAction,
  createPackagingMaterialAction,
  createRawMaterialAction,
  duplicateEngineeringFormulaAction
} from "@/app/admin/actions";
import { listActiveClients, listActiveProducts, getEngineeringDashboard, listEngineeringFormulas, listEngineeringSuppliers, listFormulaItems, listPackagingMaterials, listRawMaterials } from "@/lib/repository";

export const dynamic = "force-dynamic";

const units = ["kg", "g", "mg", "L", "ml", "un"];
const packagingCategories = ["Pote", "Pouch", "Tampa", "Lacre", "Scoop", "Caixa", "Rotulo", "Shrink", "Display"];

function Money({ value }: { value: number }) {
  return <span>{value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="space-y-1"><span className="label">{label}</span>{children}</label>;
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return <div className="panel p-4"><div className="mb-3 text-moss">{icon}</div><p className="text-xs font-black uppercase text-slate-500">{label}</p><p className="mt-1 text-2xl font-black text-ink">{value}</p></div>;
}

export default function EngineeringPage() {
  const dashboard = getEngineeringDashboard();
  const suppliers = listEngineeringSuppliers();
  const materials = listRawMaterials();
  const packaging = listPackagingMaterials();
  const formulas = listEngineeringFormulas();
  const clients = listActiveClients();
  const products = listActiveProducts();
  const selectedFormula = formulas[0];
  const selectedItems = selectedFormula ? listFormulaItems(selectedFormula.id) : [];

  return <div className="space-y-8">
    <section className="panel overflow-hidden bg-gradient-to-br from-ink to-moss p-6 text-white">
      <p className="text-sm font-black uppercase text-brass">Sprint 2 · Engenharia</p>
      <h1 className="mt-2 text-3xl font-black">Base técnica do Vita Power Workspace</h1>
      <p className="mt-3 max-w-3xl text-white/80">Cadastro mestre de matérias-primas, embalagens, fornecedores e fórmulas versionadas para alimentar PCP, Compras, Estoque, Produção, Financeiro e Propostas.</p>
      <div className="mt-5 flex flex-wrap gap-2 text-xs font-black uppercase text-white/80">
        {['Matérias-primas', 'Embalagens', 'Fornecedores', 'Fórmulas', 'Versões'].map((item) => <span key={item} className="rounded-full border border-white/15 px-3 py-1">{item}</span>)}
      </div>
    </section>

    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Stat icon={<Beaker size={22} />} label="Matérias-primas" value={dashboard.rawMaterialCount} />
      <Stat icon={<Package size={22} />} label="Embalagens" value={dashboard.packagingCount} />
      <Stat icon={<Truck size={22} />} label="Fornecedores" value={dashboard.supplierCount} />
      <Stat icon={<Scale size={22} />} label="Fórmulas" value={dashboard.formulaCount} />
    </section>

    <section className="grid gap-6 xl:grid-cols-3">
      <div className="panel p-5 xl:col-span-2">
        <h2 className="text-xl font-black text-ink">Cadastro Mestre de Matérias-Primas</h2>
        <form action={createRawMaterialAction} className="mt-4 grid gap-3 md:grid-cols-3">
          <Field label="Nome"><input className="field" name="name" required /></Field>
          <Field label="Código interno"><input className="field" name="internalCode" required /></Field>
          <Field label="Categoria"><input className="field" name="category" /></Field>
          <Field label="Fornecedor principal"><select className="select" name="primarySupplierId"><option value="0">Selecionar</option>{suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}</select></Field>
          <Field label="Fornecedor secundário"><select className="select" name="secondarySupplierId"><option value="0">Selecionar</option>{suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}</select></Field>
          <Field label="Unidade"><select className="select" name="unit">{units.map((unit) => <option key={unit}>{unit}</option>)}</select></Field>
          <Field label="Preço por kg"><input className="field" name="pricePerKg" type="number" step="0.0001" /></Field>
          <Field label="Estoque mínimo"><input className="field" name="minimumStock" type="number" step="0.001" /></Field>
          <Field label="Lead time"><input className="field" name="leadTimeDays" type="number" /></Field>
          <Field label="Lote"><input className="field" name="lot" /></Field>
          <Field label="Fabricante"><input className="field" name="manufacturer" /></Field>
          <Field label="Validade"><input className="field" name="expirationDate" type="date" /></Field>
          <Field label="Status"><select className="select" name="status"><option>Ativo</option><option>Inativo</option></select></Field>
          <label className="space-y-1 md:col-span-2"><span className="label">Especificação técnica</span><textarea className="textarea" name="technicalSpecification" /></label>
          <button className="btn-primary md:col-span-3"><Plus size={16} />Cadastrar matéria-prima</button>
        </form>
      </div>

      <div className="panel p-5">
        <h2 className="text-xl font-black text-ink">Fornecedores</h2>
        <form action={createEngineeringSupplierAction} className="mt-4 space-y-3">
          <Field label="Nome"><input className="field" name="name" required /></Field>
          <Field label="Contato"><input className="field" name="contactName" /></Field>
          <Field label="E-mail"><input className="field" name="email" type="email" /></Field>
          <Field label="Telefone"><input className="field" name="phone" /></Field>
          <Field label="Categoria"><input className="field" name="category" placeholder="MP, embalagem ou ambos" /></Field>
          <button className="btn-primary w-full"><Truck size={16} />Cadastrar fornecedor</button>
        </form>
      </div>
    </section>

    <section className="panel overflow-hidden">
      <div className="border-b border-line px-5 py-4"><h2 className="text-lg font-black text-ink">Banco de matérias-primas</h2><p className="text-sm text-slate-600">Preço por g calculado automaticamente a partir do preço/kg.</p></div>
      <div className="overflow-x-auto"><table className="w-full min-w-[1100px] text-left text-sm"><thead><tr className="table-head"><th className="px-4 py-3">Código</th><th className="px-4 py-3">Nome</th><th className="px-4 py-3">Categoria</th><th className="px-4 py-3">Fornecedor</th><th className="px-4 py-3">Un.</th><th className="px-4 py-3">R$/kg</th><th className="px-4 py-3">R$/g</th><th className="px-4 py-3">Lead</th><th className="px-4 py-3">Lote</th><th className="px-4 py-3">Status</th></tr></thead><tbody>{materials.map((material) => <tr key={material.id}><td className="table-cell font-black text-moss">{material.internal_code}</td><td className="table-cell">{material.name}</td><td className="table-cell">{material.category}</td><td className="table-cell">{material.primary_supplier_name ?? '—'}</td><td className="table-cell">{material.unit}</td><td className="table-cell"><Money value={material.price_per_kg} /></td><td className="table-cell"><Money value={material.price_per_g} /></td><td className="table-cell">{material.lead_time_days} dias</td><td className="table-cell">{material.lot ?? '—'}</td><td className="table-cell">{material.status}</td></tr>)}</tbody></table></div>
    </section>

    <section className="grid gap-6 xl:grid-cols-3">
      <div className="panel p-5 xl:col-span-1">
        <h2 className="text-xl font-black text-ink">Cadastro Mestre de Embalagens</h2>
        <form action={createPackagingMaterialAction} className="mt-4 space-y-3">
          <Field label="Nome"><input className="field" name="name" required /></Field>
          <Field label="Código interno"><input className="field" name="internalCode" required /></Field>
          <Field label="Tipo"><select className="select" name="category">{packagingCategories.map((category) => <option key={category}>{category}</option>)}</select></Field>
          <Field label="Fornecedor"><select className="select" name="supplierId"><option value="0">Selecionar</option>{suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}</select></Field>
          <Field label="Custo unitário"><input className="field" name="unitCost" type="number" step="0.0001" /></Field>
          <Field label="Estoque mínimo"><input className="field" name="minimumStock" type="number" step="0.001" /></Field>
          <Field label="Lead time"><input className="field" name="leadTimeDays" type="number" /></Field>
          <Field label="Lote"><input className="field" name="lot" /></Field>
          <Field label="Fabricante"><input className="field" name="manufacturer" /></Field>
          <Field label="Status"><select className="select" name="status"><option>Ativo</option><option>Inativo</option></select></Field>
          <label className="space-y-1"><span className="label">Especificação técnica</span><textarea className="textarea" name="technicalSpecification" /></label>
          <button className="btn-primary w-full"><Boxes size={16} />Cadastrar embalagem</button>
        </form>
      </div>
      <div className="panel overflow-hidden xl:col-span-2"><div className="border-b border-line px-5 py-4"><h2 className="text-lg font-black text-ink">Banco de embalagens</h2><p className="text-sm text-slate-600">Custo automático por item consumido nas próximas sprints de precificação.</p></div><div className="overflow-x-auto"><table className="w-full min-w-[850px] text-left text-sm"><thead><tr className="table-head"><th className="px-4 py-3">Código</th><th className="px-4 py-3">Nome</th><th className="px-4 py-3">Tipo</th><th className="px-4 py-3">Fornecedor</th><th className="px-4 py-3">Custo</th><th className="px-4 py-3">Lead</th><th className="px-4 py-3">Status</th></tr></thead><tbody>{packaging.map((item) => <tr key={item.id}><td className="table-cell font-black text-moss">{item.internal_code}</td><td className="table-cell">{item.name}</td><td className="table-cell">{item.category}</td><td className="table-cell">{item.supplier_name ?? '—'}</td><td className="table-cell"><Money value={item.unit_cost} /></td><td className="table-cell">{item.lead_time_days} dias</td><td className="table-cell">{item.status}</td></tr>)}</tbody></table></div></div>
    </section>

    <section className="grid gap-6 xl:grid-cols-3">
      <div className="panel p-5">
        <h2 className="text-xl font-black text-ink">Nova fórmula</h2>
        <form action={createEngineeringFormulaAction} className="mt-4 space-y-3">
          <Field label="Nome"><input className="field" name="name" required /></Field>
          <Field label="Código"><input className="field" name="code" required /></Field>
          <Field label="Versão"><input className="field" name="version" defaultValue="v1" required /></Field>
          <Field label="Cliente"><select className="select" name="clientId"><option value="0">Selecionar</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.brandName}</option>)}</select></Field>
          <Field label="Produto"><select className="select" name="productId"><option value="0">Selecionar</option>{products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}</select></Field>
          <Field label="Categoria"><input className="field" name="category" /></Field>
          <Field label="Responsável"><input className="field" name="responsible" /></Field>
          <Field label="Data"><input className="field" name="formulaDate" type="date" defaultValue={new Date().toISOString().slice(0, 10)} /></Field>
          <button className="btn-primary w-full"><Factory size={16} />Criar fórmula</button>
        </form>
      </div>

      <div className="panel p-5 xl:col-span-2">
        <h2 className="text-xl font-black text-ink">Ingredientes da versão ativa</h2>
        {selectedFormula ? <><p className="mt-1 text-sm text-slate-600">{selectedFormula.name} · {selectedFormula.code} · {selectedFormula.version}</p><form action={addFormulaItemAction} className="mt-4 grid gap-3 md:grid-cols-3"><input type="hidden" name="formulaId" value={selectedFormula.id} /><Field label="Matéria-prima"><select className="select" name="rawMaterialId">{materials.map((material) => <option key={material.id} value={material.id}>{material.internal_code} · {material.name}</option>)}</select></Field><Field label="%"><input className="field" name="percentage" type="number" step="0.0001" /></Field><Field label="g por dose"><input className="field" name="gramsPerServing" type="number" step="0.0001" /></Field><Field label="g por pote"><input className="field" name="gramsPerContainer" type="number" step="0.0001" /></Field><Field label="kg por lote"><input className="field" name="kgPerBatch" type="number" step="0.0001" /></Field><Field label="Observações"><input className="field" name="notes" /></Field><button className="btn-primary md:col-span-3"><Plus size={16} />Adicionar ingrediente</button></form><div className="mt-5 overflow-x-auto"><table className="w-full min-w-[780px] text-left text-sm"><thead><tr className="table-head"><th className="px-4 py-3">MP</th><th className="px-4 py-3">%</th><th className="px-4 py-3">g/dose</th><th className="px-4 py-3">g/pote</th><th className="px-4 py-3">kg/lote</th><th className="px-4 py-3">Custo</th></tr></thead><tbody>{selectedItems.map((item) => <tr key={item.id}><td className="table-cell font-black text-ink">{item.raw_material_code} · {item.raw_material_name}</td><td className="table-cell">{item.percentage}%</td><td className="table-cell">{item.grams_per_serving}</td><td className="table-cell">{item.grams_per_container}</td><td className="table-cell">{item.kg_per_batch}</td><td className="table-cell"><Money value={item.cost} /></td></tr>)}</tbody></table></div></> : <p className="text-sm text-slate-600">Crie uma fórmula para iniciar a engenharia de ingredientes.</p>}
      </div>
    </section>

    <section className="panel overflow-hidden"><div className="border-b border-line px-5 py-4"><h2 className="text-lg font-black text-ink">Banco de versões, comparação e aprovação</h2><p className="text-sm text-slate-600">Duplique versões, compare totais e aprove fórmulas sem implementar propostas, precificação ou PDF nesta sprint.</p></div><div className="overflow-x-auto"><table className="w-full min-w-[980px] text-left text-sm"><thead><tr className="table-head"><th className="px-4 py-3">Código</th><th className="px-4 py-3">Versão</th><th className="px-4 py-3">Nome</th><th className="px-4 py-3">Cliente</th><th className="px-4 py-3">Produto</th><th className="px-4 py-3">%</th><th className="px-4 py-3">Custo lote</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Ações</th></tr></thead><tbody>{formulas.map((formula) => <tr key={formula.id}><td className="table-cell font-black text-moss">{formula.code}</td><td className="table-cell">{formula.version}</td><td className="table-cell">{formula.name}</td><td className="table-cell">{formula.client_brand_name ?? '—'}</td><td className="table-cell">{formula.product_name ?? '—'}</td><td className="table-cell">{formula.total_percentage.toFixed(2)}%</td><td className="table-cell"><Money value={formula.total_cost} /></td><td className="table-cell">{formula.status}</td><td className="table-cell"><div className="flex gap-2"><form action={duplicateEngineeringFormulaAction}><input type="hidden" name="formulaId" value={formula.id} /><button className="btn-secondary"><Copy size={14} />Duplicar</button></form><form action={approveEngineeringFormulaAction}><input type="hidden" name="formulaId" value={formula.id} /><button className="btn-secondary"><CheckCircle2 size={14} />Aprovar</button></form></div></td></tr>)}</tbody></table></div></section>
  </div>;
}
