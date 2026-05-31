import { Save } from "lucide-react";
import { createProductAction } from "@/app/admin/actions";
import type { Client } from "@/lib/types";

export function ProductForm({ clients }: { clients: Client[] }) {
  return (
    <section className="panel h-fit p-5">
      <h2 className="text-lg font-black text-ink">Novo produto</h2>
      <form action={createProductAction} className="mt-5 space-y-4">
        <div>
          <label className="label" htmlFor="clientId">
            Cliente
          </label>
          <select className="select" id="clientId" name="clientId" required defaultValue="">
            <option value="" disabled>
              Selecione
            </option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.brandName}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
          <div>
            <label className="label" htmlFor="sku">
              SKU
            </label>
            <input className="field" id="sku" name="sku" required placeholder="VPW-PROT-001" />
          </div>
          <div>
            <label className="label" htmlFor="formulaVersion">
              Fórmula
            </label>
            <input className="field" id="formulaVersion" name="formulaVersion" placeholder="F-2026.01" />
          </div>
        </div>

        <div>
          <label className="label" htmlFor="name">
            Produto
          </label>
          <input className="field" id="name" name="name" required placeholder="Whey Protein Baunilha 900g" />
        </div>

        <div>
          <label className="label" htmlFor="category">
            Categoria
          </label>
          <input className="field" id="category" name="category" placeholder="Suplementos proteicos" />
        </div>

        <div>
          <label className="label" htmlFor="description">
            Descrição
          </label>
          <textarea className="textarea" id="description" name="description" placeholder="Resumo do produto" />
        </div>

        <label className="flex items-center gap-3 text-sm font-bold text-ink">
          <input className="h-4 w-4 accent-leaf" type="checkbox" name="active" defaultChecked />
          Produto ativo
        </label>

        <button className="btn-primary w-full" type="submit" disabled={clients.length === 0}>
          <Save size={18} aria-hidden="true" />
          Salvar produto
        </button>
      </form>
    </section>
  );
}
