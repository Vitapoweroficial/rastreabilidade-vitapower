import { ensureSchema, getSql } from "@/lib/db";

let commercialSchemaPromise: Promise<void> | null = null;

export async function ensurePrivateLabelCommercialSchema() {
  if (!commercialSchemaPromise) {
    commercialSchemaPromise = (async () => {
      await ensureSchema();
      const sql = getSql();
      await sql.query(`
        CREATE TABLE IF NOT EXISTS private_label_commercial_versions (
          id BIGSERIAL PRIMARY KEY,
          client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
          version_code TEXT NOT NULL,
          pricing_date DATE NOT NULL,
          business_model TEXT NOT NULL DEFAULT 'Private Label',
          responsible TEXT,
          receivable_days INTEGER NOT NULL DEFAULT 0,
          target_margin_percent NUMERIC(9,4) NOT NULL DEFAULT 0,
          tax_percent NUMERIC(9,4) NOT NULL DEFAULT 0,
          commission_percent NUMERIC(9,4) NOT NULL DEFAULT 0,
          logistics_unit_cost NUMERIC(18,6) NOT NULL DEFAULT 0,
          validity_days INTEGER NOT NULL DEFAULT 7,
          total_quantity INTEGER NOT NULL DEFAULT 0,
          revenue_total NUMERIC(18,6) NOT NULL DEFAULT 0,
          variable_cost_total NUMERIC(18,6) NOT NULL DEFAULT 0,
          contribution_total NUMERIC(18,6) NOT NULL DEFAULT 0,
          contribution_margin_percent NUMERIC(9,4) NOT NULL DEFAULT 0,
          status TEXT NOT NULL DEFAULT 'proposta_comercial',
          economic_status TEXT,
          notes TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          UNIQUE (client_id, version_code)
        )
      `);
      await sql.query(`
        CREATE TABLE IF NOT EXISTS private_label_commercial_items (
          id BIGSERIAL PRIMARY KEY,
          commercial_version_id BIGINT NOT NULL REFERENCES private_label_commercial_versions(id) ON DELETE CASCADE,
          project_id INTEGER NOT NULL REFERENCES engineering_projects(id) ON DELETE RESTRICT,
          product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
          item_name TEXT NOT NULL,
          quantity INTEGER NOT NULL,
          unit_price NUMERIC(18,6) NOT NULL,
          revenue_total NUMERIC(18,6) NOT NULL,
          raw_material_unit NUMERIC(18,6) NOT NULL DEFAULT 0,
          packaging_unit NUMERIC(18,6) NOT NULL DEFAULT 0,
          direct_labor_unit NUMERIC(18,6) NOT NULL DEFAULT 0,
          quality_unit NUMERIC(18,6) NOT NULL DEFAULT 0,
          logistics_unit NUMERIC(18,6) NOT NULL DEFAULT 0,
          direct_cost_unit NUMERIC(18,6) NOT NULL DEFAULT 0,
          tax_unit NUMERIC(18,6) NOT NULL DEFAULT 0,
          commission_unit NUMERIC(18,6) NOT NULL DEFAULT 0,
          financial_unit NUMERIC(18,6) NOT NULL DEFAULT 0,
          other_variable_unit NUMERIC(18,6) NOT NULL DEFAULT 0,
          variable_expense_unit NUMERIC(18,6) NOT NULL DEFAULT 0,
          variable_cost_unit NUMERIC(18,6) NOT NULL DEFAULT 0,
          contribution_unit NUMERIC(18,6) NOT NULL DEFAULT 0,
          contribution_margin_percent NUMERIC(9,4) NOT NULL DEFAULT 0,
          markup NUMERIC(9,4) NOT NULL DEFAULT 0,
          break_even_price NUMERIC(18,6) NOT NULL DEFAULT 0,
          minimum_price NUMERIC(18,6) NOT NULL DEFAULT 0,
          ideal_price NUMERIC(18,6) NOT NULL DEFAULT 0,
          premium_price NUMERIC(18,6) NOT NULL DEFAULT 0,
          max_discount_percent NUMERIC(9,4) NOT NULL DEFAULT 0,
          contribution_total NUMERIC(18,6) NOT NULL DEFAULT 0,
          financial_status TEXT,
          discount_ladder JSONB NOT NULL DEFAULT '[]'::jsonb,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          UNIQUE (commercial_version_id, project_id)
        )
      `);
      await Promise.all([
        sql.query("CREATE INDEX IF NOT EXISTS idx_pl_commercial_versions_client ON private_label_commercial_versions(client_id, pricing_date DESC)"),
        sql.query("CREATE INDEX IF NOT EXISTS idx_pl_commercial_items_project ON private_label_commercial_items(project_id)"),
        sql.query("CREATE INDEX IF NOT EXISTS idx_pl_commercial_items_version ON private_label_commercial_items(commercial_version_id)")
      ]);
    })().catch((error) => {
      commercialSchemaPromise = null;
      throw error;
    });
  }
  await commercialSchemaPromise;
}

export async function listCommercialSnapshotsForProject(projectId: number) {
  await ensurePrivateLabelCommercialSchema();
  return getSql().query(`
    SELECT i.*, v.version_code, v.pricing_date::text, v.receivable_days,
           v.target_margin_percent::float8, v.tax_percent::float8,
           v.validity_days, v.status AS version_status, v.economic_status,
           v.revenue_total::float8 AS version_revenue_total,
           v.contribution_total::float8 AS version_contribution_total,
           v.contribution_margin_percent::float8 AS version_contribution_margin_percent,
           v.total_quantity AS version_total_quantity, v.notes AS version_notes
    FROM private_label_commercial_items i
    INNER JOIN private_label_commercial_versions v ON v.id = i.commercial_version_id
    WHERE i.project_id = $1
    ORDER BY v.pricing_date DESC, v.id DESC, i.id DESC
  `, [projectId]);
}
