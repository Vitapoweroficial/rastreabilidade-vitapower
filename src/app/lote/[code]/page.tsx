import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, CalendarDays, Factory, Package, ShieldCheck } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { formatDate, formatQuantity, statusLabels } from "@/lib/format";
import { getPublicLotByCode } from "@/lib/repository";

type PageProps = {
  params: Promise<{
    code: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function PublicLotPage({ params }: PageProps) {
  const { code } = await params;
  const lot = getPublicLotByCode(code);

  if (!lot) {
    return (
      <main className="min-h-screen bg-[#f6f8f2] px-5 py-10">
        <section className="mx-auto max-w-2xl panel px-6 py-8 text-center">
          <h1 className="text-2xl font-black text-ink">Lote não encontrado</h1>
          <p className="mt-3 text-slate-600">Confira o código informado e tente novamente.</p>
          <Link href="/admin" className="btn-primary mt-6">
            Acessar admin
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f6f8f2]">
      <section className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-5xl flex-col gap-5 px-5 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-moss text-sm font-black text-white">
              VP
            </div>
            <div>
              <p className="text-sm font-black text-ink">Vita Power</p>
              <p className="text-xs font-semibold text-slate-500">Consulta oficial de lote</p>
            </div>
          </div>
          <StatusBadge status={lot.status} />
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-6 px-5 py-8 lg:grid-cols-[1fr_280px]">
        <div className="space-y-6">
          <div className="panel p-6">
            <p className="text-sm font-bold uppercase text-brass">Lote {lot.code}</p>
            <h1 className="mt-3 text-3xl font-black text-ink">{lot.productName}</h1>
            <p className="mt-2 text-base text-slate-600">{lot.clientBrandName}</p>
            {lot.productDescription ? (
              <p className="mt-5 max-w-3xl text-sm leading-6 text-slate-600">{lot.productDescription}</p>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <InfoTile icon={<Factory size={20} />} label="Fabricado em" value={formatDate(lot.manufacturingDate)} />
            <InfoTile icon={<CalendarDays size={20} />} label="Validade" value={formatDate(lot.expirationDate)} />
            <InfoTile icon={<Package size={20} />} label="Quantidade" value={formatQuantity(lot.quantity, lot.unit)} />
            <InfoTile icon={<BadgeCheck size={20} />} label="Versão da fórmula" value={lot.formulaVersion ?? "-"} />
          </div>

          <div className="panel p-6">
            <div className="mb-4 flex items-center gap-2">
              <ShieldCheck size={20} className="text-leaf" aria-hidden="true" />
              <h2 className="text-lg font-black text-ink">Rastreabilidade</h2>
            </div>
            <dl className="grid gap-4 sm:grid-cols-2">
              <TraceItem label="Cliente private label" value={lot.clientBrandName} />
              <TraceItem label="Razão social" value={lot.legalName} />
              <TraceItem label="SKU" value={lot.sku} />
              <TraceItem label="Categoria" value={lot.productCategory ?? "-"} />
              <TraceItem label="Origem" value={lot.origin ?? "-"} />
              <TraceItem label="Status" value={statusLabels[lot.status]} />
            </dl>
            {lot.analysisSummary ? (
              <div className="mt-5 border-t border-line pt-5">
                <p className="text-sm font-black text-ink">Resumo de análise</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{lot.analysisSummary}</p>
              </div>
            ) : null}
            {lot.traceabilityNotes ? (
              <div className="mt-5 border-t border-line pt-5">
                <p className="text-sm font-black text-ink">Observações</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{lot.traceabilityNotes}</p>
              </div>
            ) : null}
          </div>
        </div>

        <aside className="panel h-fit p-5">
          <div className="mx-auto h-56 w-56 rounded-lg border border-line bg-white p-3">
            <Image
              src={`/api/lotes/${encodeURIComponent(lot.code)}/qr`}
              alt={`QR Code do lote ${lot.code}`}
              width={224}
              height={224}
              unoptimized
              priority
            />
          </div>
          <p className="mt-4 text-center text-sm font-black text-ink">{lot.code}</p>
          <p className="mt-1 text-center text-xs font-semibold text-slate-500">QR Code de consulta pública</p>
        </aside>
      </section>
    </main>
  );
}

function InfoTile({
  icon,
  label,
  value
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="panel flex items-center gap-4 p-5">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-mist text-moss">{icon}</div>
      <div>
        <p className="text-xs font-bold uppercase text-slate-500">{label}</p>
        <p className="mt-1 text-lg font-black text-ink">{value}</p>
      </div>
    </div>
  );
}

function TraceItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-bold uppercase text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm font-bold text-ink">{value}</dd>
    </div>
  );
}
