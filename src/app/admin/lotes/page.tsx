import Image from "next/image";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { LotForm } from "@/components/lot-form";
import { StatusBadge } from "@/components/status-badge";
import { listActiveProducts, listLots } from "@/lib/repository";
import { formatDate, formatQuantity } from "@/lib/format";

export const dynamic = "force-dynamic";

export default function AdminLotsPage() {
  const products = listActiveProducts();
  const lots = listLots();

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-bold uppercase text-brass">Rastreabilidade</p>
        <h1 className="mt-2 text-3xl font-black text-ink">Lotes</h1>
      </div>

      <div className="grid gap-6 2xl:grid-cols-[440px_1fr]">
        <LotForm products={products} />

        <section className="panel overflow-hidden">
          <div className="border-b border-line px-5 py-4">
            <h2 className="text-lg font-black text-ink">Lotes cadastrados</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1040px] border-collapse text-left">
              <thead>
                <tr className="table-head">
                  <th className="px-4 py-3">QR</th>
                  <th className="px-4 py-3">Lote</th>
                  <th className="px-4 py-3">Produto</th>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Fabricação</th>
                  <th className="px-4 py-3">Validade</th>
                  <th className="px-4 py-3">Quantidade</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Consulta</th>
                </tr>
              </thead>
              <tbody>
                {lots.map((lot) => (
                  <tr key={lot.id}>
                    <td className="table-cell">
                      <div className="h-16 w-16 rounded-lg border border-line bg-white p-1">
                        <Image
                          src={`/api/lotes/${encodeURIComponent(lot.code)}/qr`}
                          alt={`QR Code do lote ${lot.code}`}
                          width={64}
                          height={64}
                          unoptimized
                        />
                      </div>
                    </td>
                    <td className="table-cell font-black text-moss">{lot.code}</td>
                    <td className="table-cell">
                      <span className="font-bold text-ink">{lot.productName}</span>
                      <span className="block text-xs text-slate-500">{lot.sku}</span>
                    </td>
                    <td className="table-cell">{lot.clientBrandName}</td>
                    <td className="table-cell">{formatDate(lot.manufacturingDate)}</td>
                    <td className="table-cell">{formatDate(lot.expirationDate)}</td>
                    <td className="table-cell">{formatQuantity(lot.quantity, lot.unit)}</td>
                    <td className="table-cell">
                      <StatusBadge status={lot.status} />
                    </td>
                    <td className="table-cell">
                      <Link href={`/lote/${encodeURIComponent(lot.code)}`} className="btn-secondary">
                        <ExternalLink size={16} aria-hidden="true" />
                        Abrir
                      </Link>
                    </td>
                  </tr>
                ))}
                {lots.length === 0 ? (
                  <tr>
                    <td className="table-cell text-slate-500" colSpan={9}>
                      Nenhum lote cadastrado.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
