import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Database, GitBranch, ShieldCheck } from "lucide-react";
import { getWorkspaceModule } from "@/lib/workspace";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function ModuleFoundationPage({ params }: PageProps) {
  const { slug } = await params;
  const workspaceModule = getWorkspaceModule(slug);

  if (!workspaceModule || workspaceModule.slug === "dashboard") {
    notFound();
  }

  const Icon = workspaceModule.icon;

  return (
    <div className="space-y-6">
      <Link href="/admin" className="btn-secondary w-fit">
        <ArrowLeft size={16} aria-hidden="true" />
        Voltar ao dashboard
      </Link>

      <section className="panel overflow-hidden">
        <div className="border-b border-line bg-gradient-to-br from-slate-950 to-red-950 p-6 text-white sm:p-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-700">
            <Icon size={26} aria-hidden="true" />
          </div>
          <p className="mt-5 text-sm font-black uppercase tracking-[0.22em] text-red-200">Módulo do Workspace</p>
          <h1 className="mt-2 text-4xl font-black tracking-tight">{workspaceModule.label}</h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-slate-300">{workspaceModule.description}</p>
        </div>

        <div className="grid gap-4 p-5 md:grid-cols-3">
          <ModuleStep icon={<Database size={20} />} title="Dados" description="Estrutura inicial de banco preparada para evolução incremental e relacionamento com clientes, produtos e lotes." />
          <ModuleStep icon={<GitBranch size={20} />} title="Processo" description="Fluxos serão implementados por etapas para evitar regressão no módulo atual de rastreabilidade." />
          <ModuleStep icon={<ShieldCheck size={20} />} title="Governança" description="Decisões técnicas, riscos e próximos passos estão documentados no MASTER_ARCHITECTURE.md." />
        </div>
      </section>
    </div>
  );
}

function ModuleStep({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-red-700">{icon}</div>
      <h2 className="mt-4 text-base font-black text-ink">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
    </div>
  );
}
