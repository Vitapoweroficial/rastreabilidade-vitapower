import { NextRequest, NextResponse } from "next/server";
import { ensureSchema, getSql } from "@/lib/db";
import { ensurePrivateLabelBriefingSchema } from "@/lib/private-label-briefings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const OPS_KEY = "guadila-20260818-vp-7f93c2";
const TAX_ID = "66.889.571/0001-37";
const IMPORT_KEY = "manual-guadila-20260818";

const sharedBriefing = `Fonte: PDF "Briefing Whey Guadila - Vita Power" enviado pelo cliente e atualização de escopo por Andrew em 18/08/2026.

CLIENTE
Razão social: Guadila Nutrition LTDA
Nome fantasia: Guadila
CNPJ: 66.889.571/0001-37
Responsável: Adriana Domingues Furtado — Diretora/CEO
Telefone: 12-98102-2689
E-mail: contato@guadila.com.br
Cidade/UF: Taubaté / São Paulo
Site informado: wwww.guadila.com.br
Instagram: guadilanutrition

OBJETIVO
Criar nova marca, desenvolver produto novo e terceirizar produção.
Público: geral, performance esportiva, saúde e bem-estar, feminino e masculino; pessoas que buscam qualidade de vida, praticantes de atividade física e consumidores que desejam suplementação de alta qualidade para uso diário.

DIRETRIZES DO BRIEFING ORIGINAL
Desenvolvimento de fórmula pela Vita Power.
Referências: DUX Whey Protein, Essential Nutrition Whey Protein e Growth Supplements Whey Protein Concentrado.
Obrigatório no briefing original: WPC de alta qualidade, alto teor proteico por porção e boa solubilidade.
Evitar: corantes artificiais e excesso de açúcares adicionados.
Perfil sensorial: cremoso, agradável, doçura equilibrada, intensidade média e sem gosto residual forte de adoçante.
Sabores citados: chocolate, baunilha, morango e paçoca.
Posicionamento: Premium.
Prioridades: melhor sabor, alta concentração e maior margem.
Canais: site próprio e venda direta.
Mercado: Brasil.
Lançamento desejado no briefing: 30/10/2026.
Quantidade inicial informada no briefing: 300 un; demanda mensal estimada: 100 un; recompra trimestral.
Serviços desejados: desenvolvimento da fórmula, análise de viabilidade regulatória, compra de matérias-primas, produção, envase, compra da embalagem e impressão de rótulos.

ATUALIZAÇÃO DE ESCOPO POR ANDREW
O escopo comercial/técnico deve considerar 3 apresentações/produtos: Blend Protein 900 g em pote, Blend Protein 40 g em sachê e Juice Protein 450 g em pouch.
O briefing original citava Whey Protein; esta atualização de escopo deve prevalecer para o cadastro dos produtos. Nenhuma fórmula foi definida nesta importação.`;

const products = [
  { sku: "GUAD-BLEND-900-POTE", name: "Guadila Blend Protein 900 g — Pote", category: "Blend Protein", description: "Blend Protein em pó, apresentação de 900 g em pote. Escopo atualizado por Andrew. Fórmula a desenvolver pela Vita Power; preservar requisitos sensoriais e comerciais do briefing, sem assumir composição ainda não aprovada.", projectName: "Guadila — Blend Protein 900 g Pote", projectExtra: "Apresentação: pote 900 g. O briefing original descreve pote preto rígido, tampa de rosca dourada premium, lacre de segurança, scoop e rótulo adesivo. Validar disponibilidade e custo antes da proposta." },
  { sku: "GUAD-BLEND-040-SACHE", name: "Guadila Blend Protein 40 g — Sachê", category: "Blend Protein", description: "Blend Protein em pó, sachê individual de 40 g. Deve compartilhar a mesma base de formulação do Blend 900 g quando tecnicamente viável, conforme intenção do cliente no briefing. Fórmula ainda não aprovada.", projectName: "Guadila — Blend Protein 40 g Sachê", projectExtra: "Apresentação: sachê individual 40 g. Cliente deseja venda avulsa e/ou em caixa/display. Quantidade por display, MOQ, viabilidade e custo unitário ainda precisam ser definidos." },
  { sku: "GUAD-JUICE-450-POUCH", name: "Guadila Juice Protein 450 g — Pouch", category: "Juice Protein", description: "Juice Protein em pó, apresentação de 450 g em pouch. Produto incluído no escopo por Andrew em 18/08/2026. Formulação, sabores, composição nutricional, dose e requisitos específicos ainda precisam ser definidos com o cliente; não foram inferidos do briefing de Whey/Blend.", projectName: "Guadila — Juice Protein 450 g Pouch", projectExtra: "Apresentação: pouch 450 g. Produto adicionado ao projeto após o briefing original. Requisitos técnicos e sensoriais específicos permanecem em definição." }
];

export async function GET(request: NextRequest) {
  if (request.nextUrl.searchParams.get("key") !== OPS_KEY) return NextResponse.json({ ok: false }, { status: 404 });
  await ensureSchema();
  await ensurePrivateLabelBriefingSchema();
  const sql = getSql();

  const clientRows = (await sql.query(`SELECT id FROM clients WHERE regexp_replace(COALESCE(tax_id, ''), '[^0-9]', '', 'g') = regexp_replace($1, '[^0-9]', '', 'g') ORDER BY id ASC LIMIT 1`, [TAX_ID])) as unknown as Array<{ id: number }>;
  let clientId = clientRows[0]?.id ?? null;
  if (clientId) {
    await sql.query(`UPDATE clients SET brand_name=$2, legal_name=$3, tax_id=$4, contact_name=$5, email=$6, phone=$7, active=TRUE WHERE id=$1`, [clientId, "Guadila", "Guadila Nutrition LTDA", TAX_ID, "Adriana Domingues Furtado", "contato@guadila.com.br", "12-98102-2689"]);
  } else {
    const inserted = (await sql.query(`INSERT INTO clients (brand_name, legal_name, tax_id, contact_name, email, phone, active) VALUES ($1,$2,$3,$4,$5,$6,TRUE) RETURNING id`, ["Guadila", "Guadila Nutrition LTDA", TAX_ID, "Adriana Domingues Furtado", "contato@guadila.com.br", "12-98102-2689"])) as unknown as Array<{ id: number }>;
    clientId = inserted[0].id;
  }

  const createdProducts: Array<{ id: number; sku: string; name: string; projectId: number }> = [];
  for (const product of products) {
    const existingProduct = (await sql.query(`SELECT id FROM products WHERE client_id=$1 AND sku=$2 LIMIT 1`, [clientId, product.sku])) as unknown as Array<{ id: number }>;
    let productId = existingProduct[0]?.id ?? null;
    if (productId) {
      await sql.query(`UPDATE products SET name=$3, category=$4, description=$5, formula_version='Briefing', active=TRUE WHERE id=$1 AND client_id=$2`, [productId, clientId, product.name, product.category, product.description]);
    } else {
      const insertedProduct = (await sql.query(`INSERT INTO products (client_id, sku, name, category, description, formula_version, active) VALUES ($1,$2,$3,$4,$5,'Briefing',TRUE) RETURNING id`, [clientId, product.sku, product.name, product.category, product.description])) as unknown as Array<{ id: number }>;
      productId = insertedProduct[0].id;
    }

    const existingProject = (await sql.query(`SELECT id FROM engineering_projects WHERE client_id=$1 AND product_id=$2 AND name=$3 ORDER BY id ASC LIMIT 1`, [clientId, productId, product.projectName])) as unknown as Array<{ id: number }>;
    let projectId = existingProject[0]?.id ?? null;
    const projectBriefing = `${sharedBriefing}\n\nDETALHE DESTA APRESENTAÇÃO\n${product.projectExtra}`;
    if (projectId) {
      await sql.query(`UPDATE engineering_projects SET status='briefing', briefing=$4 WHERE id=$1 AND client_id=$2 AND product_id=$3`, [projectId, clientId, productId, projectBriefing]);
    } else {
      const insertedProject = (await sql.query(`INSERT INTO engineering_projects (client_id, product_id, name, status, briefing) VALUES ($1,$2,$3,'briefing',$4) RETURNING id`, [clientId, productId, product.projectName, projectBriefing])) as unknown as Array<{ id: number }>;
      projectId = insertedProject[0].id;
    }
    createdProducts.push({ id: productId, sku: product.sku, name: product.name, projectId });
  }

  const main = createdProducts[0];
  const answers = { companyName: "Guadila Nutrition LTDA", tradeName: "Guadila", document: TAX_ID, contactName: "Adriana Domingues Furtado", role: "Diretora/CEO", phone: "12-98102-2689", email: "contato@guadila.com.br", city: "Taubaté", state: "São Paulo", website: "wwww.guadila.com.br", instagram: "guadilanutrition", projectObjective: "Criar uma nova marca; desenvolver produto novo; terceirizar produção", category: "Blend Protein / Juice Protein", projectName: "Guadila — Projeto Proteínas", productName: "Blend Protein 900 g Pote + Blend Protein 40 g Sachê + Juice Protein 450 g Pouch", targetLaunch: "30/10/2026", positioning: "Premium", quantity: "300 unidades informadas no briefing original para a apresentação principal", sourceNote: "Importação manual do PDF. Escopo de produtos atualizado por Andrew em 18/08/2026." };

  const existingBriefing = (await sql.query(`SELECT id FROM private_label_briefings WHERE submission_key=$1 LIMIT 1`, [IMPORT_KEY])) as unknown as Array<{ id: number }>;
  let briefingId = existingBriefing[0]?.id ?? null;
  if (briefingId) {
    await sql.query(`UPDATE private_label_briefings SET client_id=$2, project_id=$3, product_id=$4, source='manual_pdf_import', status='submitted', answers=$5::jsonb, updated_at=NOW() WHERE id=$1`, [briefingId, clientId, main.projectId, main.id, JSON.stringify(answers)]);
  } else {
    const insertedBriefing = (await sql.query(`INSERT INTO private_label_briefings (submission_key, client_id, project_id, product_id, source, status, answers) VALUES ($1,$2,$3,$4,'manual_pdf_import','submitted',$5::jsonb) RETURNING id`, [IMPORT_KEY, clientId, main.projectId, main.id, JSON.stringify(answers)])) as unknown as Array<{ id: number }>;
    briefingId = insertedBriefing[0].id;
  }

  const verification = (await sql.query(`SELECT c.id AS client_id, c.brand_name, c.legal_name, c.tax_id, COUNT(DISTINCT p.id)::int AS product_count, COUNT(DISTINCT ep.id)::int AS project_count, COUNT(DISTINCT b.id)::int AS briefing_count FROM clients c LEFT JOIN products p ON p.client_id=c.id AND p.sku = ANY($2::text[]) LEFT JOIN engineering_projects ep ON ep.client_id=c.id AND ep.product_id=p.id LEFT JOIN private_label_briefings b ON b.client_id=c.id AND b.submission_key=$3 WHERE c.id=$1 GROUP BY c.id, c.brand_name, c.legal_name, c.tax_id`, [clientId, products.map((item) => item.sku), IMPORT_KEY])) as unknown as Array<Record<string, unknown>>;
  return NextResponse.json({ ok: true, clientId, briefingId, products: createdProducts, verification: verification[0] ?? null });
}
