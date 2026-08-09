import { ensureSchema, getSql } from "@/lib/db";
import { privateLabelStages, type PrivateLabelStageId } from "@/lib/private-label-config";

let enterpriseSchemaPromise: Promise<void> | null = null;

export async function ensurePrivateLabelEnterpriseSchema() {
  if (!enterpriseSchemaPromise) {
    enterpriseSchemaPromise = (async () => {
      await ensureSchema();
      const sql = getSql();
      await sql.query(`ALTER TABLE engineering_formulas ADD COLUMN IF NOT EXISTS project_id INTEGER REFERENCES engineering_projects(id) ON DELETE SET NULL`);
      await sql.query(`ALTER TABLE engineering_formulas ADD COLUMN IF NOT EXISTS batch_units INTEGER NOT NULL DEFAULT 1`);
      await sql.query(`ALTER TABLE engineering_formulas ADD COLUMN IF NOT EXISTS net_weight_g NUMERIC(18,4) NOT NULL DEFAULT 0`);

      await sql.query(`ALTER TABLE pricing_requests ADD COLUMN IF NOT EXISTS batch_units INTEGER NOT NULL DEFAULT 1`);
      await sql.query(`ALTER TABLE pricing_requests ADD COLUMN IF NOT EXISTS manufacturing_cost NUMERIC(18,6) NOT NULL DEFAULT 0`);
      await sql.query(`ALTER TABLE pricing_requests ADD COLUMN IF NOT EXISTS overhead_cost NUMERIC(18,6) NOT NULL DEFAULT 0`);
      await sql.query(`ALTER TABLE pricing_requests ADD COLUMN IF NOT EXISTS other_cost NUMERIC(18,6) NOT NULL DEFAULT 0`);
      await sql.query(`ALTER TABLE pricing_requests ADD COLUMN IF NOT EXISTS total_cost NUMERIC(18,6) NOT NULL DEFAULT 0`);
      await sql.query(`ALTER TABLE pricing_requests ADD COLUMN IF NOT EXISTS unit_cost NUMERIC(18,6) NOT NULL DEFAULT 0`);
      await sql.query(`ALTER TABLE pricing_requests ADD COLUMN IF NOT EXISTS target_margin_percent NUMERIC(9,4) NOT NULL DEFAULT 0`);
      await sql.query(`ALTER TABLE pricing_requests ADD COLUMN IF NOT EXISTS suggested_unit_price NUMERIC(18,6) NOT NULL DEFAULT 0`);
      await sql.query(`ALTER TABLE pricing_requests ADD COLUMN IF NOT EXISTS notes TEXT`);

      await sql.query(`ALTER TABLE commercial_proposals ADD COLUMN IF NOT EXISTS quantity INTEGER NOT NULL DEFAULT 1`);
      await sql.query(`ALTER TABLE commercial_proposals ADD COLUMN IF NOT EXISTS unit_price NUMERIC(18,6) NOT NULL DEFAULT 0`);
      await sql.query(`ALTER TABLE commercial_proposals ADD COLUMN IF NOT EXISTS total_price NUMERIC(18,6) NOT NULL DEFAULT 0`);
      await sql.query(`ALTER TABLE commercial_proposals ADD COLUMN IF NOT EXISTS validity_days INTEGER NOT NULL DEFAULT 15`);
      await sql.query(`ALTER TABLE commercial_proposals ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'rascunho'`);
      await sql.query(`ALTER TABLE commercial_proposals ADD COLUMN IF NOT EXISTS notes TEXT`);

      await Promise.all([
        sql.query("CREATE INDEX IF NOT EXISTS idx_engineering_formulas_project ON engineering_formulas(project_id)"),
        sql.query("CREATE INDEX IF NOT EXISTS idx_pricing_requests_project_created ON pricing_requests(project_id, created_at DESC)"),
        sql.query("CREATE INDEX IF NOT EXISTS idx_commercial_proposals_pricing ON commercial_proposals(pricing_request_id)")
      ]);

      await sql.query(`
        UPDATE pricing_requests
        SET total_cost = CASE WHEN total_cost = 0 THEN industrial_cost ELSE total_cost END,
            unit_cost = CASE WHEN unit_cost = 0 AND batch_units > 0 THEN industrial_cost / batch_units ELSE unit_cost END
        WHERE industrial_cost > 0 AND total_cost = 0
      `);
    })().catch((error) => {
      enterpriseSchemaPromise = null;
      throw error;
    });
  }
  await enterpriseSchemaPromise;
}

function required(value: string, field: string) {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${field} é obrigatório.`);
  return normalized;
}

function number(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

async function advanceProjectStage(projectId: number, requested: PrivateLabelStageId) {
  await ensurePrivateLabelEnterpriseSchema();
  const rows = await getSql().query(`SELECT status FROM engineering_projects WHERE id = $1`, [projectId]) as unknown as Array<{ status: string }>;
  const current = rows[0]?.status ?? "briefing";
  const currentIndex = privateLabelStages.findIndex((item) => item.id === current);
  const requestedIndex = privateLabelStages.findIndex((item) => item.id === requested);
  if (requestedIndex >= 0 && requestedIndex > Math.max(0, currentIndex)) {
    await getSql().query(`UPDATE engineering_projects SET status = $1 WHERE id = $2`, [requested, projectId]);
  }
}

export async function createProjectFormula(input: {
  projectId: number;
  name: string;
  code: string;
  version: string;
  category?: string | null;
  responsible?: string | null;
  batchUnits: number;
  netWeightG: number;
}) {
  await ensurePrivateLabelEnterpriseSchema();
  const sql = getSql();
  const projects = await sql.query(
    `SELECT id, client_id, product_id FROM engineering_projects WHERE id = $1`,
    [input.projectId]
  ) as unknown as Array<{ id: number; client_id: number; product_id: number | null }>;
  const project = projects[0];
  if (!project) throw new Error("Projeto não encontrado.");
  const batchUnits = Math.max(1, Math.round(number(input.batchUnits, 1)));
  const rows = await sql.query(
    `INSERT INTO engineering_formulas (
       name, code, version, client_id, product_id, project_id, category, responsible,
       formula_date, batch_units, net_weight_g
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_DATE, $9, $10)
     RETURNING id`,
    [
      required(input.name, "Nome da fórmula"),
      required(input.code, "Código da fórmula"),
      required(input.version, "Versão"),
      project.client_id,
      project.product_id,
      project.id,
      input.category?.trim() || null,
      input.responsible?.trim() || null,
      batchUnits,
      Math.max(0, number(input.netWeightG))
    ]
  ) as unknown as Array<{ id: number }>;
  await advanceProjectStage(project.id, "formula");
  return rows[0];
}

export async function linkFormulaToProject(formulaId: number, projectId: number) {
  await ensurePrivateLabelEnterpriseSchema();
  const rows = await getSql().query(
    `UPDATE engineering_formulas f
     SET project_id = p.id,
         client_id = p.client_id,
         product_id = COALESCE(p.product_id, f.product_id)
     FROM engineering_projects p
     WHERE f.id = $1 AND p.id = $2
     RETURNING f.id`,
    [formulaId, projectId]
  ) as unknown as Array<{ id: number }>;
  if (!rows[0]) throw new Error("Fórmula ou projeto não encontrado.");
  await advanceProjectStage(projectId, "formula");
}

export async function createAdvancedPricingFromFormula(input: {
  formulaId: number;
  projectId?: number | null;
  manufacturingCost?: number;
  overheadCost?: number;
  otherCost?: number;
  targetMarginPercent?: number;
  notes?: string | null;
}) {
  await ensurePrivateLabelEnterpriseSchema();
  const sql = getSql();
  const formulaRows = await sql.query(
    `SELECT id, project_id, batch_units FROM engineering_formulas WHERE id = $1`,
    [input.formulaId]
  ) as unknown as Array<{ id: number; project_id: number | null; batch_units: number }>;
  const formula = formulaRows[0];
  if (!formula) throw new Error("Fórmula não encontrada.");
  const projectId = input.projectId || formula.project_id || null;
  const batchUnits = Math.max(1, Math.round(number(formula.batch_units, 1)));
  const margin = number(input.targetMarginPercent);
  if (margin < 0 || margin >= 100) throw new Error("A margem alvo deve ficar entre 0% e 99,99%.");
  const manufacturing = Math.max(0, number(input.manufacturingCost));
  const overhead = Math.max(0, number(input.overheadCost));
  const other = Math.max(0, number(input.otherCost));

  const costRows = await sql.query(
    `SELECT
       COALESCE((SELECT SUM(cost) FROM formula_items WHERE formula_id = $1), 0)::float8 AS raw_cost,
       COALESCE((SELECT SUM(cost) FROM formula_packaging_items WHERE formula_id = $1), 0)::float8 AS packaging_unit_cost`,
    [input.formulaId]
  ) as unknown as Array<{ raw_cost: number; packaging_unit_cost: number }>;
  const rawCost = number(costRows[0]?.raw_cost);
  const packagingUnitCost = number(costRows[0]?.packaging_unit_cost);
  const packagingBatchCost = packagingUnitCost * batchUnits;
  const total = rawCost + packagingBatchCost + manufacturing + overhead + other;
  const unitCost = total / batchUnits;
  const suggestedUnitPrice = margin === 0 ? unitCost : unitCost / (1 - margin / 100);

  const rows = await sql.query(
    `INSERT INTO pricing_requests (
       formula_id, project_id, raw_material_cost, packaging_cost, industrial_cost,
       batch_units, manufacturing_cost, overhead_cost, other_cost, total_cost,
       unit_cost, target_margin_percent, suggested_unit_price, notes, status
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 'Precificado')
     RETURNING id`,
    [input.formulaId, projectId, rawCost, packagingBatchCost, total, batchUnits, manufacturing, overhead, other, total, unitCost, margin, suggestedUnitPrice, input.notes?.trim() || null]
  ) as unknown as Array<{ id: number }>;
  if (projectId) await advanceProjectStage(projectId, "precificacao");
  return rows[0];
}

export async function createAdvancedProposalFromPricing(input: {
  pricingRequestId: number;
  validityDays?: number;
  notes?: string | null;
}) {
  await ensurePrivateLabelEnterpriseSchema();
  const sql = getSql();
  const rows = await sql.query(
    `SELECT pr.id, pr.project_id, pr.batch_units, pr.suggested_unit_price,
            ef.name AS formula_name,
            COALESCE(ef.client_id, ep.client_id) AS client_id
     FROM pricing_requests pr
     INNER JOIN engineering_formulas ef ON ef.id = pr.formula_id
     LEFT JOIN engineering_projects ep ON ep.id = pr.project_id
     WHERE pr.id = $1`,
    [input.pricingRequestId]
  ) as unknown as Array<{ id: number; project_id: number | null; batch_units: number; suggested_unit_price: number; formula_name: string; client_id: number | null }>;
  const pricing = rows[0];
  if (!pricing?.client_id) throw new Error("Precificação sem cliente vinculado.");
  const quantity = Math.max(1, Math.round(number(pricing.batch_units, 1)));
  const unitPrice = Math.max(0, number(pricing.suggested_unit_price));
  const validityDays = Math.max(1, Math.min(180, Math.round(number(input.validityDays, 15))));
  const inserted = await sql.query(
    `INSERT INTO commercial_proposals (
       pricing_request_id, client_id, title, customer_mode, pdf_status, send_status,
       quantity, unit_price, total_price, validity_days, status, notes
     ) VALUES ($1, $2, $3, 'modo_cliente', 'gerado', 'pronto_para_envio', $4, $5, $6, $7, 'rascunho', $8)
     RETURNING id`,
    [input.pricingRequestId, pricing.client_id, `Proposta comercial - ${pricing.formula_name}`, quantity, unitPrice, quantity * unitPrice, validityDays, input.notes?.trim() || null]
  ) as unknown as Array<{ id: number }>;
  if (pricing.project_id) await advanceProjectStage(pricing.project_id, "proposta");
  return inserted[0];
}

export async function getPrivateLabelProjectDetail(projectId: number) {
  await ensurePrivateLabelEnterpriseSchema();
  const sql = getSql();
  const projectRows = await sql.query(
    `SELECT p.id, p.client_id, p.product_id, p.name, p.status, p.briefing, p.created_at,
            c.brand_name, c.legal_name, c.contact_name, c.email, c.phone,
            pr.name AS product_name, pr.sku AS product_sku
     FROM engineering_projects p
     INNER JOIN clients c ON c.id = p.client_id
     LEFT JOIN products pr ON pr.id = p.product_id
     WHERE p.id = $1`,
    [projectId]
  ) as unknown as Array<{
    id: number; client_id: number; product_id: number | null; name: string; status: string; briefing: string | null; created_at: string | Date;
    brand_name: string; legal_name: string; contact_name: string | null; email: string | null; phone: string | null; product_name: string | null; product_sku: string | null;
  }>;
  const project = projectRows[0];
  if (!project) return null;

  const [formulas, pricing, proposals, lots] = await Promise.all([
    sql.query(
      `SELECT f.id, f.name, f.code, f.version, f.status, f.batch_units, f.net_weight_g::float8 AS net_weight_g,
              f.responsible, f.created_at,
              COALESCE((SELECT SUM(fi.percentage) FROM formula_items fi WHERE fi.formula_id = f.id), 0)::float8 AS total_percentage,
              COALESCE((SELECT SUM(fi.cost) FROM formula_items fi WHERE fi.formula_id = f.id), 0)::float8 AS raw_cost,
              COALESCE((SELECT SUM(fp.cost) FROM formula_packaging_items fp WHERE fp.formula_id = f.id), 0)::float8 AS packaging_unit_cost
       FROM engineering_formulas f WHERE f.project_id = $1 ORDER BY f.created_at DESC, f.id DESC`, [projectId]),
    sql.query(
      `SELECT pr.id, pr.formula_id, ef.name AS formula_name, pr.batch_units,
              pr.raw_material_cost::float8, pr.packaging_cost::float8, pr.manufacturing_cost::float8,
              pr.overhead_cost::float8, pr.other_cost::float8, pr.total_cost::float8,
              pr.unit_cost::float8, pr.target_margin_percent::float8, pr.suggested_unit_price::float8,
              pr.status, pr.notes, pr.created_at
       FROM pricing_requests pr INNER JOIN engineering_formulas ef ON ef.id = pr.formula_id
       WHERE pr.project_id = $1 ORDER BY pr.created_at DESC, pr.id DESC`, [projectId]),
    sql.query(
      `SELECT cp.id, cp.pricing_request_id, cp.title, cp.quantity, cp.unit_price::float8, cp.total_price::float8,
              cp.validity_days, cp.status, cp.pdf_status, cp.send_status, cp.notes, cp.created_at
       FROM commercial_proposals cp INNER JOIN pricing_requests pr ON pr.id = cp.pricing_request_id
       WHERE pr.project_id = $1 ORDER BY cp.created_at DESC, cp.id DESC`, [projectId]),
    project.product_id
      ? sql.query(`SELECT id, code, status, manufacturing_date::text, expiration_date::text, quantity::float8, unit FROM lots WHERE product_id = $1 ORDER BY created_at DESC`, [project.product_id])
      : Promise.resolve([])
  ]);

  return { project, formulas, pricing, proposals, lots };
}
