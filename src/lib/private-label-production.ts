import { getSql } from "@/lib/db";
import { privateLabelStages } from "@/lib/private-label-config";
import { ensurePrivateLabelEnterpriseSchema } from "@/lib/private-label-enterprise";

export const productionOrderStatuses = ["planejamento", "programada", "em_producao", "concluida", "cancelada"] as const;
export type ProductionOrderStatus = (typeof productionOrderStatuses)[number];

let schemaPromise: Promise<void> | null = null;

export async function ensurePrivateLabelProductionSchema() {
  if (!schemaPromise) {
    schemaPromise = (async () => {
      await ensurePrivateLabelEnterpriseSchema();
      const sql = getSql();
      await sql.query(`
        CREATE TABLE IF NOT EXISTS production_orders (
          id BIGSERIAL PRIMARY KEY,
          proposal_id INTEGER NOT NULL UNIQUE REFERENCES commercial_proposals(id) ON DELETE RESTRICT,
          project_id INTEGER NOT NULL REFERENCES engineering_projects(id) ON DELETE RESTRICT,
          client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
          product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
          quantity INTEGER NOT NULL DEFAULT 1,
          status TEXT NOT NULL DEFAULT 'planejamento',
          scheduled_date DATE,
          notes TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          CONSTRAINT production_orders_status_check CHECK (status IN ('planejamento','programada','em_producao','concluida','cancelada'))
        )
      `);
      await Promise.all([
        sql.query("CREATE INDEX IF NOT EXISTS idx_production_orders_project ON production_orders(project_id, created_at DESC)"),
        sql.query("CREATE INDEX IF NOT EXISTS idx_production_orders_status ON production_orders(status)"),
        sql.query("CREATE INDEX IF NOT EXISTS idx_production_orders_product ON production_orders(product_id)")
      ]);
    })().catch((error) => {
      schemaPromise = null;
      throw error;
    });
  }
  await schemaPromise;
}

async function advanceProject(projectId: number, stageId: "aprovado" | "producao") {
  const sql = getSql();
  const rows = await sql.query(`SELECT status FROM engineering_projects WHERE id = $1`, [projectId]) as unknown as Array<{ status: string }>;
  const current = rows[0]?.status ?? "briefing";
  const currentIndex = privateLabelStages.findIndex((item) => item.id === current);
  const nextIndex = privateLabelStages.findIndex((item) => item.id === stageId);
  if (nextIndex > Math.max(0, currentIndex)) await sql.query(`UPDATE engineering_projects SET status = $1 WHERE id = $2`, [stageId, projectId]);
}

export async function approveCommercialProposalAndCreateOrder(proposalId: number) {
  await ensurePrivateLabelProductionSchema();
  const sql = getSql();
  const rows = await sql.query(
    `SELECT cp.id, cp.client_id, cp.quantity, cp.notes, pr.project_id, ef.product_id
     FROM commercial_proposals cp
     INNER JOIN pricing_requests pr ON pr.id = cp.pricing_request_id
     INNER JOIN engineering_formulas ef ON ef.id = pr.formula_id
     WHERE cp.id = $1`,
    [proposalId]
  ) as unknown as Array<{ id: number; client_id: number; quantity: number; notes: string | null; project_id: number | null; product_id: number | null }>;
  const proposal = rows[0];
  if (!proposal?.project_id) throw new Error("A proposta precisa estar vinculada a um projeto Private Label.");

  await sql.query(`UPDATE commercial_proposals SET status = 'aprovada', send_status = 'aprovada' WHERE id = $1`, [proposalId]);
  const inserted = await sql.query(
    `INSERT INTO production_orders (proposal_id, project_id, client_id, product_id, quantity, status, notes)
     VALUES ($1, $2, $3, $4, $5, 'planejamento', $6)
     ON CONFLICT (proposal_id) DO UPDATE SET updated_at = NOW()
     RETURNING id, project_id, quantity, status`,
    [proposalId, proposal.project_id, proposal.client_id, proposal.product_id, Math.max(1, Number(proposal.quantity || 1)), proposal.notes]
  ) as unknown as Array<{ id: number; project_id: number; quantity: number; status: ProductionOrderStatus }>;
  await advanceProject(proposal.project_id, "aprovado");
  return inserted[0];
}

export async function updateProductionOrderStatus(input: { orderId: number; status: ProductionOrderStatus; scheduledDate?: string | null; notes?: string | null }) {
  await ensurePrivateLabelProductionSchema();
  if (!productionOrderStatuses.includes(input.status)) throw new Error("Status de produção inválido.");
  const rows = await getSql().query(
    `UPDATE production_orders SET status = $2, scheduled_date = $3::date, notes = COALESCE(NULLIF($4, ''), notes), updated_at = NOW()
     WHERE id = $1 RETURNING id, project_id, status`,
    [input.orderId, input.status, input.scheduledDate || null, input.notes?.trim() || null]
  ) as unknown as Array<{ id: number; project_id: number; status: ProductionOrderStatus }>;
  const order = rows[0];
  if (!order) throw new Error("Ordem de produção não encontrada.");
  if (order.status === "programada" || order.status === "em_producao" || order.status === "concluida") await advanceProject(order.project_id, "producao");
  return order;
}

export async function listProductionOrdersForProject(projectId: number) {
  await ensurePrivateLabelProductionSchema();
  return getSql().query(
    `SELECT po.id, po.proposal_id, po.quantity, po.status, po.scheduled_date::text AS scheduled_date,
            po.notes, po.created_at, po.updated_at, p.name AS product_name
     FROM production_orders po LEFT JOIN products p ON p.id = po.product_id
     WHERE po.project_id = $1 ORDER BY po.created_at DESC, po.id DESC`,
    [projectId]
  );
}

export async function getCommercialProposalDocument(proposalId: number) {
  await ensurePrivateLabelProductionSchema();
  const rows = await getSql().query(
    `SELECT cp.id, cp.title, cp.quantity, cp.unit_price::float8 AS unit_price, cp.total_price::float8 AS total_price,
            cp.validity_days, cp.status, cp.notes, cp.created_at,
            c.id AS client_id, c.brand_name, c.legal_name, c.tax_id, c.contact_name, c.email, c.phone,
            pr.id AS pricing_id, pr.project_id, pr.batch_units, pr.suggested_unit_price::float8 AS suggested_unit_price,
            ef.name AS formula_name, ef.code AS formula_code, ef.version AS formula_version,
            p.name AS product_name, p.sku AS product_sku,
            ep.name AS project_name
     FROM commercial_proposals cp
     INNER JOIN clients c ON c.id = cp.client_id
     INNER JOIN pricing_requests pr ON pr.id = cp.pricing_request_id
     INNER JOIN engineering_formulas ef ON ef.id = pr.formula_id
     LEFT JOIN products p ON p.id = ef.product_id
     LEFT JOIN engineering_projects ep ON ep.id = pr.project_id
     WHERE cp.id = $1`,
    [proposalId]
  );
  return (rows as unknown as Array<Record<string, unknown>>)[0] ?? null;
}
