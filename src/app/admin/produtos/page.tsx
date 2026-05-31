import { ProductForm } from "@/components/product-form";
import { listActiveClients, listProducts } from "@/lib/repository";
import { formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default function AdminProductsPage() {
  const clients = listActiveClients();
  const products = listProducts();

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-bold uppercase text-brass">Catálogo</p>
        <h1 className="mt-2 text-3xl font-black text-ink">Produtos</h1>
      </div>

      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <ProductForm clients={clients} />

        <section className="panel overflow-hidden">
          <div className="border-b border-line px-5 py-4">
            <h2 className="text-lg font-black text-ink">Produtos cadastrados</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] border-collapse text-left">
              <thead>
                <tr className="table-head">
                  <th className="px-4 py-3">Produto</th>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Categoria</th>
                  <th className="px-4 py-3">Fórmula</th>
                  <th className="px-4 py-3">Cadastro</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id}>
                    <td className="table-cell">
                      <span className="font-black text-moss">{product.name}</span>
                      <span className="block text-xs text-slate-500">{product.sku}</span>
                    </td>
                    <td className="table-cell">{product.clientBrandName}</td>
                    <td className="table-cell">{product.category ?? "-"}</td>
                    <td className="table-cell">{product.formulaVersion ?? "-"}</td>
                    <td className="table-cell">{formatDateTime(product.createdAt)}</td>
                    <td className="table-cell">
                      <span className={product.active ? "text-sm font-black text-leaf" : "text-sm font-black text-slate-500"}>
                        {product.active ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
