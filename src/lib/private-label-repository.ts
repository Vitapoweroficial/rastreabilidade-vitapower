import { ensureSchema, getSql } from "@/lib/db";
import { getPrivateLabelStage } from "@/lib/private-label-config";

type Numeric = number | string;

type ProjectRow = {
  id: number;
  client_id: number;
  client_brand_name: string;
  product_id: number | null;
  product_name: string | null;
  name: string;
  status: string;
  briefing: string | null;
  created_at: string | Date;
  formula_count: number;
  pricing_count: number;
  proposal_count: number;
  lot_count: number;
};

async function query<T>(statement: string, params: unknown[] = []): Promise<T[]> {
  await ensureSchema();
  return (await getSql().query(statement, params)) as unknown as T[];
}

function dateString(value: string | Date) {
  return value instanceof Date ? value.toISOString() : String(value);
}

function mapProject(row: ProjectRow) {
  const stage = getPrivateLabelStage(row.status);
  return {
    id: row.id,
    clientId: row.client_id,
    clientBrandName: row.client_brand_name,
    productId: row.product_id,
    productName: row.product_name,
    name: row.name,
    stageId: stage.id,
    stageLabel: stage.label,
    briefing: row.briefing,
    createdAt: dateString(row.created_at),
    formulaCount: Number(row.formula_count || 0),
    pricingCount: Number(row.pricing_count || 0),
    proposalCount: Number(row.proposal_count || 0),
    lotCount: Number(row.lot_count || 0)
  };
}

export async function listPrivateLabelProjects() {
  const rows = await query<ProjectRow>(`
    SELECT p.id, p.client_id, c.brand_name AS client_brand_name, p.product_id,
      products.name AS product_name, p.name, p.status, p.briefing, p.created_at,
      (SELECT COUNT(*)::int FROM engineering_formulas f WHERE f.client_id = p.client_id AND (p.product_id IS NULL OR f.product_id = p.product_id)) AS formula_count,
      (SELECT COUNT(*)::int FROM pricing_requests pr WHERE pr.project_id = p.id) AS pricing_count,
      (SELECT COUNT(*)::int FROM commercial_proposals cp
        INNER JOIN pricing_requests pr2 ON pr2.id = cp.pricing_request_id
        WHERE pr2.project_id = p.id) AS proposal_count,
      (SELECT COUNT(*)::int FROM lots l
        INNER JOIN products lp ON lp.id = l.product_id
        WHERE lp.client_id = p.client_id AND (p.product_id IS NULL OR lp.id = p.product_id)) AS lot_count
    FROM engineering_projects p
    INNER JOIN clients c ON c.id = p.client_id
    LEFT JOIN products ON products.id = p.product_id
    ORDER BY p.created_at DESC, p.id DESC
  `);
  return rows.map(mapProject);
}

export async function updatePrivateLabelProjectStage(projectId: number, stageId: string) {
  const stage = getPrivateLabelStage(stageId);
  await query(`UPDATE engineering_projects SET status = $1 WHERE id = $2`, [stage.id, projectId]);
}

export async function getPrivateLabelMetrics() {
  const [row] = await query<{
    clients: number;
    projects: number;
    formulas: number;
    pricing: number;
    proposals: number;
    lots: number;
  }>(`
    SELECT
      (SELECT COUNT(*)::int FROM clients WHERE active = TRUE) AS clients,
      (SELECT COUNT(*)::int FROM engineering_projects) AS projects,
      (SELECT COUNT(*)::int FROM engineering_formulas) AS formulas,
      (SELECT COUNT(*)::int FROM pricing_requests) AS pricing,
      (SELECT COUNT(*)::int FROM commercial_proposals) AS proposals,
      (SELECT COUNT(*)::int FROM lots) AS lots
  `);
  return row;
}

export async function getClientDNA(clientId: number) {
  const [client] = await query<{
    id: number;
    brand_name: string;
    legal_name: string;
    tax_id: string | null;
    contact_name: string | null;
    email: string | null;
    phone: string | null;
    active: boolean;
    created_at: string | Date;
  }>(`SELECT * FROM clients WHERE id = $1`, [clientId]);

  if (!client) return null;

  const [products, projects, formulas, proposals, lots] = await Promise.all([
    query<{ id: number; sku: string; name: string; category: string | null; active: boolean }>(
      `SELECT id, sku, name, category, active FROM products WHERE client_id = $1 ORDER BY created_at DESC`,
      [clientId]
    ),
    query<ProjectRow>(`
      SELECT p.id, p.client_id, c.brand_name AS client_brand_name, p.product_id,
        products.name AS product_name, p.name, p.status, p.briefing, p.created_at,
        (SELECT COUNT(*)::int FROM engineering_formulas f WHERE f.client_id = p.client_id AND (p.product_id IS NULL OR f.product_id = p.product_id)) AS formula_count,
        (SELECT COUNT(*)::int FROM pricing_requests pr WHERE pr.project_id = p.id) AS pricing_count,
        (SELECT COUNT(*)::int FROM commercial_proposals cp INNER JOIN pricing_requests pr2 ON pr2.id = cp.pricing_request_id WHERE pr2.project_id = p.id) AS proposal_count,
        (SELECT COUNT(*)::int FROM lots l INNER JOIN products lp ON lp.id = l.product_id WHERE lp.client_id = p.client_id AND (p.product_id IS NULL OR lp.id = p.product_id)) AS lot_count
      FROM engineering_projects p
      INNER JOIN clients c ON c.id = p.client_id
      LEFT JOIN products ON products.id = p.product_id
      WHERE p.client_id = $1 ORDER BY p.created_at DESC`, [clientId]),
    query<{ id: number; name: string; code: string; version: string; status: string; total_cost: Numeric }>(`
      SELECT f.id, f.name, f.code, f.version, f.status,
        COALESCE((SELECT SUM(fi.cost) FROM formula_items fi WHERE fi.formula_id = f.id), 0)::float8 AS total_cost
      FROM engineering_formulas f WHERE f.client_id = $1 ORDER BY f.created_at DESC`, [clientId]),
    query<{ id: number; title: string; customer_mode: string; pdf_status: string; send_status: string }>(`
      SELECT id, title, customer_mode, pdf_status, send_status
      FROM commercial_proposals WHERE client_id = $1 ORDER BY created_at DESC`, [clientId]),
    query<{ id: number; code: string; product_name: string; status: string; expiration_date: string }>(`
      SELECT l.id, l.code, p.name AS product_name, l.status, l.expiration_date::text AS expiration_date
      FROM lots l INNER JOIN products p ON p.id = l.product_id
      WHERE p.client_id = $1 ORDER BY l.created_at DESC`, [clientId])
  ]);

  return {
    client: {
      id: client.id,
      brandName: client.brand_name,
      legalName: client.legal_name,
      taxId: client.tax_id,
      contactName: client.contact_name,
      email: client.email,
      phone: client.phone,
      active: client.active,
      createdAt: dateString(client.created_at)
    },
    products,
    projects: projects.map(mapProject),
    formulas: formulas.map((item) => ({ ...item, total_cost: Number(item.total_cost || 0) })),
    proposals,
    lots
  };
}
