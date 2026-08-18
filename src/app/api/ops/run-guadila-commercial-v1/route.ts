import { NextRequest, NextResponse } from "next/server";
import { ensureSchema, getSql } from "@/lib/db";
import { ensurePrivateLabelCommercialSchema } from "@/lib/private-label-commercial";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const KEY = "run-guadila-v1-20260818-55ad";
const VERSION = "V1-2026-08-18";
const items = [
  ["GUAD-BLEND-900-POTE","FULL.Whey Blend 900 g",500,96,48000,43.55,7.60,3,0.96,0.13,55.24,7.68,0,4.20,0,11.88,67.12,28.88,30.09,1.43,67.12,78.96,95.88,110.26,17.75,14442.40,"Excelente",[[0,96,30.09,"Excelente"],[3,93.12,27.93,"Saudável"],[5,91.20,26.41],[8,88.32,24.01],[10,86.40,22.32],[12,84.48,20.55],[15,81.60,17.75,"Estratégico"],[20,76.80,12.61,"Não vender"],[25,72,6.78,"Não vender"]]],
  ["GUAD-BLEND-040-SACHE","FULL.Whey Blend 40 g Monodose",1000,8,8000,2.73,0.50,1,0.08,0.13,4.44,0.64,0,0.35,0,0.99,5.43,2.57,32.13,1.47,5.43,6.39,7.76,8.92,20.15,2570.40,"Excelente",[[0,8,32.13,"Excelente"],[3,7.76,30.03,"Excelente"],[5,7.60,28.56,"Saudável"],[8,7.36,26.23],[10,7.20,24.59],[12,7.04,22.88],[15,6.80,20.15],[20,6.40,15.16,"Estratégico"],[25,6,9.51,"Não vender"]]],
  ["GUAD-JUICE-450-POUCH","Juice Iso 450 g Full",500,60,30000,24.30,6,2,0.60,0.13,33.03,4.80,0,2.62,0,7.42,40.45,19.55,32.58,1.48,40.45,47.59,57.79,66.46,20.68,9774,"Excelente",[[0,60,32.58,"Excelente"],[3,58.20,30.49,"Excelente"],[5,57,29.03,"Saudável"],[8,55.20,26.72],[10,54,25.09],[12,52.80,23.39],[15,51,20.68],[20,48,15.73,"Estratégico"],[25,45,10.11,"Não vender"]]]
] as const;

export async function GET(request: NextRequest) {
  if (request.nextUrl.searchParams.get("key") !== KEY) return NextResponse.json({ ok:false }, { status:404 });
  await ensureSchema();
  await ensurePrivateLabelCommercialSchema();
  const sql = getSql();
  const c = await sql.query(`SELECT id FROM clients WHERE regexp_replace(COALESCE(tax_id,''),'[^0-9]','','g')='66889571000137' LIMIT 1`) as unknown as Array<{id:number}>;
  const clientId = c[0]?.id;
  if (!clientId) throw new Error("Guadila não encontrada");
  const note = "Valores sujeitos à validação final de ficha técnica, disponibilidade de matéria-prima e prazo produtivo. O campo 'Lucro do pedido' é tratado gerencialmente como margem de contribuição total antes de custos e despesas fixas.";
  const v = await sql.query(`INSERT INTO private_label_commercial_versions (client_id,version_code,pricing_date,business_model,responsible,receivable_days,target_margin_percent,tax_percent,commission_percent,logistics_unit_cost,validity_days,total_quantity,revenue_total,variable_cost_total,contribution_total,contribution_margin_percent,status,economic_status,notes) VALUES ($1,$2,'2026-08-18','Terceirização / Private Label','Comercial',30,30,8,0,0.13,7,2000,86000,59213.20,26786.80,31.15,'proposta_comercial','Excelente',$3) ON CONFLICT (client_id,version_code) DO UPDATE SET pricing_date=EXCLUDED.pricing_date,receivable_days=30,target_margin_percent=30,tax_percent=8,commission_percent=0,logistics_unit_cost=0.13,validity_days=7,total_quantity=2000,revenue_total=86000,variable_cost_total=59213.20,contribution_total=26786.80,contribution_margin_percent=31.15,status='proposta_comercial',economic_status='Excelente',notes=$3,updated_at=NOW() RETURNING id`,[clientId,VERSION,note]) as unknown as Array<{id:number}>;
  const versionId = v[0].id;
  const registered = [];
  for (const x of items) {
    const [sku,name,qty,price,revenue,raw,pack,labor,quality,logistics,direct,tax,commission,financial,other,varExp,varCost,mcUnit,mcPct,markup,breakEven,minimum,ideal,premium,maxDisc,mcTotal,status,ladder] = x;
    const r = await sql.query(`SELECT p.id product_id,ep.id project_id,ep.briefing FROM products p JOIN engineering_projects ep ON ep.product_id=p.id AND ep.client_id=p.client_id WHERE p.client_id=$1 AND p.sku=$2 ORDER BY ep.id LIMIT 1`,[clientId,sku]) as unknown as Array<{product_id:number;project_id:number;briefing:string|null}>;
    if (!r[0]) throw new Error(`Projeto ausente: ${sku}`);
    const row=r[0];
    const ladderJson = (ladder as readonly (readonly unknown[])[]).map(([discount,ladderPrice,mc,ladderStatus])=>({discount,price:ladderPrice,mc,status:ladderStatus||null}));
    await sql.query(`INSERT INTO private_label_commercial_items (commercial_version_id,project_id,product_id,item_name,quantity,unit_price,revenue_total,raw_material_unit,packaging_unit,direct_labor_unit,quality_unit,logistics_unit,direct_cost_unit,tax_unit,commission_unit,financial_unit,other_variable_unit,variable_expense_unit,variable_cost_unit,contribution_unit,contribution_margin_percent,markup,break_even_price,minimum_price,ideal_price,premium_price,max_discount_percent,contribution_total,financial_status,discount_ladder) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30::jsonb) ON CONFLICT (commercial_version_id,project_id) DO UPDATE SET item_name=EXCLUDED.item_name,quantity=EXCLUDED.quantity,unit_price=EXCLUDED.unit_price,revenue_total=EXCLUDED.revenue_total,raw_material_unit=EXCLUDED.raw_material_unit,packaging_unit=EXCLUDED.packaging_unit,direct_labor_unit=EXCLUDED.direct_labor_unit,quality_unit=EXCLUDED.quality_unit,logistics_unit=EXCLUDED.logistics_unit,direct_cost_unit=EXCLUDED.direct_cost_unit,tax_unit=EXCLUDED.tax_unit,commission_unit=EXCLUDED.commission_unit,financial_unit=EXCLUDED.financial_unit,other_variable_unit=EXCLUDED.other_variable_unit,variable_expense_unit=EXCLUDED.variable_expense_unit,variable_cost_unit=EXCLUDED.variable_cost_unit,contribution_unit=EXCLUDED.contribution_unit,contribution_margin_percent=EXCLUDED.contribution_margin_percent,markup=EXCLUDED.markup,break_even_price=EXCLUDED.break_even_price,minimum_price=EXCLUDED.minimum_price,ideal_price=EXCLUDED.ideal_price,premium_price=EXCLUDED.premium_price,max_discount_percent=EXCLUDED.max_discount_percent,contribution_total=EXCLUDED.contribution_total,financial_status=EXCLUDED.financial_status,discount_ladder=EXCLUDED.discount_ladder,updated_at=NOW()`,[versionId,row.project_id,row.product_id,name,qty,price,revenue,raw,pack,labor,quality,logistics,direct,tax,commission,financial,other,varExp,varCost,mcUnit,mcPct,markup,breakEven,minimum,ideal,premium,maxDisc,mcTotal,status,JSON.stringify(ladderJson)]);
    const marker="CENÁRIO COMERCIAL V1 — 18/08/2026";
    const base=(row.briefing||"").split(`\n\n${marker}`)[0];
    const summary=`\n\n${marker}\nSituação: Proposta comercial / negociação\nQuantidade: ${qty} un.\nPreço unitário: R$ ${Number(price).toFixed(2)}\nReceita: R$ ${Number(revenue).toFixed(2)}\nCusto variável unitário: R$ ${Number(varCost).toFixed(2)}\nMargem de contribuição: ${Number(mcPct).toFixed(2)}%\nContribuição total informada: R$ ${Number(mcTotal).toFixed(2)}\nPreço mínimo interno: R$ ${Number(minimum).toFixed(2)}\nPreço ideal: R$ ${Number(ideal).toFixed(2)}\nPreço premium: R$ ${Number(premium).toFixed(2)}\nStatus econômico: ${status}\n${note}`;
    await sql.query(`UPDATE engineering_projects SET status='proposta',briefing=$2 WHERE id=$1`,[row.project_id,base+summary]);
    registered.push({sku,productId:row.product_id,projectId:row.project_id});
  }
  const check=await sql.query(`SELECT v.id,v.version_code,v.total_quantity,v.revenue_total::float8,v.variable_cost_total::float8,v.contribution_total::float8,v.contribution_margin_percent::float8,v.status,v.economic_status,COUNT(i.id)::int items FROM private_label_commercial_versions v LEFT JOIN private_label_commercial_items i ON i.commercial_version_id=v.id WHERE v.id=$1 GROUP BY v.id`,[versionId]);
  return NextResponse.json({ok:true,clientId,versionId,registered,verification:check[0]});
}
