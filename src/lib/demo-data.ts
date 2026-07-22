import type Database from "better-sqlite3";

type SeedOptions = {
  reset?: boolean;
};

export function seedDemoData(database: Database.Database, options: SeedOptions = {}) {
  const existingRows = database
    .prepare("SELECT COUNT(*) AS total FROM clients")
    .get() as { total: number };

  if (!options.reset && existingRows.total > 0) {
    return;
  }

  const seed = database.transaction(() => {
    if (options.reset) {
      database.exec(`
        DELETE FROM lots;
        DELETE FROM products;
        DELETE FROM clients;
      `);

      const hasSqliteSequence = database
        .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'sqlite_sequence'")
        .get();

      if (hasSqliteSequence) {
        database
          .prepare("DELETE FROM sqlite_sequence WHERE name IN ('clients', 'products', 'lots')")
          .run();
      }
    }

    const insertClient = database.prepare(`
      INSERT INTO clients (brand_name, legal_name, tax_id, contact_name, email, phone, active)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const nutriAlfa = insertClient.run(
      "Nutri Alfa",
      "Nutri Alfa Suplementos Ltda.",
      "12.345.678/0001-90",
      "Marina Costa",
      "marina@nutrialfa.com.br",
      "(11) 98888-0101",
      1
    ).lastInsertRowid;

    const powerLabs = insertClient.run(
      "Power Labs",
      "Power Labs Comercio de Nutraceuticos S.A.",
      "98.765.432/0001-10",
      "Renato Vieira",
      "renato@powerlabs.com.br",
      "(21) 97777-0202",
      1
    ).lastInsertRowid;

    const insertProduct = database.prepare(`
      INSERT INTO products (client_id, sku, name, category, description, formula_version, active)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const whey = insertProduct.run(
      nutriAlfa,
      "VPW-WHEY-BAU-900",
      "Whey Protein Baunilha 900g",
      "Suplementos proteicos",
      "Produto private label fabricado pela Vita Power para a marca Nutri Alfa.",
      "F-2026.01",
      1
    ).lastInsertRowid;

    const creatine = insertProduct.run(
      powerLabs,
      "VPW-CREA-300",
      "Creatina Monohidratada 300g",
      "Performance",
      "Creatina monohidratada com rastreabilidade por lote e controle de liberacao.",
      "F-2026.03",
      1
    ).lastInsertRowid;

    const insertLot = database.prepare(`
      INSERT INTO lots (
        product_id,
        code,
        manufacturing_date,
        expiration_date,
        quantity,
        unit,
        status,
        origin,
        analysis_summary,
        traceability_notes
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertLot.run(
      whey,
      "VPW-2026-001",
      "2026-04-12",
      "2027-04-12",
      2400,
      "un",
      "released",
      "Linha 2 / Planta Vita Power",
      "Lote aprovado nos parametros fisico-quimicos, microbiologicos e sensoriais.",
      "Materias-primas conferidas contra ordem de producao OP-2026-044."
    );

    insertLot.run(
      creatine,
      "VPW-2026-002",
      "2026-05-04",
      "2028-05-04",
      1800,
      "un",
      "quarantine",
      "Linha 1 / Planta Vita Power",
      "Aguardando conclusao da analise microbiologica.",
      "Retencao de amostras realizada em 2026-05-04."
    );
  });

  seed();
}
