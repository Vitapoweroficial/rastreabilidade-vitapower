import type { QuestionnaireStep } from "./types";

export const privateLabelSteps: QuestionnaireStep[] = [
  { id: "empresa", title: "Empresa", eyebrow: "1", description: "Dados comerciais do cliente private label.", questions: [
    { id: "companyName", label: "Nome da empresa", type: "text", placeholder: "Cliente Private Label" },
    { id: "tradeName", label: "Nome fantasia / marca", type: "text" },
    { id: "document", label: "CNPJ / CPF", type: "text" },
    { id: "contactName", label: "Responsável", type: "text" },
    { id: "email", label: "E-mail", type: "text" },
    { id: "phone", label: "Telefone / WhatsApp", type: "text" }
  ]},
  { id: "projeto", title: "Projeto", eyebrow: "2", description: "Objetivo do desenvolvimento e estágio comercial.", questions: [
    { id: "projectName", label: "Nome do projeto", type: "text", placeholder: "Suplemento Private Label" },
    { id: "projectStatus", label: "Status", type: "select", options: ["Proposta em desenvolvimento", "Enviada", "Aprovada", "Aguardando pagamento", "Pronto para OP"] },
    { id: "targetLaunch", label: "Data desejada de lançamento", type: "text" },
    { id: "benchmark", label: "Benchmark / referência de mercado", type: "textarea" }
  ]},
  { id: "produto", title: "Produto", eyebrow: "3", description: "Categoria, dose e quantidade estimada.", questions: [
    { id: "productName", label: "Nome do produto", type: "text", placeholder: "Creatina 300g" },
    { id: "category", label: "Categoria", type: "select", options: ["Creatina", "Proteína", "Pré-treino", "Termogênico", "Vitaminas", "Gummies", "Outro"] },
    { id: "servingGrams", label: "Dose em g", type: "number", placeholder: "5" },
    { id: "quantity", label: "Quantidade", type: "number", placeholder: "10000" },
    { id: "claims", label: "Claims desejados", type: "textarea" }
  ]},
  { id: "formulacao", title: "Formulação", eyebrow: "4", description: "Diretrizes técnicas da fórmula.", questions: [
    { id: "activeIngredients", label: "Ingredientes ativos desejados", type: "textarea" },
    { id: "restrictions", label: "Ingredientes proibidos / restrições", type: "textarea" },
    { id: "sweetener", label: "Adoçante preferido", type: "select", options: ["Sucralose", "Stevia", "Xilitol", "Sem adoçante", "A definir"] },
    { id: "formulaNotes", label: "Observações de formulação", type: "textarea" }
  ]},
  { id: "apresentacao", title: "Apresentação", eyebrow: "5", description: "Formato do produto e porções.", questions: [
    { id: "format", label: "Formato", type: "select", options: ["Pó", "Cápsulas", "Comprimidos", "Gummy", "Sachê", "Líquido"] },
    { id: "netWeight", label: "Peso líquido / volume", type: "text" },
    { id: "servings", label: "Doses por embalagem", type: "number" }
  ]},
  { id: "sensorial", title: "Sensorial", eyebrow: "6", description: "Sabor, aroma, cor e experiência de consumo.", questions: [
    { id: "flavor", label: "Sabor desejado", type: "text" },
    { id: "aroma", label: "Aroma", type: "text" },
    { id: "color", label: "Cor", type: "text" },
    { id: "texture", label: "Textura / solubilidade esperada", type: "textarea" }
  ]},
  { id: "embalagem", title: "Embalagem", eyebrow: "7", description: "Componentes físicos e materiais de embalagem.", questions: [
    { id: "primaryPackaging", label: "Embalagem primária", type: "select", options: ["Pote", "Pouch", "Sachê", "Frasco", "A definir"] },
    { id: "lid", label: "Tampa / fechamento", type: "text" },
    { id: "scoop", label: "Scoop / dosador", type: "select", options: ["Sim", "Não", "A definir"] },
    { id: "box", label: "Caixa / display / master", type: "textarea" }
  ]},
  { id: "marca", title: "Marca", eyebrow: "8", description: "Identidade visual e rotulagem.", questions: [
    { id: "hasBrand", label: "Cliente já possui marca?", type: "select", options: ["Sim", "Não", "Em criação"] },
    { id: "labelDesign", label: "Arte do rótulo", type: "select", options: ["Cliente envia", "Vita Power desenvolve", "Agência parceira", "A definir"] },
    { id: "visualReferences", label: "Referências visuais", type: "textarea" }
  ]},
  { id: "producao", title: "Produção", eyebrow: "9", description: "Lote, perdas, prazos e fluxo pós-aprovação.", questions: [
    { id: "lossPercent", label: "Perda %", type: "number", placeholder: "3" },
    { id: "deadline", label: "Prazo esperado", type: "text" },
    { id: "qualityRequirements", label: "Requisitos de qualidade", type: "textarea" }
  ]},
  { id: "comercial", title: "Comercial", eyebrow: "10", description: "Parâmetros comerciais para proposta.", questions: [
    { id: "marginPercent", label: "Margem %", type: "number", placeholder: "35" },
    { id: "laborCost", label: "Mão de obra un.", type: "number", placeholder: "1.50" },
    { id: "packagingCost", label: "Embalagem un.", type: "number", placeholder: "2.00" },
    { id: "paymentTerms", label: "Condição de pagamento", type: "textarea" }
  ]},
  { id: "servicos", title: "Serviços", eyebrow: "11", description: "Serviços adicionais e checklist regulatório.", questions: [
    { id: "needsRegulatory", label: "Precisa de suporte regulatório?", type: "select", options: ["Sim", "Não", "A definir"] },
    { id: "needsStability", label: "Estudo de estabilidade", type: "select", options: ["Sim", "Não", "A definir"] },
    { id: "needsDesign", label: "Design / fechamento de arquivo", type: "select", options: ["Sim", "Não", "A definir"] },
    { id: "servicesNotes", label: "Observações de serviços", type: "textarea" }
  ]},
  { id: "revisao", title: "Revisão", eyebrow: "12", description: "Resumo final, impressão e geração de PDF.", questions: [] }
];

export const defaultAnswers = {
  companyName: "Cliente Private Label",
  projectName: "Suplemento Private Label",
  projectStatus: "Proposta em desenvolvimento",
  productName: "Suplemento Private Label",
  servingGrams: "5",
  quantity: "10000",
  lossPercent: "3",
  marginPercent: "35",
  laborCost: "1.50",
  packagingCost: "2.00"
};
