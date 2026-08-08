import type { QuestionnaireStep } from "./types";

export const privateLabelSteps: QuestionnaireStep[] = [
  { id: "empresa", title: "Empresa e marca", eyebrow: "1", description: "Conte quem é a empresa e onde a marca já está presente.", questions: [
    { id: "companyName", label: "Razão social / nome da empresa", type: "text", placeholder: "Nome da empresa" },
    { id: "tradeName", label: "Nome fantasia / marca", type: "text", placeholder: "Nome da marca" },
    { id: "document", label: "CNPJ / CPF", type: "text" },
    { id: "contactName", label: "Responsável pelo projeto", type: "text" },
    { id: "role", label: "Cargo / função", type: "text" },
    { id: "email", label: "E-mail", type: "text" },
    { id: "phone", label: "Telefone / WhatsApp", type: "text" },
    { id: "city", label: "Cidade", type: "text" },
    { id: "state", label: "Estado", type: "text" },
    { id: "segment", label: "Segmento de atuação", type: "text", placeholder: "Suplementos, academia, saúde, varejo..." },
    { id: "website", label: "Site", type: "text", placeholder: "https://..." },
    { id: "instagram", label: "Instagram", type: "text", placeholder: "@marca" },
    { id: "otherSocial", label: "Outras redes / canais digitais", type: "textarea" }
  ]},
  { id: "projeto", title: "Projeto e público", eyebrow: "2", description: "Objetivo do lançamento, posicionamento e perfil de quem vai comprar.", questions: [
    { id: "projectName", label: "Nome do projeto", type: "text", placeholder: "Ex.: Linha Performance 2026" },
    { id: "targetLaunch", label: "Quando deseja lançar?", type: "text" },
    { id: "projectObjective", label: "Objetivo principal do projeto", type: "textarea", placeholder: "O que este produto precisa conquistar para a marca?" },
    { id: "benchmark", label: "Referências / benchmarks de mercado", type: "textarea", placeholder: "Marcas, produtos, links ou características que servem de referência." },
    { id: "audienceAge", label: "Faixa etária do público", type: "text" },
    { id: "audienceGender", label: "Gênero predominante", type: "select", options: ["Misto", "Feminino", "Masculino", "Não definido"] },
    { id: "audienceLocation", label: "Localização do público", type: "text", placeholder: "Brasil, região, estado, cidade..." },
    { id: "socioeconomicProfile", label: "Perfil socioeconômico", type: "text" },
    { id: "lifestyle", label: "Estilo de vida / rotina", type: "textarea" },
    { id: "audienceGoals", label: "Principais objetivos do público", type: "textarea" },
    { id: "audiencePains", label: "Dores, dificuldades e necessidades do público", type: "textarea" }
  ]},
  { id: "produto", title: "Produto desejado", eyebrow: "3", description: "Defina o produto que imagina, sua função e o volume inicial.", questions: [
    { id: "productName", label: "Nome provisório do produto", type: "text", placeholder: "Ex.: Whey Premium 900g" },
    { id: "category", label: "Categoria", type: "select", options: ["Proteína", "Creatina", "Pré-treino", "Termogênico", "Vitaminas e minerais", "Colágeno", "Aminoácidos", "Gummies", "Cápsulas", "Outro"] },
    { id: "productPurpose", label: "Função / benefício principal", type: "textarea" },
    { id: "productDifferential", label: "Qual deve ser o grande diferencial?", type: "textarea" },
    { id: "servingGrams", label: "Dose desejada em g (se souber)", type: "number", placeholder: "30" },
    { id: "quantity", label: "Quantidade inicial estimada", type: "number", placeholder: "1000" },
    { id: "claims", label: "Claims / alegações desejadas", type: "textarea", placeholder: "Ex.: alto em proteína, zero açúcar, fonte de..." }
  ]},
  { id: "formulacao", title: "Formulação", eyebrow: "4", description: "Diretrizes técnicas, ingredientes desejados e restrições.", questions: [
    { id: "activeIngredients", label: "Ingredientes ativos obrigatórios ou desejados", type: "textarea" },
    { id: "baseFormula", label: "Já possui fórmula ou composição de referência?", type: "textarea" },
    { id: "restrictions", label: "Ingredientes proibidos / restrições", type: "textarea" },
    { id: "sweetener", label: "Preferência de adoçante", type: "select", options: ["A definir com a Vita Power", "Sucralose", "Stevia", "Xilitol", "Sem adoçante"] },
    { id: "allergenNeeds", label: "Necessidades relacionadas a alergênicos / glúten / lactose", type: "textarea" },
    { id: "formulaNotes", label: "Outras observações de formulação", type: "textarea" }
  ]},
  { id: "apresentacao", title: "Apresentação", eyebrow: "5", description: "Formato, peso líquido, dose e modo de uso esperado.", questions: [
    { id: "format", label: "Formato", type: "select", options: ["Pó", "Cápsulas", "Comprimidos", "Gummy", "Sachê", "Líquido", "A definir"] },
    { id: "netWeight", label: "Peso líquido / volume", type: "text", placeholder: "Ex.: 900g, 300g, 60 cápsulas" },
    { id: "servings", label: "Doses por embalagem", type: "number" },
    { id: "usage", label: "Modo de uso imaginado", type: "textarea" },
    { id: "shelfLife", label: "Validade desejada / referência atual", type: "text" }
  ]},
  { id: "sensorial", title: "Sensorial", eyebrow: "6", description: "Sabor, aroma, cor, textura e experiência de consumo.", questions: [
    { id: "flavor", label: "Sabor(es) desejado(s)", type: "textarea" },
    { id: "aroma", label: "Aroma / perfil aromático", type: "text" },
    { id: "color", label: "Cor / aparência", type: "text" },
    { id: "texture", label: "Textura / solubilidade / sensação esperada", type: "textarea" },
    { id: "sensoryReference", label: "Produto de referência para sabor ou experiência", type: "textarea" }
  ]},
  { id: "embalagem", title: "Embalagem", eyebrow: "7", description: "Escolha o formato físico e descreva a apresentação que imagina.", questions: [
    { id: "primaryPackaging", label: "Embalagem primária", type: "select", options: ["Pote", "Pouch", "Sachê", "Frasco", "Blister", "A definir"] },
    { id: "packagingMaterial", label: "Material / acabamento desejado", type: "text" },
    { id: "packagingColor", label: "Cor da embalagem", type: "text" },
    { id: "lid", label: "Tampa / fechamento", type: "text" },
    { id: "scoop", label: "Scoop / dosador", type: "select", options: ["A definir", "Sim", "Não"] },
    { id: "box", label: "Caixa / display / master", type: "textarea" },
    { id: "packagingReference", label: "Referências de embalagem", type: "textarea", placeholder: "Links, marcas ou descrições." }
  ]},
  { id: "marca", title: "Marca e design", eyebrow: "8", description: "Identidade visual, posicionamento e desenvolvimento do rótulo.", questions: [
    { id: "hasBrand", label: "Já possui marca definida?", type: "select", options: ["Sim", "Não", "Em criação"] },
    { id: "labelDesign", label: "Quem desenvolverá a arte do rótulo?", type: "select", options: ["Vita Power", "Cliente envia", "Agência do cliente", "A definir"] },
    { id: "brandPositioning", label: "Como a marca quer ser percebida?", type: "textarea", placeholder: "Premium, acessível, científica, feminina, esportiva..." },
    { id: "visualReferences", label: "Referências visuais / marcas que admira", type: "textarea" },
    { id: "brandNotes", label: "Cores, símbolos ou elementos que devem ser usados ou evitados", type: "textarea" }
  ]},
  { id: "producao", title: "Produção e qualidade", eyebrow: "9", description: "Prazos, documentação, testes e exigências importantes para o projeto.", questions: [
    { id: "deadline", label: "Prazo esperado para primeira produção", type: "text" },
    { id: "qualityRequirements", label: "Requisitos de qualidade / testes desejados", type: "textarea" },
    { id: "rawMaterialDocuments", label: "Há exigências específicas de documentação de matérias-primas?", type: "textarea", placeholder: "Ficha técnica, COA, FISPQ, origem específica..." },
    { id: "productionNotes", label: "Observações sobre produção / processo", type: "textarea" }
  ]},
  { id: "comercial", title: "Comercial", eyebrow: "10", description: "Ajude a Vita Power a entender o canal, faixa de preço e potencial do projeto.", questions: [
    { id: "salesChannels", label: "Onde pretende vender?", type: "textarea", placeholder: "E-commerce, marketplace, lojas, academias, farmácias, distribuidores..." },
    { id: "targetRetailPrice", label: "Faixa de preço desejada ao consumidor", type: "text" },
    { id: "initialBudget", label: "Existe orçamento previsto para o primeiro lote?", type: "text" },
    { id: "purchaseFrequency", label: "Previsão de recompra / recorrência", type: "text" },
    { id: "commercialNotes", label: "Outras informações comerciais importantes", type: "textarea" }
  ]},
  { id: "servicos", title: "Serviços adicionais", eyebrow: "11", description: "Indique quais frentes deseja que a Vita Power conduza no projeto.", questions: [
    { id: "needsRegulatory", label: "Suporte regulatório e revisão de rotulagem", type: "select", options: ["A definir", "Sim", "Não"] },
    { id: "needsStability", label: "Estudo de estabilidade", type: "select", options: ["A definir", "Sim", "Não"] },
    { id: "needsDesign", label: "Design / fechamento de arquivo", type: "select", options: ["A definir", "Sim", "Não"] },
    { id: "needsPackagingSourcing", label: "Cotação / desenvolvimento de embalagem", type: "select", options: ["A definir", "Sim", "Não"] },
    { id: "servicesNotes", label: "Observações sobre serviços", type: "textarea" }
  ]},
  { id: "revisao", title: "Revisão e envio", eyebrow: "12", description: "Revise as respostas e envie o briefing para a Vita Power.", questions: [] }
];

export const defaultAnswers = {
  companyName: "",
  tradeName: "",
  contactName: "",
  email: "",
  phone: "",
  projectName: "",
  productName: "",
  quantity: "",
  audienceGender: "Misto",
  category: "Proteína",
  sweetener: "A definir com a Vita Power",
  format: "Pó",
  primaryPackaging: "A definir",
  scoop: "A definir",
  hasBrand: "Sim",
  labelDesign: "A definir",
  needsRegulatory: "A definir",
  needsStability: "A definir",
  needsDesign: "A definir",
  needsPackagingSourcing: "A definir"
};
