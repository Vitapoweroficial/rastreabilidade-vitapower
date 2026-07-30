import type { ReactNode } from "react";
import { Beaker, Boxes, CheckCircle2, Copy, Factory, Package, Plus, Scale, Truck } from "lucide-react";
import {
  addFormulaItemAction,
  addFormulaPackagingItemAction,
  approveEngineeringFormulaAction,
  createEngineeringFormulaAction,
  createEngineeringProjectAction,
  createProposalFromPricingAction,
  createEngineeringSupplierAction,
  createPackagingMaterialAction,
  createRawMaterialAction,
  duplicateEngineeringFormulaAction,
  sendFormulaToPricingAction
} from "@/app/admin/actions";
import {
  getEngineeringDashboard,
  listActiveClients,
  listActiveProducts,
  listCommercialProposals,
  listEngineeringFormulas,
  listEngineeringProjects,
  listEngineeringSuppliers,
  listFormulaItems,
  listFormulaPackagingItems,
  listPackagingMaterials,
  listPricingRequests,
  listRawMaterials
} from "@/lib/repository";

export const dynamic = "force-dynamic";

const units = ["kg", "g", "mg", "L", "ml", "un"];
const packagingCategories = ["Pote", "Pouch", "Tampa", "Lacre", "Scoop", "Caixa", "Rotulo", "Shrink", "Display"];

function Money({ value }: { value: number }) {
  return <span>{value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="space-y-1">
      <span className="label">{label}</span>
      {children}
    </label>
  );
}

function Stat({ icon, label, value }: { icon: ReactNode; label: string; value: string | number }) {
  return (
    <div className="panel p-4">
      <div className="mb-3 text-moss">{icon}</div>
      <p className="text-xs font-black uppercase text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-black text-ink">{value}</p>
    </div>
  );
}

export default async function EngineeringPage() {
  const [
    dashboard,
    suppliers,
    materials,
    packaging,
    formulas,
    clients,
    products,
    projects,
    pricingRequests,
    proposals
  ] = await Promise.all([
    getEngineeringDashboard(),
    listEngineeringSuppliers(),
    listRawMaterials(),
    listPackagingMaterials(),
    listEngineeringFormulas(),
    listActiveClients(),
    listActiveProducts(),
    listEngineeringProjects(),
    listPricingRequests(),
    listCommercialProposals()
  ]);

  const selectedFormula = formulas[0];
  const [selectedItems, selectedPackaging] = selectedFormula
    ? await Promise.all([
        listFormulaItems(selectedFormula.id),
        listFormulaPackagingItems(selectedFormula.id)
      ])
    : [[], []];

  return (
    <div className="space-y-8">
      <section className="panel overflow-hidden bg-gradient-to-br from-ink to-moss p-6 text-white">
        <p className="text-sm font-black uppercase text-brass">Engenharia</p>
        <h1 className="mt-2 text-3xl font-black">Base técnica do Vita Power Workspace</h1>
        <p className="mt-3 max-w-3xl text-white/80">
          Cadastro mestre de matérias-primas, embalagens, fornecedores, fórmulas, custos e projetos private label.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat icon={<Beaker size={22} />} label="Matérias-primas" value={dashboard.rawMaterialCount} />
        <Stat icon={<Package size={22} />} label="Embalagens" value={dashboard.packagingCount} />
        <Stat icon={<Truck size={22} />} label="Fornecedores" value={dashboard.supplierCount} />
        <Stat icon={<Scale size={22} />} label="Fórmulas" value={dashboard.formulaCount} />
      </section>

      <section className="panel p-5">
        <h2 className="text-xl font-black text-ink">Novo projeto</h2>
        <form action={createEngineeringProjectAction} className="mt-4 grid gap-3 md:grid-cols-4">
          <Field label="Cliente">
            <select className="select" name="clientId" required>
              <option value="">Selecionar</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>{client.brandName}</option>
              ))}
            </select>
          </Field>
          <Field label="Produto">
            <select className="select" name="productId">
              <option value="0">Novo produto</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>{product.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Nome do projeto">
            <input className="field" name="name" required placeholder="Creatina 300g private label" />
          </Field>
          <Field label="Briefing">
            <textarea className="textarea" name="briefing" />
          </Field>
          <button className="btn-primary md:col-span-4"><Plus size={16} />Criar projeto</button>
        </form>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {projects.map((project) => (
            <div key={project.id} className="rounded-xl border border-line bg-white p-3">
              <p className="font-black text-ink">{project.name}</p>
              <p className="text-sm text-slate-600">{project.client_brand_name} · {project.status}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <div className="panel p-5 xl:col-span-2">
          <h2 className="text-xl font-black text-ink">Cadastro de matérias-primas</h2>
          <form action={createRawMaterialAction} className="mt-4 grid gap-3 md:grid-cols-3">
            <Field label="Nome"><input className="field" name="name" required /></Field>
            <Field label="Código interno"><input className="field" name="internalCode" required /></Field>
            <Field label="Categoria"><input className="field" name="category" /></Field>
            <Field label="Fornecedor principal">
              <select className="select" name="primarySupplierId">
                <option value="0">Selecionar</option>
                {suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}
              </select>
            </Field>
            <Field label="Fornecedor secundário">
              <select className="select" name="secondarySupplierId">
                <option value="0">Selecionar</option>
                {suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}
              </select>
            </Field>
            <Field label="Unidade">
              <select className="select" name="unit">{units.map((unit) => <option key={unit}>{unit}</option>)}</select>
            </Field>
            <Field label="Preço por kg"><input className="field" name="pricePerKg" type="number" step="0.0001" /></Field>
            <Field label="Estoque mínimo"><input className="field" name="minimumStock" type="number" step="0.001" /></Field>
            <Field label="Lead time"><input className="field" name="leadTimeDays" type="number" /></Field>
            <Field label="Lote"><input className="field" name="lot" /></Field>
            <Field label="Fabricante"><input className="field" name="manufacturer" /></Field>
            <Field label="Validade"><input className="field" name="expirationDate" type="date" /></Field>
            <Field label="Status">
              <select className="select" name="status"><option>Ativo</option><option>Inativo</option></select>
            </Field>
            <label className="space-y-1 md:col-span-2">
              <span className="label">Especificação técnica</span>
              <textarea className="textarea" name="technicalSpecification" />
            </label>
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
        <div className="border-b border-line px-5 py-4">
          <h2 className="text-lg font-black text-ink">Banco de matérias-primas</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-left text-sm">
            <thead><tr className="table-head"><th className="px-4 py-3">Código</th><th className="px-4 py-3">Nome</th><th className="px-4 py-3">Categoria</th><th className="px-4 py-3">Fornecedor</th><th className="px-4 py-3">Un.</th><th className="px-4 py-3">R$/kg</th><th className="px-4 py-3">R$/g</th><th className="px-4 py-3">Status</th></tr></thead>
            <tbody>
              {materials.map((material) => (
                <tr key={material.id}>
                  <td className="table-cell font-black text-moss">{material.internal_code}</td>
                  <td className="table-cell">{material.name}</td>
                  <td className="table-cell">{material.category ?? "—"}</td>
                  <td className="table-cell">{material.primary_supplier_name ?? "—"}</td>
                  <td className="table-cell">{material.unit}</td>
                  <td className="table-cell"><Money value={material.price_per_kg} /></td>
                  <td className="table-cell"><Money value={material.price_per_g} /></td>
                  <td className="table-cell">{material.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <div className="panel p-5">
          <h2 className="text-xl font-black text-ink">Cadastro de embalagens</h2>
          <form action={createPackagingMaterialAction} className="mt-4 space-y-3">
            <Field label="Nome"><input className="field" name="name" required /></Field>
            <Field label="Código interno"><input className="field" name="internalCode" required /></Field>
            <Field label="Tipo">
              <select className="select" name="category">{packagingCategories.map((category) => <option key={category}>{category}</option>)}</select>
            </Field>
            <Field label="Fornecedor">
              <select className="select" name="supplierId">
                <option value="0">Selecionar</option>
                {suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}
              </select>
            </Field>
            <Field label="Custo unitário"><input className="field" name="unitCost" type="number" step="0.0001" /></Field>
            <Field label="Estoque mínimo"><input className="field" name="minimumStock" type="number" step="0.001" /></Field>
            <Field label="Lead time"><input className="field" name="leadTimeDays" type="number" /></Field>
            <Field label="Lote"><input className="field" name="lot" /></Field>
            <Field label="Fabricante"><input className="field" name="manufacturer" /></Field>
            <Field label="Status"><select className="select" name="status"><option>Ativo</option><option>Inativo</option></select></Field>
            <Field label="Especificação técnica"><textarea className="textarea" name="technicalSpecification" /></Field>
            <button className="btn-primary w-full"><Boxes size={16} />Cadastrar embalagem</button>
          </form>
        </div>

        <div className="panel overflow-hidden xl:col-span-2">
          <div className="border-b border-line px-5 py-4"><h2 className="text-lg font-black text-ink">Banco de embalagens</h2></div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px] text-left text-sm">
              <thead><tr className="table-head"><th className="px-4 py-3">Código</th><th className="px-4 py-3">Nome</th><th className="px-4 py-3">Tipo</th><th className="px-4 py-3">Fornecedor</th><th className="px-4 py-3">Custo</th><th className="px-4 py-3">Status</th></tr></thead>
              <tbody>
                {packaging.map((item) => (
                  <tr key={item.id}>
                    <td className="table-cell font-black text-moss">{item.internal_code}</td>
                    <td className="table-cell">{item.name}</td>
                    <td className="table-cell">{item.category}</td>
                    <td className="table-cell">{item.supplier_name ?? "—"}</td>
                    <td className="table-cell"><Money value={item.unit_cost} /></td>
                    <td className="table-cell">{item.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
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
          <h2 className="text-xl font-black text-ink">Versão ativa</h2>
          {selectedFormula ? (
            <>
              <p className="mt-1 text-sm text-slate-600">{selectedFormula.name} · {selectedFormula.code} · {selectedFormula.version}</p>
              <form action={addFormulaItemAction} className="mt-4 grid gap-3 md:grid-cols-3">
                <input type="hidden" name="formulaId" value={selectedFormula.id} />
                <Field label="Matéria-prima"><select className="select" name="rawMaterialId">{materials.map((material) => <option key={material.id} value={material.id}>{material.internal_code} · {material.name}</option>)}</select></Field>
                <Field label="%"><input className="field" name="percentage" type="number" step="0.0001" /></Field>
                <Field label="g por dose"><input className="field" name="gramsPerServing" type="number" step="0.0001" /></Field>
                <Field label="g por pote"><input className="field" name="gramsPerContainer" type="number" step="0.0001" /></Field>
                <Field label="kg por lote"><input className="field" name="kgPerBatch" type="number" step="0.0001" /></Field>
                <Field label="Observações"><input className="field" name="notes" /></Field>
                <button className="btn-primary md:col-span-3"><Plus size={16} />Adicionar ingrediente</button>
              </form>

              <div className="mt-5 overflow-x-auto">
                <table className="w-full min-w-[700px] text-left text-sm">
                  <thead><tr className="table-head"><th className="px-4 py-3">MP</th><th className="px-4 py-3">%</th><th className="px-4 py-3">g/dose</th><th className="px-4 py-3">g/pote</th><th className="px-4 py-3">kg/lote</th><th className="px-4 py-3">Custo</th></tr></thead>
                  <tbody>{selectedItems.map((item) => <tr key={item.id}><td className="table-cell font-black text-ink">{item.raw_material_code} · {item.raw_material_name}</td><td className="table-cell">{item.percentage}%</td><td className="table-cell">{item.grams_per_serving}</td><td className="table-cell">{item.grams_per_container}</td><td className="table-cell">{item.kg_per_batch}</td><td className="table-cell"><Money value={item.cost} /></td></tr>)}</tbody>
                </table>
              </div>

              <form action={addFormulaPackagingItemAction} className="mt-5 grid gap-3 md:grid-cols-3">
                <input type="hidden" name="formulaId" value={selectedFormula.id} />
                <Field label="Embalagem"><select className="select" name="packagingMaterialId">{packaging.map((item) => <option key={item.id} value={item.id}>{item.category} · {item.name}</option>)}</select></Field>
                <Field label="Quantidade"><input className="field" name="quantity" type="number" step="0.0001" defaultValue="1" /></Field>
                <button className="btn-secondary"><Package size={16} />Adicionar embalagem</button>
              </form>

              <div className="mt-3 grid gap-2 md:grid-cols-2">
                {selectedPackaging.map((item) => (
                  <div key={item.id} className="rounded-xl border border-line bg-white p-3 text-sm">
                    <span className="font-black text-ink">{item.category} · {item.packaging_name}</span>
                    <span className="block text-slate-600">Qtd. {item.quantity} · <Money value={item.cost} /></span>
                  </div>
                ))}
              </div>

              <form action={sendFormulaToPricingAction} className="mt-5">
                <input type="hidden" name="formulaId" value={selectedFormula.id} />
                <select className="select mb-3" name="projectId"><option value="0">Sem projeto vinculado</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select>
                <button className="btn-primary"><Scale size={16} />Enviar para precificação</button>
              </form>
            </>
          ) : (
            <p className="text-sm text-slate-600">Crie uma fórmula para iniciar a engenharia.</p>
          )}
        </div>
      </section>

      <section className="panel overflow-hidden">
        <div className="border-b border-line px-5 py-4"><h2 className="text-lg font-black text-ink">Banco de versões</h2></div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[950px] text-left text-sm">
            <thead><tr className="table-head"><th className="px-4 py-3">Código</th><th className="px-4 py-3">Versão</th><th className="px-4 py-3">Nome</th><th className="px-4 py-3">Cliente</th><th className="px-4 py-3">%</th><th className="px-4 py-3">Custo</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Ações</th></tr></thead>
            <tbody>
              {formulas.map((formula) => (
                <tr key={formula.id}>
                  <td className="table-cell font-black text-moss">{formula.code}</td>
                  <td className="table-cell">{formula.version}</td>
                  <td className="table-cell">{formula.name}</td>
                  <td className="table-cell">{formula.client_brand_name ?? "—"}</td>
                  <td className="table-cell">{formula.total_percentage.toFixed(2)}%</td>
                  <td className="table-cell"><Money value={formula.total_cost} /></td>
                  <td className="table-cell">{formula.status}</td>
                  <td className="table-cell">
                    <div className="flex gap-2">
                      <form action={duplicateEngineeringFormulaAction}><input type="hidden" name="formulaId" value={formula.id} /><button className="btn-secondary"><Copy size={14} />Duplicar</button></form>
                      <form action={approveEngineeringFormulaAction}><input type="hidden" name="formulaId" value={formula.id} /><button className="btn-secondary"><CheckCircle2 size={14} />Aprovar</button></form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="panel overflow-hidden">
          <div className="border-b border-line px-5 py-4"><h2 className="text-lg font-black text-ink">Fila de precificação</h2></div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead><tr className="table-head"><th className="px-4 py-3">Fórmula</th><th className="px-4 py-3">MP</th><th className="px-4 py-3">Embalagem</th><th className="px-4 py-3">Industrial</th><th className="px-4 py-3">Ação</th></tr></thead>
              <tbody>
                {pricingRequests.map((request) => (
                  <tr key={request.id}>
                    <td className="table-cell font-black text-ink">{request.formula_name}</td>
                    <td className="table-cell"><Money value={request.raw_material_cost} /></td>
                    <td className="table-cell"><Money value={request.packaging_cost} /></td>
                    <td className="table-cell"><Money value={request.industrial_cost} /></td>
                    <td className="table-cell"><form action={createProposalFromPricingAction}><input type="hidden" name="pricingRequestId" value={request.id} /><button className="btn-secondary">Gerar proposta</button></form></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel overflow-hidden">
          <div className="border-b border-line px-5 py-4"><h2 className="text-lg font-black text-ink">Propostas comerciais</h2></div>
          <div className="space-y-3 p-5">
            {proposals.map((proposal) => (
              <div key={proposal.id} className="rounded-xl border border-line bg-white p-4">
                <p className="font-black text-ink">{proposal.title}</p>
                <p className="mt-1 text-sm text-slate-600">{proposal.client_brand_name} · {proposal.send_status}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
