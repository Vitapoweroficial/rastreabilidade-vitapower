import Database from "better-sqlite3";
import path from "node:path";
import { seedDemoData } from "@/lib/demo-data";

const globalForDb = globalThis as typeof globalThis & {
  vitaPowerDb?: Database.Database;
};

function databasePath() {
  if (process.env.VERCEL || process.env.NODE_ENV === "production") {
    return ":memory:";
  }

  const configuredPath = process.env.SQLITE_PATH ?? "data/vitapower.db";

  return path.isAbsolute(configuredPath)
    ? configuredPath
    : path.join(process.cwd(), configuredPath);
}

function createDatabase() {
  const filename = databasePath();
  const database = new Database(filename);

  database.pragma("foreign_keys = ON");
  migrate(database);

  if (filename === ":memory:") {
    seedDemoData(database);
  }

  return database;
}

export const db = globalForDb.vitaPowerDb ?? createDatabase();
globalForDb.vitaPowerDb = db;

export function migrate(database: Database.Database = db) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      brand_name TEXT NOT NULL,
      legal_name TEXT NOT NULL,
      tax_id TEXT,
      contact_name TEXT,
      email TEXT,
      phone TEXT,
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER NOT NULL,
      sku TEXT NOT NULL,
      name TEXT NOT NULL,
      category TEXT,
      description TEXT,
      formula_version TEXT,
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE RESTRICT,
      UNIQUE (client_id, sku)
    );

    CREATE TABLE IF NOT EXISTS lots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      code TEXT NOT NULL UNIQUE,
      manufacturing_date TEXT NOT NULL,
      expiration_date TEXT NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 0,
      unit TEXT NOT NULL DEFAULT 'un',
      status TEXT NOT NULL CHECK (status IN ('released', 'quarantine', 'blocked', 'expired')),
      origin TEXT,
      analysis_summary TEXT,
      traceability_notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
    );

    CREATE TABLE IF NOT EXISTS client_contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      role TEXT,
      email TEXT,
      phone TEXT,
      is_primary INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER NOT NULL,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      project_type TEXT NOT NULL DEFAULT 'private_label',
      status TEXT NOT NULL DEFAULT 'briefing',
      priority TEXT NOT NULL DEFAULT 'normal',
      expected_delivery_date TEXT,
      estimated_revenue_cents INTEGER NOT NULL DEFAULT 0,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE RESTRICT
    );

    CREATE TABLE IF NOT EXISTS suppliers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      tax_id TEXT,
      contact_name TEXT,
      email TEXT,
      phone TEXT,
      supplier_type TEXT NOT NULL DEFAULT 'general',
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS engineering_suppliers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      contact_name TEXT,
      email TEXT,
      phone TEXT,
      category TEXT,
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS raw_materials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      internal_code TEXT NOT NULL UNIQUE,
      category TEXT,
      primary_supplier_id INTEGER,
      secondary_supplier_id INTEGER,
      supplier_id INTEGER,
      unit TEXT NOT NULL DEFAULT 'kg',
      price_per_kg REAL NOT NULL DEFAULT 0,
      price_per_g REAL NOT NULL DEFAULT 0,
      last_cost_cents INTEGER NOT NULL DEFAULT 0,
      minimum_stock REAL NOT NULL DEFAULT 0,
      lead_time_days INTEGER NOT NULL DEFAULT 0,
      lot TEXT,
      manufacturer TEXT,
      expiration_date TEXT,
      technical_specification TEXT,
      allergen_notes TEXT,
      status TEXT NOT NULL DEFAULT 'Ativo',
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (primary_supplier_id) REFERENCES engineering_suppliers(id) ON DELETE SET NULL,
      FOREIGN KEY (secondary_supplier_id) REFERENCES engineering_suppliers(id) ON DELETE SET NULL,
      FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS packaging_materials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      internal_code TEXT NOT NULL UNIQUE,
      category TEXT NOT NULL DEFAULT 'Pote',
      packaging_type TEXT,
      supplier_id INTEGER,
      unit TEXT NOT NULL DEFAULT 'un',
      unit_cost REAL NOT NULL DEFAULT 0,
      last_cost_cents INTEGER NOT NULL DEFAULT 0,
      minimum_stock REAL NOT NULL DEFAULT 0,
      lead_time_days INTEGER NOT NULL DEFAULT 0,
      lot TEXT,
      manufacturer TEXT,
      technical_specification TEXT,
      status TEXT NOT NULL DEFAULT 'Ativo',
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS formulas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER,
      project_id INTEGER,
      code TEXT NOT NULL,
      version TEXT NOT NULL,
      name TEXT NOT NULL,
      batch_yield_quantity REAL NOT NULL DEFAULT 0,
      batch_yield_unit TEXT NOT NULL DEFAULT 'un',
      status TEXT NOT NULL DEFAULT 'draft',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
      UNIQUE (code, version)
    );

    CREATE TABLE IF NOT EXISTS engineering_formulas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      code TEXT NOT NULL,
      version TEXT NOT NULL,
      client_id INTEGER,
      product_id INTEGER,
      category TEXT,
      responsible TEXT,
      formula_date TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Rascunho',
      approved_at TEXT,
      source_formula_id INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
      FOREIGN KEY (source_formula_id) REFERENCES engineering_formulas(id) ON DELETE SET NULL,
      UNIQUE (code, version)
    );

    CREATE TABLE IF NOT EXISTS formula_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      formula_id INTEGER NOT NULL,
      raw_material_id INTEGER NOT NULL,
      percentage REAL NOT NULL DEFAULT 0,
      grams_per_serving REAL NOT NULL DEFAULT 0,
      grams_per_container REAL NOT NULL DEFAULT 0,
      kg_per_batch REAL NOT NULL DEFAULT 0,
      cost REAL NOT NULL DEFAULT 0,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (formula_id) REFERENCES engineering_formulas(id) ON DELETE CASCADE,
      FOREIGN KEY (raw_material_id) REFERENCES raw_materials(id) ON DELETE RESTRICT
    );

    CREATE TABLE IF NOT EXISTS pricing_models (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER,
      project_id INTEGER,
      formula_id INTEGER,
      name TEXT NOT NULL,
      raw_material_cost_cents INTEGER NOT NULL DEFAULT 0,
      packaging_cost_cents INTEGER NOT NULL DEFAULT 0,
      labor_cost_cents INTEGER NOT NULL DEFAULT 0,
      tax_cents INTEGER NOT NULL DEFAULT 0,
      card_fee_cents INTEGER NOT NULL DEFAULT 0,
      representative_commission_cents INTEGER NOT NULL DEFAULT 0,
      freight_cents INTEGER NOT NULL DEFAULT 0,
      loss_margin_percentage REAL NOT NULL DEFAULT 0,
      contribution_margin_percentage REAL NOT NULL DEFAULT 0,
      final_price_cents INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'draft',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
      FOREIGN KEY (formula_id) REFERENCES formulas(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS engineering_projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER NOT NULL,
      product_id INTEGER,
      name TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Novo projeto',
      briefing TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE RESTRICT,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS formula_packaging_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      formula_id INTEGER NOT NULL,
      packaging_material_id INTEGER NOT NULL,
      quantity REAL NOT NULL DEFAULT 1,
      cost REAL NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (formula_id) REFERENCES engineering_formulas(id) ON DELETE CASCADE,
      FOREIGN KEY (packaging_material_id) REFERENCES packaging_materials(id) ON DELETE RESTRICT
    );

    CREATE TABLE IF NOT EXISTS pricing_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      formula_id INTEGER NOT NULL,
      project_id INTEGER,
      raw_material_cost REAL NOT NULL DEFAULT 0,
      packaging_cost REAL NOT NULL DEFAULT 0,
      industrial_cost REAL NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'Enviado para precificacao',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (formula_id) REFERENCES engineering_formulas(id) ON DELETE CASCADE,
      FOREIGN KEY (project_id) REFERENCES engineering_projects(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS commercial_proposals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pricing_request_id INTEGER NOT NULL,
      client_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      customer_mode TEXT NOT NULL DEFAULT 'rascunho',
      pdf_status TEXT NOT NULL DEFAULT 'pendente',
      send_status TEXT NOT NULL DEFAULT 'nao_enviado',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (pricing_request_id) REFERENCES pricing_requests(id) ON DELETE CASCADE,
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE RESTRICT
    );

    CREATE INDEX IF NOT EXISTS idx_products_client_id ON products(client_id);
    CREATE INDEX IF NOT EXISTS idx_lots_product_id ON lots(product_id);
    CREATE INDEX IF NOT EXISTS idx_lots_code ON lots(code);
    CREATE INDEX IF NOT EXISTS idx_lots_status ON lots(status);
    CREATE INDEX IF NOT EXISTS idx_lots_expiration_date ON lots(expiration_date);
    CREATE INDEX IF NOT EXISTS idx_client_contacts_client_id ON client_contacts(client_id);
    CREATE INDEX IF NOT EXISTS idx_projects_client_id ON projects(client_id);
    CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
    CREATE INDEX IF NOT EXISTS idx_raw_materials_code ON raw_materials(internal_code);
    CREATE INDEX IF NOT EXISTS idx_packaging_code ON packaging_materials(internal_code);
    CREATE INDEX IF NOT EXISTS idx_formulas_code_version ON engineering_formulas(code, version);
    CREATE INDEX IF NOT EXISTS idx_formula_items_formula ON formula_items(formula_id);
    CREATE INDEX IF NOT EXISTS idx_engineering_projects_client ON engineering_projects(client_id);
    CREATE INDEX IF NOT EXISTS idx_formula_packaging_formula ON formula_packaging_items(formula_id);
    CREATE INDEX IF NOT EXISTS idx_pricing_requests_formula ON pricing_requests(formula_id);
  `);
}
