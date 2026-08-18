import { NextRequest, NextResponse } from "next/server";
import { ensureSchema, getSql } from "@/lib/db";
import { ensurePrivateLabelCommercialSchema } from "@/lib/private-label-commercial";
import { createWorkspaceAlert } from "@/lib/workspace-alerts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const OPS_KEY = "guadila-commercial-v1-20260818-9c42";
const TAX_ID = "66.889.571/0001-37";
const VERSION = "V1-2026-08-18";

const items = [
  {
    sku: "GUAD-BLEND-900-POTE",
    name: "FULL.Whey Blend 900 g",
    quantity: 500,
    unitPrice: 96.00,
    revenue: 48000.00,
    raw: 43.55,
    packaging: 7.60,
    labor: 3.00,
    quality: 0.96,
    logistics: 0.13,
    directCost: 55.24,
    tax: 7.68,
    commission: 0,
    financial: 4.20,
    other: 0,
    variableExpense: 11.88,
    variableCost: 67.12,
    contributionUnit: 28.88,
    contributionMargin: 30.09,
    markup: 1.43,
    breakEven: 67.12,
    minimum: 78.96,
    ideal: 95.88,
    premium: 110.26,
    maxDiscount: 17.75,
    contributionTotal: 14442.40,
    status: "Excelente",
    ladder: [
      { discount: 0, price: 96.00, mc: 30.09, status: "Excelente" },
      { discount: 3, price: 93.12, mc: 27.93, status: "Saudável" },
      { discount: 5, price: 91.20, mc: 26.41 },
      { discount: 8, price: 88.32, mc: 24.01 },
      { discount: 10, price: 86.40, mc: 22.32 },
      { discount: 12, price: 84.48, mc: 20.55 },
      { discount: 15, price: 81.60, mc: 17.75, status: "Estratégico" },
      { discount: 20, price: 76.80, mc: 12.61, status: "Não vender" },
      { discount: 25, price: 72.00, mc: 6.78, status: "Não vender" }
    ]
  },
  {
    sku: "GUAD-BLEND-040-SACHE",
    name: "FULL.Whey Blend 40 g Monodose",
    quantity: 1000,
    unitPrice: 8.00,
    revenue: 8000.00,
    raw: 2.73,
    packaging: 0.50,
    labor: 1.00,
    quality: 0.08,
    logistics: 0.13,
    directCost: 4.44,
    tax: 0.64,
    commission: 0,
    financial: 0.35,
    other: 0,
    variableExpense: 0.99,
    variableCost: 5.43,
    contributionUnit: 2.57,
    contributionMargin: 32.13,
    markup: 1.47,
    breakEven: 5.43,
    minimum: 6.39,
    ideal: 7.76,
    premium: 8.92,
    maxDiscount: 20.15,
    contributionTotal: 2570.40,
    status: "Excelente",
    ladder: [
      { discount: 0, price: 8.00, mc: 32.13, status: "Excelente" },
      { discount: 3, price: 7.76, mc: 30.03, status: "Excelente" },
      { discount: 5, price: 7.60, mc: 28.56, status: "Saudável" },
      { discount: 8, price: 7.36, mc: 26.23 },
      { discount: 10, price: 7.20, mc: 24.59 },
      { discount: 12, price: 7.04, mc: 22.88 },
      { discount: 15, price: 6.80, mc: 20.15 },
      { discount: 20, price: 6.40, mc: 15.16, status: "Estratégico" },
      { discount: 25, price: 6.00, mc: 9.51, status: "Não vender" }
    ]
  },
  {
    sku: "GUAD-JUICE-450-POUCH",
    name: "Juice Iso 450 g Full",
    quantity: 500,
    unitPrice: 60.00,
    revenue: 30000.00,
    raw: 24.30,
    packaging: 6.00,
    labor: 2.00,
    quality: 0.60,
    logistics: 0.13,
    directCost: 33.03,
    tax: 4.80,
    commission: 0,
    financial: 2.62,
    other: 0,
    variableExpense: 7.42,
    variableCost: 40.45,
    contributionUnit: 19.55,
    contributionMargin: 32.58,
    markup: 1.48,
    breakEven: 40.45,
    minimum: 47.59,
    ideal: 57.79,
    premium: 66.46,
    maxDiscount: 20.68,
    contributionTotal: 9774.00,
    status: "Excelente",
    ladder: [
      { discount: 0, price: 60.00, mc: 32.58, status: "Excelente" },
      { discount: 3, price: 58.20, mc: 30.49, status: "Excelente" },
      { discount: 5, price: 57.00, mc: 29.03, status: "Saudável" },
      { discount: 8, price: 55.20, mc: 26.72 },
      { discount: 10, price: 54.00, mc: 25.09 },
      { discount: 12, price: 52.80, mc: 23.39 },
      { discount: 15, price: 51.00, mc: 20.68 },
      { discount: 20, price: 48.00, mc: 15.73, status: "Estratégico" },
      { discount: 25, price: 45.00, mc: 10.11, status: "Não vender" }
    ]
  }
];

function commercialSummary(item: typeof items[number]) {
  return `\n\nCENÁRIO COMERCIAL V1 — 18/08/2026\nSituação: Proposta comercial / negociação\nPrazo de recebimento: 30 dias\nValidade da proposta: 7 dias\nMargem-alvo: 30%\nImposto considerado: 8%\nComissão: 0%\nQuantidade: ${item.quantity.toLocaleString("pt-BR")} un.\nPreço unitário: R$ ${item.unitPrice.toFixed(2).replace(".", ",")}\nReceita: R$ ${item.revenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}\nCusto variável unitário: R$ ${item.variableCost.toFixed(2).replace(".", ",")}\nMargem de contribuição unitária: R$ ${item.contributionUnit.toFixed(2).replace(".", ",")}\nMC: ${item.contributionMargin.toFixed(2).replace(".", ",")}%\nContribuição total informada na precificação: R$ ${item.contributionTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}\nPreço mínimo interno: R$ ${item.minimum.toFixed(2).replace(".", ",")}\nPreço ideal: R$ ${item.ideal.toFixed(2).replace(".", ",")}\nPreço premium: R$ ${item.premium.toFixed(2).replace(".", ",")}\nStatus econômico: ${item.status}\nObservação: "Lucro do pedido" deve ser interpretado como margem de contribuição total, não lucro líquido contábil. Valores sujeitos à validação final de ficha técnica, disponibilidade de matéria-prima e prazo produtivo.`;
}

export async function GET(request: NextRequest) {
  if (process.env.VERCEL_ENV !== "preview" || request.nextUrl.searchParams.get("key") !== OPS_KEY) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  await ensureSchema();
  await ensurePrivateLabelCommercialSchema();
  const sql = getSql();

  const clients = await sql.query(`SELECT id FROM clients WHERE regexp_replace(COALESCE(tax_id, ''), '[^0-9]', '', 'g') = regexp_replace($1, '[^0-9]', '', 'g') LIMIT 1`, [TAX_ID]) as unknown as Array<{ id: number }>;
  const clientId = clients[0]?.id;
  if (!clientId) throw new Error("Cliente Guadila não encontrado.");

  const existing = await sql.query(`SELECT id FROM private_label_commercial_versions WHERE client_id=$1 AND version_code=$2 LIMIT 1`, [clientId, VERSION]) as unknown as Array<{ id: number }>;
  let versionId = existing[0]?.id;
  const notes = "Valores sujeitos à validação final de ficha técnica, disponibilidade de matéria-prima e prazo produtivo. 'Lucro do pedido' = margem de contribuição total antes da absorção dos custos e despesas fixas da Vita Power.";
  if (versionId) {
    await sql.query(`UPDATE private_label_commercial_versions SET pricing_date='2026-08-18', business_model='Terceirização / Private Label', responsible='Comercial', receivable_days=30, target_margin_percent=30, tax_percent=8, commission_percent=0, logistics_unit_cost=0.13, validity_days=7, total_quantity=2000, revenue_total=86000, variable_cost_total=59213.20, contribution_total=26786.80, contribution_margin_percent=31.15, status='proposta_comercial', economic_status='Excelente', notes=$3, updated_at=NOW() WHERE id=$1 AND client_id=$2`, [versionId, clientId, notes]);
  } else {
    const inserted = await sql.query(`INSERT INTO private_label_commercial_versions (client_id, version_code, pricing_date, business_model, responsible, receivable_days, target_margin_percent, tax_percent, commission_percent, logistics_unit_cost, validity_days, total_quantity, revenue_total, variable_cost_total, contribution_total, contribution_margin_percent, status, economic_status, notes) VALUES ($1,$2,'2026-08-18','Terceirização / Private Label','Comercial',30,30,8,0,0.13,7,2000,86000,59213.20,26786.80,31.15,'proposta_comercial','Excelente',$3) RETURNING id`, [clientId, VERSION, notes]) as unknown as Array<{ id: number }>;
    versionId = inserted[0].id;
  }

  const registered = [] as Array<{ sku: string; productId: number; projectId: number }>;
  for (const item of items) {
    const rows = await sql.query(`SELECT p.id AS product_id, ep.id AS project_id, ep.briefing FROM products p INNER JOIN engineering_projects ep ON ep.product_id=p.id AND ep.client_id=p.client_id WHERE p.client_id=$1 AND p.sku=$2 ORDER BY ep.id ASC LIMIT 1`, [clientId, item.sku]) as unknown as Array<{ product_id: number; project_id: number; briefing: string | null }>;
    const row = rows[0];
    if (!row) throw new Error(`Projeto não encontrado para ${item.sku}.`);

    await sql.query(`INSERT INTO private_label_commercial_items (commercial_version_id, project_id, product_id, item_name, quantity, unit_price, revenue_total, raw_material_unit, packaging_unit, direct_labor_unit, quality_unit, logistics_unit, direct_cost_unit, tax_unit, commission_unit, financial_unit, other_variable_unit, variable_expense_unit, variable_cost_unit, contribution_unit, contribution_margin_percent, markup, break_even_price, minimum_price, ideal_price, premium_price, max_discount_percent, contribution_total, financial_status, discount_ladder) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30::jsonb) ON CONFLICT (commercial_version_id, project_id) DO UPDATE SET product_id=EXCLUDED.product_id, item_name=EXCLUDED.item_name, quantity=EXCLUDED.quantity, unit_price=EXCLUDED.unit_price, revenue_total=EXCLUDED.revenue_total, raw_material_unit=EXCLUDED.raw_material_unit, packaging_unit=EXCLUDED.packaging_unit, direct_labor_unit=EXCLUDED.direct_labor_unit, quality_unit=EXCLUDED.quality_unit, logistics_unit=EXCLUDED.logistics_unit, direct_cost_unit=EXCLUDED.direct_cost_unit, tax_unit=EXCLUDED.tax_unit, commission_unit=EXCLUDED.commission_unit, financial_unit=EXCLUDED.financial_unit, other_variable_unit=EXCLUDED.other_variable_unit, variable_expense_unit=EXCLUDED.variable_expense_unit, variable_cost_unit=EXCLUDED.variable_cost_unit, contribution_unit=EXCLUDED.contribution_unit, contribution_margin_percent=EXCLUDED.contribution_margin_percent, markup=EXCLUDED.markup, break_even_price=EXCLUDED.break_even_price, minimum_price=EXCLUDED.minimum_price, ideal_price=EXCLUDED.ideal_price, premium_price=EXCLUDED.premium_price, max_discount_percent=EXCLUDED.max_discount_percent, contribution_total=EXCLUDED.contribution_total, financial_status=EXCLUDED.financial_status, discount_ladder=EXCLUDED.discount_ladder, updated_at=NOW()`, [versionId, row.project_id, row.product_id, item.name, item.quantity, item.unitPrice, item.revenue, item.raw, item.packaging, item.labor, item.quality, item.logistics, item.directCost, item.tax, item.commission, item.financial, item.other, item.variableExpense, item.variableCost, item.contributionUnit, item.contributionMargin, item.markup, item.breakEven, item.minimum, item.ideal, item.premium, item.maxDiscount, item.contributionTotal, item.status, JSON.stringify(item.ladder)]);

    const marker = "CENÁRIO COMERCIAL V1 — 18/08/2026";
    const baseBriefing = (row.briefing || "").split(`\n\n${marker}`)[0];
    await sql.query(`UPDATE engineering_projects SET status='proposta', briefing=$2 WHERE id=$1`, [row.project_id, `${baseBriefing}${commercialSummary(item)}`]);
    registered.push({ sku: item.sku, productId: row.product_id, projectId: row.project_id });
  }

  await createWorkspaceAlert({
    sourceKey: `guadila-commercial:${VERSION}`,
    type: "private_label_commercial",
    audience: "Comercial + Diretoria",
    title: "Guadila — cenário comercial V1 cadastrado",
    message: "3 SKUs · R$ 86.000,00 de receita potencial · MC consolidada 31,15% · contribuição estimada R$ 26.786,80.",
    href: `/admin/clientes/${clientId}`,
    entityType: "client",
    entityId: clientId
  });

  const verification = await sql.query(`SELECT v.id, v.version_code, v.total_quantity, v.revenue_total::float8, v.variable_cost_total::float8, v.contribution_total::float8, v.contribution_margin_percent::float8, v.status, v.economic_status, COUNT(i.id)::int AS items FROM private_label_commercial_versions v LEFT JOIN private_label_commercial_items i ON i.commercial_version_id=v.id WHERE v.id=$1 GROUP BY v.id`, [versionId]) as unknown as Array<Record<string, unknown>>;

  return NextResponse.json({ ok: true, clientId, versionId, registered, verification: verification[0] ?? null });
}
