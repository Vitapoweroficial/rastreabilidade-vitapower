export const privateLabelStages = [
  { id: "briefing", label: "Briefing", description: "Necessidade comercial e requisitos do produto." },
  { id: "formula", label: "Fórmula", description: "Desenvolvimento técnico e validação da composição." },
  { id: "embalagem", label: "Embalagem", description: "Pote, pouch, rótulo, scoop, caixa e acabamentos." },
  { id: "precificacao", label: "Precificação", description: "Custos, margem e preço comercial." },
  { id: "proposta", label: "Proposta", description: "Proposta comercial pronta para apresentação." },
  { id: "aprovado", label: "Aprovado", description: "Projeto aprovado comercialmente pelo cliente." },
  { id: "producao", label: "Produção", description: "Projeto liberado para programação e fabricação." },
  { id: "lote", label: "Lote", description: "Lote produzido, qualidade e rastreabilidade." },
  { id: "entregue", label: "Entregue", description: "Projeto concluído e histórico consolidado." }
] as const;

export type PrivateLabelStageId = (typeof privateLabelStages)[number]["id"];

export function getPrivateLabelStage(stage: string | null | undefined) {
  return privateLabelStages.find((item) => item.id === stage) ?? privateLabelStages[0];
}

export function privateLabelStageProgress(stage: string | null | undefined) {
  const index = Math.max(0, privateLabelStages.findIndex((item) => item.id === stage));
  return Math.round((index / (privateLabelStages.length - 1)) * 100);
}
