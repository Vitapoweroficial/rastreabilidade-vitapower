import { Save } from "lucide-react";
import { createLotAction } from "@/app/admin/actions";
import type { Product } from "@/lib/types";

export function LotForm({ products }: { products: Product[] }) {
  return (
    <section className="panel h-fit p-5">
      <h2 className="text-lg font-black text-ink">Novo lote</h2>
      <form action={createLotAction} className="mt-5 space-y-4">
        <div>
          <label className="label" htmlFor="productId">
            Produto
          </label>
          <select className="select" id="productId" name="productId" required defaultValue="">
            <option value="" disabled>
              Selecione
            </option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.clientBrandName} / {product.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
          <div>
            <label className="label" htmlFor="code">
              Código do lote
            </label>
            <input className="field" id="code" name="code" required placeholder="VPW-2026-001" />
          </div>
          <div>
            <label className="label" htmlFor="status">
              Status
            </label>
            <select className="select" id="status" name="status" required defaultValue="released">
              <option value="released">Liberado</option>
              <option value="quarantine">Quarentena</option>
              <option value="blocked">Bloqueado</option>
              <option value="expired">Vencido</option>
            </select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="manufacturingDate">
              Fabricação
            </label>
            <input className="field" id="manufacturingDate" name="manufacturingDate" type="date" required />
          </div>
          <div>
            <label className="label" htmlFor="expirationDate">
              Validade
            </label>
            <input className="field" id="expirationDate" name="expirationDate" type="date" required />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-[1fr_110px]">
          <div>
            <label className="label" htmlFor="quantity">
              Quantidade
            </label>
            <input className="field" id="quantity" name="quantity" type="number" min="0" required placeholder="1200" />
          </div>
          <div>
            <label className="label" htmlFor="unit">
              Unidade
            </label>
            <input className="field" id="unit" name="unit" defaultValue="un" />
          </div>
        </div>

        <div>
          <label className="label" htmlFor="origin">
            Origem
          </label>
          <input className="field" id="origin" name="origin" placeholder="Linha 2 / Planta Vita Power" />
        </div>

        <div>
          <label className="label" htmlFor="analysisSummary">
            Resumo de análise
          </label>
          <textarea className="textarea" id="analysisSummary" name="analysisSummary" placeholder="Parâmetros de liberação" />
        </div>

        <div>
          <label className="label" htmlFor="traceabilityNotes">
            Observações
          </label>
          <textarea className="textarea" id="traceabilityNotes" name="traceabilityNotes" placeholder="Notas de rastreabilidade" />
        </div>

        <button className="btn-primary w-full" type="submit" disabled={products.length === 0}>
          <Save size={18} aria-hidden="true" />
          Salvar lote
        </button>
      </form>
    </section>
  );
}
