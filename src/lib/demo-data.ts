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
    database.exec(`
      DELETE FROM lots;
      DELETE FROM pricing_models;
      DELETE FROM formula_items;
      DELETE FROM formulas;
      DELETE FROM raw_materials;
      DELETE FROM packaging_materials;
      DELETE FROM suppliers;
      DELETE FROM projects;
      DELETE FROM client_contacts;
      DELETE FROM products;
      DELETE FROM clients;
    `);

    const hasSqliteSequence = database
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'sqlite_sequence'")
      .get();

    if (hasSqliteSequence) {
      database
        .prepare(`
          DELETE FROM sqlite_sequence
          WHERE name IN (
            'clients',
            'products',
            'lots',
            'client_contacts',
            'projects',
            'suppliers',
            'raw_materials',
            'packaging_materials',
            'formulas',
            'formula_items',
            'pricing_models'
          )
        `)
        .run();
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
      "Creatina monohidratada com rastreabilidade por lote e controle de liberação.",
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

    database.prepare(`
      INSERT INTO client_contacts (client_id, name, role, email, phone, is_primary)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(nutriAlfa, "Marina Costa", "Compras e novos projetos", "marina@nutrialfa.com.br", "(11) 98888-0101", 1);

    const project = database.prepare(`
      INSERT INTO projects (client_id, code, name, project_type, status, priority, expected_delivery_date, estimated_revenue_cents, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      nutriAlfa,
      "PL-2026-001",
      "Linha premium de whey 900g",
      "private_label",
      "formula_pricing",
      "high",
      "2026-08-20",
      18400000,
      "Projeto piloto para estruturar briefing, formula, precificacao e aprovacao do cliente."
    ).lastInsertRowid;

    const supplier = database.prepare(`
      INSERT INTO suppliers (name, tax_id, contact_name, email, phone, supplier_type, active)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      "Insumos Premium Brasil",
      "33.444.555/0001-66",
      "Carla Mendes",
      "comercial@insumospremium.example",
      "(11) 96666-0303",
      "raw_material",
      1
    ).lastInsertRowid;

    const protein = database.prepare(`
      INSERT INTO raw_materials (internal_code, name, category, unit, supplier_id, last_cost_cents, allergen_notes, active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      "MP-WPC-80",
      "Whey Protein Concentrado 80%",
      "Proteinas",
      "kg",
      supplier,
      6850,
      "Contem derivados de leite.",
      1
    ).lastInsertRowid;

    database.prepare(`
      INSERT INTO packaging_materials (internal_code, name, packaging_type, unit, supplier_id, last_cost_cents, active)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run("EMB-POTE-900-PR", "Pote preto 900g com tampa", "pote", "un", supplier, 420, 1);

    const formula = database.prepare(`
      INSERT INTO formulas (product_id, project_id, code, version, name, batch_yield_quantity, batch_yield_unit, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(whey, project, "F-WHEY-BAU", "2026.01", "Whey Protein Baunilha 900g", 2400, "un", "approved").lastInsertRowid;

    database.prepare(`
      INSERT INTO formula_items (formula_id, raw_material_id, quantity, unit, loss_percentage)
      VALUES (?, ?, ?, ?, ?)
    `).run(formula, protein, 720, "kg", 1.5);

    database.prepare(`
      INSERT INTO pricing_models (
        product_id,
        project_id,
        formula_id,
        name,
        raw_material_cost_cents,
        packaging_cost_cents,
        labor_cost_cents,
        tax_cents,
        card_fee_cents,
        representative_commission_cents,
        freight_cents,
        loss_margin_percentage,
        contribution_margin_percentage,
        final_price_cents,
        status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(whey, project, formula, "Precificacao lote piloto 2400 un", 4932000, 1008000, 720000, 980000, 230000, 450000, 360000, 2.2, 31.5, 18400000, "draft");
  });

  seed();
}
