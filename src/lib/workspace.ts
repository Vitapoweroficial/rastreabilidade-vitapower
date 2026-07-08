import {
  BarChart3,
  ClipboardCheck,
  Factory,
  FileBadge2,
  FlaskConical,
  Landmark,
  PackageCheck,
  Settings2,
  ShoppingCart,
  UsersRound,
  Warehouse
} from "lucide-react";

export const workspaceModules = [
  { slug: "dashboard", href: "/admin", label: "Dashboard Executivo", shortLabel: "Dashboard", description: "Indicadores, alertas e visão executiva da operação.", status: "Base ativa", icon: BarChart3 },
  { slug: "crm", href: "/admin/clientes", label: "CRM", shortLabel: "CRM", description: "Clientes, contatos, pipeline e histórico comercial.", status: "MVP ativo", icon: UsersRound },
  { slug: "private-label", href: "/admin/modulos/private-label", label: "Private Label", shortLabel: "Private Label", description: "Projetos, briefing, aprovações, dossiê e entrega.", status: "Arquitetado", icon: ClipboardCheck },
  { slug: "engenharia", href: "/admin/engenharia", label: "Engenharia", shortLabel: "Engenharia", description: "Produtos, fórmulas, BOM, insumos e precificação.", status: "Base ativa", icon: FlaskConical },
  { slug: "pcp", href: "/admin/modulos/pcp", label: "Produção / PCP", shortLabel: "PCP", description: "OPs, etapas produtivas, apontamentos e gargalos.", status: "Planejado", icon: Factory },
  { slug: "qualidade", href: "/admin/modulos/qualidade", label: "Qualidade", shortLabel: "Qualidade", description: "CQ, laudos, liberações, retenções e não conformidades.", status: "Planejado", icon: ClipboardCheck },
  { slug: "regulatorio", href: "/admin/modulos/regulatorio", label: "Regulatório", shortLabel: "Regulatório", description: "Dossiês, rotulagem, estabilidade, ANVISA e aprovações RT.", status: "Planejado", icon: FileBadge2 },
  { slug: "rastreabilidade", href: "/admin/lotes", label: "Rastreabilidade", shortLabel: "Rastreabilidade", description: "Lotes, QR Code, cliente, produto e consulta pública.", status: "Módulo preservado", icon: PackageCheck },
  { slug: "compras", href: "/admin/modulos/compras", label: "Compras", shortLabel: "Compras", description: "Fornecedores, cotações, pedidos e necessidade de insumos.", status: "Planejado", icon: ShoppingCart },
  { slug: "estoque", href: "/admin/modulos/estoque", label: "Estoque", shortLabel: "Estoque", description: "Matérias-primas, embalagens, acabados, validade e status.", status: "Planejado", icon: Warehouse },
  { slug: "financeiro", href: "/admin/modulos/financeiro", label: "Financeiro", shortLabel: "Financeiro", description: "Propostas, recebimentos, pagamentos, custos e margem.", status: "Planejado", icon: Landmark },
  { slug: "configuracoes", href: "/admin/modulos/configuracoes", label: "Configurações", shortLabel: "Configurações", description: "Usuários, permissões, parâmetros, unidades e status internos.", status: "Planejado", icon: Settings2 }
] as const;

export function getWorkspaceModule(slug: string) {
  return workspaceModules.find((module) => module.slug === slug);
}
