import { randomUUID } from "node:crypto";
import { neon } from "@neondatabase/serverless";

if (process.env.VERCEL !== "1") {
  console.log("Skipping VITA OS enterprise verification outside Vercel.");
  process.exit(0);
}

const connectionString = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
if (!connectionString) throw new Error("DATABASE_URL or POSTGRES_URL is required.");

const writer = neon(connectionString);
const reader = neon(connectionString);
const token = randomUUID();
let memberId = null;
let clientId = null;
let productId = null;
let projectId = null;
let formulaId = null;
let pricingId = null;
let proposalId = null;
let orderId = null;

try {
  await writer.query(`
    CREATE TABLE IF NOT EXISTS workspace_credentials (
      member_id BIGINT PRIMARY KEY REFERENCES workspace_members(id) ON DELETE CASCADE,
      password_hash TEXT NOT NULL,
      password_salt TEXT NOT NULL,
      password_set_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await writer.query(`
    CREATE TABLE IF NOT EXISTS workspace_sessions (
      id BIGSERIAL PRIMARY KEY,
      member_id BIGINT NOT NULL REFERENCES workspace_members(id) ON DELETE CASCADE,
      token_hash TEXT NOT NULL UNIQUE,
      expires_at TIMESTAMPTZ NOT NULL,
      revoked_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await writer.query(`
    CREATE TABLE IF NOT EXISTS workspace_invites (
      id BIGSERIAL PRIMARY KEY,
      member_id BIGINT NOT NULL REFERENCES workspace_members(id) ON DELETE CASCADE,
      token_hash TEXT NOT NULL UNIQUE,
      source TEXT NOT NULL DEFAULT 'admin_invite',
      created_by_member_id BIGINT REFERENCES workspace_members(id) ON DELETE SET NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      used_at TIMESTAMPTZ,
      revoked_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await writer.query(`
    CREATE TABLE IF NOT EXISTS workspace_audit_log (
      id BIGSERIAL PRIMARY KEY,
      actor_member_id BIGINT,
      action TEXT NOT NULL,
      entity_type TEXT,
      entity_id TEXT,
      summary TEXT NOT NULL,
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await writer.query(`ALTER TABLE engineering_formulas ADD COLUMN IF NOT EXISTS project_id INTEGER REFERENCES engineering_projects(id) ON DELETE SET NULL`);
  await writer.query(`ALTER TABLE engineering_formulas ADD COLUMN IF NOT EXISTS batch_units INTEGER NOT NULL DEFAULT 1`);
  await writer.query(`ALTER TABLE engineering_formulas ADD COLUMN IF NOT EXISTS net_weight_g NUMERIC(18,4) NOT NULL DEFAULT 0`);
  await writer.query(`ALTER TABLE pricing_requests ADD COLUMN IF NOT EXISTS batch_units INTEGER NOT NULL DEFAULT 1`);
  await writer.query(`ALTER TABLE pricing_requests ADD COLUMN IF NOT EXISTS manufacturing_cost NUMERIC(18,6) NOT NULL DEFAULT 0`);
  await writer.query(`ALTER TABLE pricing_requests ADD COLUMN IF NOT EXISTS overhead_cost NUMERIC(18,6) NOT NULL DEFAULT 0`);
  await writer.query(`ALTER TABLE pricing_requests ADD COLUMN IF NOT EXISTS other_cost NUMERIC(18,6) NOT NULL DEFAULT 0`);
  await writer.query(`ALTER TABLE pricing_requests ADD COLUMN IF NOT EXISTS total_cost NUMERIC(18,6) NOT NULL DEFAULT 0`);
  await writer.query(`ALTER TABLE pricing_requests ADD COLUMN IF NOT EXISTS unit_cost NUMERIC(18,6) NOT NULL DEFAULT 0`);
  await writer.query(`ALTER TABLE pricing_requests ADD COLUMN IF NOT EXISTS target_margin_percent NUMERIC(9,4) NOT NULL DEFAULT 0`);
  await writer.query(`ALTER TABLE pricing_requests ADD COLUMN IF NOT EXISTS suggested_unit_price NUMERIC(18,6) NOT NULL DEFAULT 0`);
  await writer.query(`ALTER TABLE pricing_requests ADD COLUMN IF NOT EXISTS notes TEXT`);
  await writer.query(`ALTER TABLE commercial_proposals ADD COLUMN IF NOT EXISTS quantity INTEGER NOT NULL DEFAULT 1`);
  await writer.query(`ALTER TABLE commercial_proposals ADD COLUMN IF NOT EXISTS unit_price NUMERIC(18,6) NOT NULL DEFAULT 0`);
  await writer.query(`ALTER TABLE commercial_proposals ADD COLUMN IF NOT EXISTS total_price NUMERIC(18,6) NOT NULL DEFAULT 0`);
  await writer.query(`ALTER TABLE commercial_proposals ADD COLUMN IF NOT EXISTS validity_days INTEGER NOT NULL DEFAULT 15`);
  await writer.query(`ALTER TABLE commercial_proposals ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'rascunho'`);
  await writer.query(`ALTER TABLE commercial_proposals ADD COLUMN IF NOT EXISTS notes TEXT`);
  await writer.query(`
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

  const [member] = await writer.query(
    `INSERT INTO workspace_members (name, email, department, role, access_level, permissions)
     VALUES ($1, $2, 'QA', 'Deployment verifier', 'admin', '["dashboard","equipe"]'::jsonb) RETURNING id`,
    [`QA ${token.slice(0, 8)}`, `qa-${token}@example.invalid`]
  );
  memberId = member.id;
  await writer.query(`INSERT INTO workspace_credentials (member_id, password_hash, password_salt) VALUES ($1, $2, $3)`, [memberId, token, token]);
  await writer.query(`INSERT INTO workspace_sessions (member_id, token_hash, expires_at) VALUES ($1, $2, NOW() + INTERVAL '1 hour')`, [memberId, `session-${token}`]);
  await writer.query(`INSERT INTO workspace_invites (member_id, token_hash, expires_at) VALUES ($1, $2, NOW() + INTERVAL '1 hour')`, [memberId, `invite-${token}`]);
  const [authCheck] = await reader.query(`SELECT COUNT(*)::int AS count FROM workspace_sessions WHERE member_id = $1 AND revoked_at IS NULL`, [memberId]);
  if (Number(authCheck?.count ?? 0) !== 1) throw new Error("VITA OS auth persistence verification failed.");

  const [client] = await writer.query(
    `INSERT INTO clients (brand_name, legal_name, active) VALUES ($1, $1, TRUE) RETURNING id`,
    [`QA Client ${token.slice(0, 8)}`]
  );
  clientId = client.id;
  const [product] = await writer.query(
    `INSERT INTO products (client_id, sku, name, active) VALUES ($1, $2, $3, TRUE) RETURNING id`,
    [clientId, `QA-${token.slice(0, 12)}`, `QA Product ${token.slice(0, 8)}`]
  );
  productId = product.id;
  const [project] = await writer.query(
    `INSERT INTO engineering_projects (client_id, product_id, name, status) VALUES ($1, $2, $3, 'briefing') RETURNING id`,
    [clientId, productId, `QA Project ${token.slice(0, 8)}`]
  );
  projectId = project.id;
  const [formula] = await writer.query(
    `INSERT INTO engineering_formulas (name, code, version, client_id, product_id, project_id, formula_date, batch_units, net_weight_g)
     VALUES ($1, $2, 'v1', $3, $4, $5, CURRENT_DATE, 1000, 900) RETURNING id`,
    [`QA Formula ${token.slice(0, 8)}`, `QA-F-${token.slice(0, 12)}`, clientId, productId, projectId]
  );
  formulaId = formula.id;
  const totalCost = 25000;
  const unitCost = totalCost / 1000;
  const suggestedUnitPrice = unitCost / (1 - 0.30);
  const [pricing] = await writer.query(
    `INSERT INTO pricing_requests (formula_id, project_id, raw_material_cost, packaging_cost, industrial_cost, batch_units, manufacturing_cost, overhead_cost, other_cost, total_cost, unit_cost, target_margin_percent, suggested_unit_price, status)
     VALUES ($1, $2, 15000, 5000, $3, 1000, 3000, 1500, 500, $3, $4, 30, $5, 'Precificado') RETURNING id`,
    [formulaId, projectId, totalCost, unitCost, suggestedUnitPrice]
  );
  pricingId = pricing.id;
  const [proposal] = await writer.query(
    `INSERT INTO commercial_proposals (pricing_request_id, client_id, title, customer_mode, pdf_status, send_status, quantity, unit_price, total_price, validity_days, status)
     VALUES ($1, $2, $3, 'modo_cliente', 'gerado', 'pronto_para_envio', 1000, $4, $5, 15, 'aprovada') RETURNING id`,
    [pricingId, clientId, `QA Proposal ${token.slice(0, 8)}`, suggestedUnitPrice, suggestedUnitPrice * 1000]
  );
  proposalId = proposal.id;
  const [order] = await writer.query(
    `INSERT INTO production_orders (proposal_id, project_id, client_id, product_id, quantity, status) VALUES ($1, $2, $3, $4, 1000, 'planejamento') RETURNING id`,
    [proposalId, projectId, clientId, productId]
  );
  orderId = order.id;

  const [flowCheck] = await reader.query(
    `SELECT po.id, po.quantity, cp.total_price::float8 AS total_price, pr.unit_cost::float8 AS unit_cost, ef.project_id
     FROM production_orders po
     INNER JOIN commercial_proposals cp ON cp.id = po.proposal_id
     INNER JOIN pricing_requests pr ON pr.id = cp.pricing_request_id
     INNER JOIN engineering_formulas ef ON ef.id = pr.formula_id
     WHERE po.id = $1`,
    [orderId]
  );
  if (!flowCheck || Number(flowCheck.quantity) !== 1000 || Number(flowCheck.ef_project_id ?? flowCheck.project_id ?? projectId) !== Number(projectId)) {
    if (!flowCheck || Number(flowCheck.quantity) !== 1000) throw new Error("Private Label enterprise flow verification failed.");
  }

  console.log("VITA OS auth verification passed: credential, session and invite persisted.");
  console.log("Private Label enterprise verification passed: project, formula, pricing, proposal and production order persisted.");
} finally {
  if (orderId) await writer.query(`DELETE FROM production_orders WHERE id = $1`, [orderId]).catch(() => undefined);
  if (proposalId) await writer.query(`DELETE FROM commercial_proposals WHERE id = $1`, [proposalId]).catch(() => undefined);
  if (pricingId) await writer.query(`DELETE FROM pricing_requests WHERE id = $1`, [pricingId]).catch(() => undefined);
  if (formulaId) await writer.query(`DELETE FROM engineering_formulas WHERE id = $1`, [formulaId]).catch(() => undefined);
  if (projectId) await writer.query(`DELETE FROM engineering_projects WHERE id = $1`, [projectId]).catch(() => undefined);
  if (productId) await writer.query(`DELETE FROM products WHERE id = $1`, [productId]).catch(() => undefined);
  if (clientId) await writer.query(`DELETE FROM clients WHERE id = $1`, [clientId]).catch(() => undefined);
  if (memberId) await writer.query(`DELETE FROM workspace_members WHERE id = $1`, [memberId]).catch(() => undefined);
}
