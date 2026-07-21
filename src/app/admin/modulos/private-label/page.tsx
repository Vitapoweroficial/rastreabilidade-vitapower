import Link from "next/link";
import { ClipboardList, FileText, FlaskConical, Handshake, Package, Tags, UsersRound } from "lucide-react";

const cards = [
  { title: "Novo Questionário", description: "Iniciar briefing completo de private label.", href: "/admin/modulos/private-label/questionario", icon: ClipboardList },
  { title: "Questionários", description: "Consultar briefings salvos localmente nesta etapa.", href: "/admin/modulos/private-label/questionario", icon: FileText },
  { title: "Projetos", description: "Preparado para projetos de desenvolvimento.", href: "/admin/engenharia", icon: Handshake },
  { title: "Clientes", description: "Cadastro de clientes private label.", href: "/admin/clientes", icon: UsersRound },
  { title: "Fórmulas", description: "Integração futura com engenharia de fórmulas.", href: "/admin/engenharia", icon: FlaskConical },
  { title: "Precificação", description: "Base para orçamento e custo industrial.", href: "/admin/engenharia", icon: Tags },
  { title: "Propostas", description: "Preparado para proposta comercial e PDF.", href: "/admin/modulos/private-label/questionario", icon: Package }
];

export default function PrivateLabelModulePage() {
  return <div className="space-y-8"><section className="panel overflow-hidden bg-gradient-to-br from-ink to-moss p-6 text-white"><p className="text-sm font-black uppercase text-brass">Módulo</p><h1 className="mt-2 text-3xl font-black">Private Label</h1><p className="mt-3 max-w-3xl text-white/75">Painel central para transformar briefing comercial em projeto técnico, fórmula, precificação e proposta.</p></section><section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{cards.map((card) => { const Icon = card.icon; return <Link key={card.title} href={card.href} className="panel group p-5 transition hover:-translate-y-0.5 hover:border-moss"><Icon className="text-moss" size={26} /><h2 className="mt-4 text-xl font-black text-ink group-hover:text-moss">{card.title}</h2><p className="mt-2 text-sm text-slate-600">{card.description}</p></Link>; })}</section></div>;
}
