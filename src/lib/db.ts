import { neon } from "@neondatabase/serverless";

type NeonClient = ReturnType<typeof neon>;

type DatabaseGlobal = typeof globalThis & {
  vitaPowerSql?: NeonClient;
  vitaPowerSchemaPromise?: Promise<void>;
};

const globalForDb = globalThis as DatabaseGlobal;

export function getSql() {
  if (globalForDb.vitaPowerSql) return globalForDb.vitaPowerSql;

  const connectionString = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL nao configurada. Conecte o banco Neon ao projeto na Vercel."
    );
  }

  globalForDb.vitaPowerSql = neon(connectionString);
  return globalForDb.vitaPowerSql;
}

export async function ensureSchema() {
  if (!globalForDb.vitaPowerSchemaPromise) {
    globalForDb.vitaPowerSchemaPromise = migrate().catch((error) => {
      globalForDb.vitaPowerSchemaPromise = undefined;
      throw error;
    });
  }

  await globalForDb.vitaPowerSchemaPromise;
}

async function migrate() {
  const sql = getSql();

  await sql.query(`
    CREATE TABLE IF NOT EXISTS clients (
      id SERIAL PRIMARY KEY,
      brand_name TEXT NOT NULL,
      legal_name TEXT NOT NULL,
      tax_id TEXT,
      contact_name TEXT,
      email TEXT,
      phone TEXT,
      active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await Promise.all([
    sql.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
        sku TEXT NOT NULL,
        name TEXT NOT NULL,
        category TEXT,
        description TEXT,
        formula_version TEXT,
        active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (client_id, sku)
      )
    `),
    sql.query(`
      CREATE TABLE IF NOT EXISTS engineering_suppliers (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        contact_name TEXT,
        email TEXT,
        phone TEXT,
        category TEXT,
        active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `)
  ]);

  await Promise.all([
    sql.query(`
      CREATE TABLE IF NOT EXISTS lots (
        id SERIAL PRIMARY KEY,
        product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
        code TEXT NOT NULL UNIQUE,
        manufacturing_date DATE NOT NULL,
        expiration_date DATE NOT NULL,
        quantity NUMERIC(18, 4) NOT NULL DEFAULT 0,
        unit TEXT NOT NULL DEFAULT 'un',
        status TEXT NOT NULL CHECK (status IN ('released', 'quarantine', 'blocked', 'expired')),
        origin TEXT,
        analysis_summary TEXT,
        traceability_notes TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `),
    sql.query(`
      CREATE TABLE IF NOT EXISTS raw_materials (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        internal_code TEXT NOT NULL UNIQUE,
        category TEXT,
        primary_supplier_id INTEGER REFERENCES engineering_suppliers(id) ON DELETE SET NULL,
        secondary_supplier_id INTEGER REFERENCES engineering_suppliers(id) ON DELETE SET NULL,
        unit TEXT NOT NULL CHECK (unit IN ('kg', 'g', 'mg', 'L', 'ml', 'un')),
        price_per_kg NUMERIC(18, 6) NOT NULL DEFAULT 0,
        price_per_g NUMERIC(18, 9) NOT NULL DEFAULT 0,
        minimum_stock NUMERIC(18, 4) NOT NULL DEFAULT 0,
        lead_time_days INTEGER NOT NULL DEFAULT 0,
        lot TEXT,
        manufacturer TEXT,
        expiration_date DATE,
        technical_specification TEXT,
        status TEXT NOT NULL CHECK (status IN ('Ativo', 'Inativo')) DEFAULT 'Ativo',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `),
    sql.query(`
      CREATE TABLE IF NOT EXISTS packaging_materials (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        internal_code TEXT NOT NULL UNIQUE,
        category TEXT NOT NULL CHECK (category IN ('Pote', 'Pouch', 'Tampa', 'Lacre', 'Scoop', 'Caixa', 'Rotulo', 'Shrink', 'Display')),
        supplier_id INTEGER REFERENCES engineering_suppliers(id) ON DELETE SET NULL,
        unit_cost NUMERIC(18, 6) NOT NULL DEFAULT 0,
        minimum_stock NUMERIC(18, 4) NOT NULL DEFAULT 0,
        lead_time_days INTEGER NOT NULL DEFAULT 0,
        lot TEXT,
        manufacturer TEXT,
        technical_specification TEXT,
        status TEXT NOT NULL CHECK (status IN ('Ativo', 'Inativo')) DEFAULT 'Ativo',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `),
    sql.query(`
      CREATE TABLE IF NOT EXISTS engineering_formulas (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        code TEXT NOT NULL,
        version TEXT NOT NULL,
        client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,
        product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
        category TEXT,
        responsible TEXT,
        formula_date DATE NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('Rascunho', 'Aprovada', 'Obsoleta')) DEFAULT 'Rascunho',
        approved_at TIMESTAMPTZ,
        source_formula_id INTEGER REFERENCES engineering_formulas(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (code, version)
      )
    `),
    sql.query(`
      CREATE TABLE IF NOT EXISTS engineering_projects (
        id SERIAL PRIMARY KEY,
        client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
        product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
        name TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'Novo projeto',
        briefing TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `)
  ]);

  await Promise.all([
    sql.query(`
      CREATE TABLE IF NOT EXISTS formula_items (
        id SERIAL PRIMARY KEY,
        formula_id INTEGER NOT NULL REFERENCES engineering_formulas(id) ON DELETE CASCADE,
        raw_material_id INTEGER NOT NULL REFERENCES raw_materials(id) ON DELETE RESTRICT,
        percentage NUMERIC(18, 6) NOT NULL DEFAULT 0,
        grams_per_serving NUMERIC(18, 6) NOT NULL DEFAULT 0,
        grams_per_container NUMERIC(18, 6) NOT NULL DEFAULT 0,
        kg_per_batch NUMERIC(18, 6) NOT NULL DEFAULT 0,
        cost NUMERIC(18, 6) NOT NULL DEFAULT 0,
        notes TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `),
    sql.query(`
      CREATE TABLE IF NOT EXISTS formula_packaging_items (
        id SERIAL PRIMARY KEY,
        formula_id INTEGER NOT NULL REFERENCES engineering_formulas(id) ON DELETE CASCADE,
        packaging_material_id INTEGER NOT NULL REFERENCES packaging_materials(id) ON DELETE RESTRICT,
        quantity NUMERIC(18, 6) NOT NULL DEFAULT 1,
        cost NUMERIC(18, 6) NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `),
    sql.query(`
      CREATE TABLE IF NOT EXISTS pricing_requests (
        id SERIAL PRIMARY KEY,
        formula_id INTEGER NOT NULL REFERENCES engineering_formulas(id) ON DELETE CASCADE,
        project_id INTEGER REFERENCES engineering_projects(id) ON DELETE SET NULL,
        raw_material_cost NUMERIC(18, 6) NOT NULL DEFAULT 0,
        packaging_cost NUMERIC(18, 6) NOT NULL DEFAULT 0,
        industrial_cost NUMERIC(18, 6) NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'Enviado para precificacao',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `)
  ]);

  await sql.query(`
    CREATE TABLE IF NOT EXISTS commercial_proposals (
      id SERIAL PRIMARY KEY,
      pricing_request_id INTEGER NOT NULL REFERENCES pricing_requests(id) ON DELETE CASCADE,
      client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
      title TEXT NOT NULL,
      customer_mode TEXT NOT NULL DEFAULT 'rascunho',
      pdf_status TEXT NOT NULL DEFAULT 'pendente',
      send_status TEXT NOT NULL DEFAULT 'nao_enviado',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await Promise.all([
    sql.query("CREATE INDEX IF NOT EXISTS idx_products_client_id ON products(client_id)"),
    sql.query("CREATE INDEX IF NOT EXISTS idx_lots_product_id ON lots(product_id)"),
    sql.query("CREATE INDEX IF NOT EXISTS idx_lots_code ON lots(code)"),
    sql.query("CREATE INDEX IF NOT EXISTS idx_lots_status ON lots(status)"),
    sql.query("CREATE INDEX IF NOT EXISTS idx_raw_materials_code ON raw_materials(internal_code)"),
    sql.query("CREATE INDEX IF NOT EXISTS idx_packaging_code ON packaging_materials(internal_code)"),
    sql.query("CREATE INDEX IF NOT EXISTS idx_formulas_code_version ON engineering_formulas(code, version)"),
    sql.query("CREATE INDEX IF NOT EXISTS idx_formula_items_formula ON formula_items(formula_id)"),
    sql.query("CREATE INDEX IF NOT EXISTS idx_engineering_projects_client ON engineering_projects(client_id)"),
    sql.query("CREATE INDEX IF NOT EXISTS idx_formula_packaging_formula ON formula_packaging_items(formula_id)"),
    sql.query("CREATE INDEX IF NOT EXISTS idx_pricing_requests_formula ON pricing_requests(formula_id)")
  ]);
}
