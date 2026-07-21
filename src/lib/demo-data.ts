import type Database from "better-sqlite3";

type SeedOptions = {
  reset?: boolean;
};

export function seedDemoData(database: Database.Database, options: SeedOptions = {}) {
  const existingRows = database
    .prepare("SELECT COUNT(*) AS total FROM clients")
    .get() as { total: number };

  if