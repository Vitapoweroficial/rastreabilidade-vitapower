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

function ensureColumn(database: Database.Database, table: string, column: string, definition: string) {
  const columns = database.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];

  if (!columns.some((item) => item.name === column)) {
    database.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

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

    CREATE INDEX IF NOT EXISTS idx_products_client_id ON products(client_id);
    CREATE INDEX IF NOT EXISTS idx_lots_product_id ON lots(product_id);
    CREATE INDEX IF NOT EXISTS idx_lots_code ON lots(code);
    CREATE INDEX IF NOT EXISTS idx_lots_status ON lots(status);
    CREATE INDEX IF NOT EXISTS idx_lots_expiration_date ON lots(expiration_date);

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

    CREATE TABLE IF NOT EXISTS raw_materials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      internal_code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      category TEXT,
      unit TEXT NOT NULL DEFAULT 'kg',
      supplier_id INTEGER,
      last_cost_cents INTEGER NOT NULL DEFAULT 0,
      manufacturer TEXT,
      price_per_dose_cents INTEGER NOT NULL DEFAULT 0,
      stock_quantity REAL NOT NULL DEFAULT 0,
      minimum_stock_quantity REAL NOT NULL DEFAULT 0,
      lot_code TEXT,
      expiration_date TEXT,
      storage_location TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      notes TEXT,
      allergen_notes TEXT,
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS packaging_materials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      internal_code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      packaging_type TEXT,
      unit TEXT NOT NULL DEFAULT 'un',
      supplier_id INTEGER,
      last_cost_cents INTEGER NOT NULL DEFAULT 0,
      moq INTEGER NOT NULL DEFAULT 0,
      lead_time_days INTEGER NOT NULL DEFAULT 0,
      color TEXT,
      material TEXT,
      notes TEXT,
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL
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

    CREATE TABLE IF NOT EXISTS formula_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      formula_id INTEGER NOT NULL,
      raw_material_id INTEGER NOT NULL,
      quantity REAL NOT NULL,
      unit TEXT NOT NULL DEFAULT 'g',
      loss_percentage REAL NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (formula_id) REFERENCES formulas(id) ON DELETE CASCADE,
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

    CREATE INDEX IF NOT EXISTS idx_client_contacts_client_id ON client_contacts(client_id);
    CREATE INDEX IF NOT EXISTS idx_projects_client_id ON projects(client_id);
    CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
    CREATE INDEX IF NOT EXISTS idx_raw_materials_supplier_id ON raw_materials(supplier_id);
    CREATE INDEX IF NOT EXISTS idx_packaging_materials_supplier_id ON packaging_materials(supplier_id);
    CREATE INDEX IF NOT EXISTS idx_formulas_product_id ON formulas(product_id);
    CREATE INDEX IF NOT EXISTS idx_formulas_project_id ON formulas(project_id);
    CREATE INDEX IF NOT EXISTS idx_formula_items_formula_id ON formula_items(formula_id);
    CREATE INDEX IF NOT EXISTS idx_pricing_models_product_id ON pricing_models(product_id);
    CREATE INDEX IF NOT EXISTS idx_pricing_models_project_id ON pricing_models(project_id);

    CREATE TABLE IF NOT EXISTS raw_material_price_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      raw_material_id INTEGER NOT NULL,
      supplier_id INTEGER,
      cost_cents INTEGER NOT NULL DEFAULT 0,
      reason TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (raw_material_id) REFERENCES raw_materials(id) ON DELETE CASCADE,
      FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS raw_material_supplier_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      raw_material_id INTEGER NOT NULL,
      supplier_id INTEGER,
      supplier_name TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (raw_material_id) REFERENCES raw_materials(id) ON DELETE CASCADE,
      FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL
    );

    CREATE INDEX IF NOT EXISTS idx_raw_material_price_history_material_id ON raw_material_price_history(raw_material_id);
    CREATE INDEX IF NOT EXISTS idx_raw_material_supplier_history_material_id ON raw_material_supplier_history(raw_material_id);
  `);

  ensureColumn(database, 'raw_materials', 'manufacturer', 'TEXT');
  ensureColumn(database, 'raw_materials', 'price_per_dose_cents', 'INTEGER NOT NULL DEFAULT 0');
  ensureColumn(database, 'raw_materials', 'stock_quantity', 'REAL NOT NULL DEFAULT 0');
  ensureColumn(database, 'raw_materials', 'minimum_stock_quantity', 'REAL NOT NULL DEFAULT 0');
  ensureColumn(database, 'raw_materials', 'lot_code', 'TEXT');
  ensureColumn(database, 'raw_materials', 'expiration_date', 'TEXT');
  ensureColumn(database, 'raw_materials', 'storage_location', 'TEXT');
  ensureColumn(database, 'raw_materials', 'status', "TEXT NOT NULL DEFAULT 'active'");
  ensureColumn(database, 'raw_materials', 'notes', 'TEXT');
  ensureColumn(database, 'packaging_materials', 'moq', 'INTEGER NOT NULL DEFAULT 0');
  ensureColumn(database, 'packaging_materials', 'lead_time_days', 'INTEGER NOT NULL DEFAULT 0');
  ensureColumn(database, 'packaging_materials', 'color', 'TEXT');
  ensureColumn(database, 'packaging_materials', 'material', 'TEXT');
  ensureColumn(database, 'packaging_materials', 'notes', 'TEXT');
}
