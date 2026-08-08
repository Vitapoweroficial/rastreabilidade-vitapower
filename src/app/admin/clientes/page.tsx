import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ClientForm } from "@/components/client-form";
import { listClients } from "@/lib/repository";
import { formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminClientsPage() {
  const clients = await listClients();

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-bold uppercase text-brass">Private label</p>
        <h1 className="mt-2 text-3xl font-black text-ink">Clientes</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Cada cliente agora possui um DNA operacional com projetos, produtos, fórmulas, propostas e lotes conectados.</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <ClientForm />

        <section className="panel overflow-hidden">
          <div className="border-b border-line px-5 py-4">
            <h2 className="text-lg font-black text-ink">Clientes cadastrados</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] border-collapse text-left">
              <thead>
                <tr className="table-head">
                  <th className="px-4 py-3">Marca</th>
                  <th className="px-4 py-3">Razão social</th>
                  <th className="px-4 py-3">Contato</th>
                  <th className="px-4 py-3">Cadastro</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">DNA</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client) => (
                  <tr key={client.id} className="transition hover:bg-slate-50">
                    <td className="table-cell">
                      <span className="font-black text-moss">{client.brandName}</span>
                      <span className="block text-xs text-slate-500">{client.taxId ?? "CNPJ não informado"}</span>
                    </td>
                    <td className="table-cell">{client.legalName}</td>
                    <td className="table-cell">
                      <span className="font-semibold text-ink">{client.contactName ?? "-"}</span>
                      <span className="block text-xs text-slate-500">{client.email ?? client.phone ?? "-"}</span>
                    </td>
                    <td className="table-cell">{formatDateTime(client.createdAt)}</td>
                    <td className="table-cell">
                      <span className={client.active ? "text-sm font-black text-leaf" : "text-sm font-black text-slate-500"}>
                        {client.active ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td className="table-cell">
                      <Link href={`/admin/clientes/${client.id}`} className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-3 py-2 text-xs font-black text-white transition hover:bg-red-700">
                        Abrir DNA <ArrowRight size={14} />
                      </Link>
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
