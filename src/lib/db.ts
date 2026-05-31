import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const globalForDb = globalThis as typeof globalThis & {
  vitaPowerDb?: Database.Database;
};

function databasePath() {
  const configuredPath = process.env.SQLITE_PATH ?? "data/vitapower.db";
  return path.isAbsolute(configuredPath)
    ? configuredPath
    : path.join(process.cwd(), configuredPath);
}

function createDatabase() {
  const filename = databasePath();
  fs.mkdirSync(path.dirname(filename), { recursive: true });

  const database = new Database(filename);
  database.pragma("journal_mode = WAL");
  database.pragma("foreign_keys = ON");
  migrate(database);

  return database;
}

export const db = globalForDb.vitaPowerDb ?? createDatabase();

if (process.env.NODE_ENV !== "production") {
  globalForDb.vitaPowerDb = db;
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
  `);
}
