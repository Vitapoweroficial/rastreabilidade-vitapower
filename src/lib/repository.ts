import { db } from "@/lib/db";
import type {
  Client,
  CreateClientInput,
  CreateLotInput,
  CreateProductInput,
  DashboardStats,
  Lot,
  LotStatus,
  Product,
  PublicLot
} from "@/lib/types";

type ClientRow = {
  id: number;
  brand_name: string;
  legal_name: string;
  tax_id: string | null;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  active: number;
  created_at: string;
};

type ProductRow = {
  id: number;
  client_id: number;
  client_brand_name: string;
  sku: string;
  name: string;
  category: string | null;
  description: string | null;
  formula_version: string | null;
  active: number;
  created_at: string;
};

type LotRow = {
  id: number;
  product_id: number;
  product_name: string;
  sku: string;
  client_id: number;
  client_brand_name: string;
  code: string;
  manufacturing_date: string;
  expiration_date: string;
  quantity: number;
  unit: string;
  status: LotStatus;
  origin: string | null;
  analysis_summary: string | null;
  traceability_notes: string | null;
  created_at: string;
};

type PublicLotRow = LotRow & {
  legal_name: string;
  product_category: string | null;
  product_description: string | null;
  formula_version: string | null;
};

function optional(value: string | null | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function required(value: string, field: string) {
  const normalized = value.trim();
  if (!normalized) {
    throw new Error(`${field} e obrigatorio.`);
  }

  return normalized;
}

function normalizeCode(value: string) {
  return required(value, "Codigo do lote").replace(/\s+/g, "-").toUpperCase();
}

function mapClient(row: ClientRow): Client {
  return {
    id: row.id,
    brandName: row.brand_name,
    legalName: row.legal_name,
    taxId: row.tax_id,
    contactName: row.contact_name,
    email: row.email,
    phone: row.phone,
    active: row.active === 1,
    createdAt: row.created_at
  };
}

function mapProduct(row: ProductRow): Product {
  return {
    id: row.id,
    clientId: row.client_id,
    clientBrandName: row.client_brand_name,
    sku: row.sku,
    name: row.name,
    category: row.category,
    description: row.description,
    formulaVersion: row.formula_version,
    active: row.active === 1,
    createdAt: row.created_at
  };
}

function mapLot(row: LotRow): Lot {
  return {
    id: row.id,
    productId: row.product_id,
    productName: row.product_name,
    sku: row.sku,
    clientId: row.client_id,
    clientBrandName: row.client_brand_name,
    code: row.code,
    manufacturingDate: row.manufacturing_date,
    expirationDate: row.expiration_date,
    quantity: row.quantity,
    unit: row.unit,
    status: row.status,
    origin: row.origin,
    analysisSummary: row.analysis_summary,
    traceabilityNotes: row.traceability_notes,
    createdAt: row.created_at
  };
}

function mapPublicLot(row: PublicLotRow): PublicLot {
  return {
    ...mapLot(row),
    legalName: row.legal_name,
    productCategory: row.product_category,
    productDescription: row.product_description,
    formulaVersion: row.formula_version
  };
}

const lotSelect = `
  SELECT
    lots.id,
    lots.product_id,
    products.name AS product_name,
    products.sku,
    clients.id AS client_id,
    clients.brand_name AS client_brand_name,
    lots.code,
    lots.manufacturing_date,
    lots.expiration_date,
    lots.quantity,
    lots.unit,
    lots.status,
    lots.origin,
    lots.analysis_summary,
    lots.traceability_notes,
    lots.created_at
  FROM lots
  INNER JOIN products ON products.id = lots.product_id
  INNER JOIN clients ON clients.id = products.client_id
`;

export function listClients() {
  const rows = db
    .prepare(
      `SELECT id, brand_name, legal_name, tax_id, contact_name, email, phone, active, created_at
       FROM clients
       ORDER BY created_at DESC, id DESC`
    )
    .all() as ClientRow[];

  return rows.map(mapClient);
}

export function listActiveClients() {
  const rows = db
    .prepare(
      `SELECT id, brand_name, legal_name, tax_id, contact_name, email, phone, active, created_at
       FROM clients
       WHERE active = 1
       ORDER BY brand_name ASC`
    )
    .all() as ClientRow[];

  return rows.map(mapClient);
}

export function getClientById(id: number) {
  const row = db
    .prepare(
      `SELECT id, brand_name, legal_name, tax_id, contact_name, email, phone, active, created_at
       FROM clients
       WHERE id = ?`
    )
    .get(id) as ClientRow | undefined;

  return row ? mapClient(row) : null;
}

export function createClient(input: CreateClientInput) {
  const result = db
    .prepare(
      `INSERT INTO clients (brand_name, legal_name, tax_id, contact_name, email, phone, active)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      required(input.brandName, "Marca"),
      required(input.legalName, "Razao social"),
      optional(input.taxId),
      optional(input.contactName),
      optional(input.email),
      optional(input.phone),
      input.active === false ? 0 : 1
    );

  return getClientById(Number(result.lastInsertRowid));
}

export function listProducts() {
  const rows = db
    .prepare(
      `SELECT
        products.id,
        products.client_id,
        clients.brand_name AS client_brand_name,
        products.sku,
        products.name,
        products.category,
        products.description,
        products.formula_version,
        products.active,
        products.created_at
       FROM products
       INNER JOIN clients ON clients.id = products.client_id
       ORDER BY products.created_at DESC, products.id DESC`
    )
    .all() as ProductRow[];

  return rows.map(mapProduct);
}

export function listActiveProducts() {
  const rows = db
    .prepare(
      `SELECT
        products.id,
        products.client_id,
        clients.brand_name AS client_brand_name,
        products.sku,
        products.name,
        products.category,
        products.description,
        products.formula_version,
        products.active,
        products.created_at
       FROM products
       INNER JOIN clients ON clients.id = products.client_id
       WHERE products.active = 1 AND clients.active = 1
       ORDER BY clients.brand_name ASC, products.name ASC`
    )
    .all() as ProductRow[];

  return rows.map(mapProduct);
}

export function getProductById(id: number) {
  const row = db
    .prepare(
      `SELECT
        products.id,
        products.client_id,
        clients.brand_name AS client_brand_name,
        products.sku,
        products.name,
        products.category,
        products.description,
        products.formula_version,
        products.active,
        products.created_at
       FROM products
       INNER JOIN clients ON clients.id = products.client_id
       WHERE products.id = ?`
    )
    .get(id) as ProductRow | undefined;

  return row ? mapProduct(row) : null;
}

export function createProduct(input: CreateProductInput) {
  const result = db
    .prepare(
      `INSERT INTO products (client_id, sku, name, category, description, formula_version, active)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      input.clientId,
      required(input.sku, "SKU").toUpperCase(),
      required(input.name, "Produto"),
      optional(input.category),
      optional(input.description),
      optional(input.formulaVersion),
      input.active === false ? 0 : 1
    );

  return getProductById(Number(result.lastInsertRowid));
}

export function listLots(limit?: number) {
  const query = `${lotSelect}
    ORDER BY lots.created_at DESC, lots.id DESC
    ${limit ? "LIMIT ?" : ""}`;

  const rows = limit
    ? (db.prepare(query).all(limit) as LotRow[])
    : (db.prepare(query).all() as LotRow[]);

  return rows.map(mapLot);
}

export function getLotById(id: number) {
  const row = db
    .prepare(`${lotSelect} WHERE lots.id = ?`)
    .get(id) as LotRow | undefined;

  return row ? mapLot(row) : null;
}

export function getPublicLotByCode(code: string) {
  const row = db
    .prepare(
      `SELECT
        lots.id,
        lots.product_id,
        products.name AS product_name,
        products.sku,
        clients.id AS client_id,
        clients.brand_name AS client_brand_name,
        clients.legal_name,
        lots.code,
        lots.manufacturing_date,
        lots.expiration_date,
        lots.quantity,
        lots.unit,
        lots.status,
        lots.origin,
        lots.analysis_summary,
        lots.traceability_notes,
        lots.created_at,
        products.category AS product_category,
        products.description AS product_description,
        products.formula_version
       FROM lots
       INNER JOIN products ON products.id = lots.product_id
       INNER JOIN clients ON clients.id = products.client_id
       WHERE lots.code = ?`
    )
    .get(normalizeCode(code)) as PublicLotRow | undefined;

  return row ? mapPublicLot(row) : null;
}

export function createLot(input: CreateLotInput) {
  const result = db
    .prepare(
      `INSERT INTO lots (
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
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      input.productId,
      normalizeCode(input.code),
      required(input.manufacturingDate, "Data de fabricacao"),
      required(input.expirationDate, "Data de validade"),
      Number.isFinite(input.quantity) ? input.quantity : 0,
      optional(input.unit) ?? "un",
      input.status,
      optional(input.origin),
      optional(input.analysisSummary),
      optional(input.traceabilityNotes)
    );

  return getLotById(Number(result.lastInsertRowid));
}

export function getDashboardStats(): DashboardStats {
  const activeClients = db
    .prepare("SELECT COUNT(*) AS total FROM clients WHERE active = 1")
    .get() as { total: number };
  const activeProducts = db
    .prepare("SELECT COUNT(*) AS total FROM products WHERE active = 1")
    .get() as { total: number };
  const totalLots = db
    .prepare("SELECT COUNT(*) AS total FROM lots")
    .get() as { total: number };
  const releasedLots = db
    .prepare("SELECT COUNT(*) AS total FROM lots WHERE status = 'released'")
    .get() as { total: number };
  const quarantineLots = db
    .prepare("SELECT COUNT(*) AS total FROM lots WHERE status = 'quarantine'")
    .get() as { total: number };
  const expiringLots = db
    .prepare(
      `SELECT COUNT(*) AS total
       FROM lots
       WHERE expiration_date BETWEEN date('now') AND date('now', '+45 day')`
    )
    .get() as { total: number };
  const activeProjects = db
    .prepare("SELECT COUNT(*) AS total FROM projects WHERE status NOT IN ('delivered', 'cancelled')")
    .get() as { total: number };
  const rawMaterials = db
    .prepare("SELECT COUNT(*) AS total FROM raw_materials WHERE active = 1")
    .get() as { total: number };
  const packagingMaterials = db
    .prepare("SELECT COUNT(*) AS total FROM packaging_materials WHERE active = 1")
    .get() as { total: number };
  const formulas = db
    .prepare("SELECT COUNT(*) AS total FROM formulas")
    .get() as { total: number };
  const pricingModels = db
    .prepare("SELECT COUNT(*) AS total FROM pricing_models")
    .get() as { total: number };

  return {
    activeClients: activeClients.total,
    activeProducts: activeProducts.total,
    totalLots: totalLots.total,
    releasedLots: releasedLots.total,
    quarantineLots: quarantineLots.total,
    expiringLots: expiringLots.total,
    activeProjects: activeProjects.total,
    rawMaterials: rawMaterials.total,
    packagingMaterials: packagingMaterials.total,
    formulas: formulas.total,
    pricingModels: pricingModels.total
  };
}

export function getDashboardData() {
  return {
    stats: getDashboardStats(),
    recentLots: listLots(6)
  };
}

type EngineeringSupplierRow = {
  id: number;
  name: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  category: string | null;
  active: number;
  created_at: string;
};

type RawMaterialRow = {
  id: number;
  name: string;
  internal_code: string;
  category: string | null;
  primary_supplier_id: number | null;
  primary_supplier_name: string | null;
  secondary_supplier_id: number | null;
  secondary_supplier_name: string | null;
  unit: string;
  price_per_kg: number;
  price_per_g: number;
  minimum_stock: number;
  lead_time_days: number;
  lot: string | null;
  manufacturer: string | null;
  expiration_date: string | null;
  technical_specification: string | null;
  status: string;
  created_at: string;
};

type PackagingMaterialRow = {
  id: number;
  name: string;
  internal_code: string;
  category: string;
  supplier_id: number | null;
  supplier_name: string | null;
  unit_cost: number;
  minimum_stock: number;
  lead_time_days: number;
  lot: string | null;
  manufacturer: string | null;
  technical_specification: string | null;
  status: string;
  created_at: string;
};

type FormulaRow = {
  id: number;
  name: string;
  code: string;
  version: string;
  client_id: number | null;
  client_brand_name: string | null;
  product_id: number | null;
  product_name: string | null;
  category: string | null;
  responsible: string | null;
  formula_date: string;
  status: string;
  approved_at: string | null;
  source_formula_id: number | null;
  created_at: string;
  total_percentage: number;
  total_cost: number;
  item_count: number;
};

type FormulaItemRow = {
  id: number;
  formula_id: number;
  raw_material_id: number;
  raw_material_name: string;
  raw_material_code: string;
  percentage: number;
  grams_per_serving: number;
  grams_per_container: number;
  kg_per_batch: number;
  cost: number;
  notes: string | null;
};

export function listEngineeringSuppliers() {
  return db.prepare(`SELECT * FROM engineering_suppliers ORDER BY name ASC`).all() as EngineeringSupplierRow[];
}

export function createEngineeringSupplier(input: { name: string; contactName?: string | null; email?: string | null; phone?: string | null; category?: string | null; active: boolean }) {
  db.prepare(`INSERT INTO engineering_suppliers (name, contact_name, email, phone, category, active) VALUES (?, ?, ?, ?, ?, ?)`)
    .run(required(input.name, "Nome do fornecedor"), optional(input.contactName), optional(input.email), optional(input.phone), optional(input.category), input.active ? 1 : 0);
}

export function listRawMaterials() {
  return db.prepare(`
    SELECT raw_materials.*, ps.name AS primary_supplier_name, ss.name AS secondary_supplier_name
    FROM raw_materials
    LEFT JOIN engineering_suppliers ps ON ps.id = raw_materials.primary_supplier_id
    LEFT JOIN engineering_suppliers ss ON ss.id = raw_materials.secondary_supplier_id
    ORDER BY raw_materials.name ASC
  `).all() as RawMaterialRow[];
}

export function createRawMaterial(input: {
  name: string; internalCode: string; category?: string | null; primarySupplierId?: number | null; secondarySupplierId?: number | null;
  unit: string; pricePerKg: number; minimumStock: number; leadTimeDays: number; lot?: string | null; manufacturer?: string | null;
  expirationDate?: string | null; technicalSpecification?: string | null; status: string;
}) {
  const pricePerKg = Number(input.pricePerKg || 0);
  db.prepare(`
    INSERT INTO raw_materials (name, internal_code, category, primary_supplier_id, secondary_supplier_id, unit, price_per_kg, price_per_g, minimum_stock, lead_time_days, lot, manufacturer, expiration_date, technical_specification, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(required(input.name, "Nome da materia-prima"), required(input.internalCode, "Codigo interno"), optional(input.category), input.primarySupplierId || null, input.secondarySupplierId || null, input.unit, pricePerKg, pricePerKg / 1000, Number(input.minimumStock || 0), Number(input.leadTimeDays || 0), optional(input.lot), optional(input.manufacturer), optional(input.expirationDate), optional(input.technicalSpecification), input.status || "Ativo");
}

export function listPackagingMaterials() {
  return db.prepare(`
    SELECT packaging_materials.*, engineering_suppliers.name AS supplier_name
    FROM packaging_materials
    LEFT JOIN engineering_suppliers ON engineering_suppliers.id = packaging_materials.supplier_id
    ORDER BY packaging_materials.category ASC, packaging_materials.name ASC
  `).all() as PackagingMaterialRow[];
}

export function createPackagingMaterial(input: {
  name: string; internalCode: string; category: string; supplierId?: number | null; unitCost: number; minimumStock: number;
  leadTimeDays: number; lot?: string | null; manufacturer?: string | null; technicalSpecification?: string | null; status: string;
}) {
  db.prepare(`
    INSERT INTO packaging_materials (name, internal_code, category, supplier_id, unit_cost, minimum_stock, lead_time_days, lot, manufacturer, technical_specification, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(required(input.name, "Nome da embalagem"), required(input.internalCode, "Codigo interno"), input.category, input.supplierId || null, Number(input.unitCost || 0), Number(input.minimumStock || 0), Number(input.leadTimeDays || 0), optional(input.lot), optional(input.manufacturer), optional(input.technicalSpecification), input.status || "Ativo");
}

export function listEngineeringFormulas() {
  return db.prepare(`
    SELECT engineering_formulas.*, clients.brand_name AS client_brand_name, products.name AS product_name,
      COALESCE(SUM(formula_items.percentage), 0) AS total_percentage,
      COALESCE(SUM(formula_items.cost), 0) AS total_cost,
      COUNT(formula_items.id) AS item_count
    FROM engineering_formulas
    LEFT JOIN clients ON clients.id = engineering_formulas.client_id
    LEFT JOIN products ON products.id = engineering_formulas.product_id
    LEFT JOIN formula_items ON formula_items.formula_id = engineering_formulas.id
    GROUP BY engineering_formulas.id
    ORDER BY engineering_formulas.created_at DESC, engineering_formulas.id DESC
  `).all() as FormulaRow[];
}

export function listFormulaItems(formulaId: number) {
  return db.prepare(`
    SELECT formula_items.*, raw_materials.name AS raw_material_name, raw_materials.internal_code AS raw_material_code
    FROM formula_items
    INNER JOIN raw_materials ON raw_materials.id = formula_items.raw_material_id
    WHERE formula_items.formula_id = ?
    ORDER BY formula_items.id ASC
  `).all(formulaId) as FormulaItemRow[];
}

export function createEngineeringFormula(input: { name: string; code: string; version: string; clientId?: number | null; productId?: number | null; category?: string | null; responsible?: string | null; formulaDate: string }) {
  db.prepare(`INSERT INTO engineering_formulas (name, code, version, client_id, product_id, category, responsible, formula_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(required(input.name, "Nome da formula"), required(input.code, "Codigo da formula"), required(input.version, "Versao"), input.clientId || null, input.productId || null, optional(input.category), optional(input.responsible), input.formulaDate || new Date().toISOString().slice(0, 10));
}

export function addFormulaItem(input: { formulaId: number; rawMaterialId: number; percentage: number; gramsPerServing: number; gramsPerContainer: number; kgPerBatch: number; notes?: string | null }) {
  const material = db.prepare(`SELECT price_per_kg FROM raw_materials WHERE id = ?`).get(input.rawMaterialId) as { price_per_kg: number } | undefined;
  if (!material) throw new Error("Materia-prima nao encontrada.");
  const cost = Number(input.kgPerBatch || 0) * Number(material.price_per_kg || 0);
  db.prepare(`INSERT INTO formula_items (formula_id, raw_material_id, percentage, grams_per_serving, grams_per_container, kg_per_batch, cost, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(input.formulaId, input.rawMaterialId, Number(input.percentage || 0), Number(input.gramsPerServing || 0), Number(input.gramsPerContainer || 0), Number(input.kgPerBatch || 0), cost, optional(input.notes));
}

export function duplicateEngineeringFormula(formulaId: number) {
  const original = db.prepare(`SELECT * FROM engineering_formulas WHERE id = ?`).get(formulaId) as FormulaRow | undefined;
  if (!original) throw new Error("Formula nao encontrada.");
  const nextVersion = `${original.version}-copy`;
  const insert = db.prepare(`INSERT INTO engineering_formulas (name, code, version, client_id, product_id, category, responsible, formula_date, source_formula_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  const result = insert.run(`${original.name} - copia`, original.code, nextVersion, original.client_id, original.product_id, original.category, original.responsible, new Date().toISOString().slice(0, 10), formulaId);
  const newId = Number(result.lastInsertRowid);
  const items = db.prepare(`SELECT * FROM formula_items WHERE formula_id = ?`).all(formulaId) as FormulaItemRow[];
  const insertItem = db.prepare(`INSERT INTO formula_items (formula_id, raw_material_id, percentage, grams_per_serving, grams_per_container, kg_per_batch, cost, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
  for (const item of items) insertItem.run(newId, item.raw_material_id, item.percentage, item.grams_per_serving, item.grams_per_container, item.kg_per_batch, item.cost, item.notes);
}

export function approveEngineeringFormula(formulaId: number) {
  db.prepare(`UPDATE engineering_formulas SET status = 'Aprovada', approved_at = datetime('now') WHERE id = ?`).run(formulaId);
}

export function getEngineeringDashboard() {
  const rawMaterialCount = (db.prepare(`SELECT COUNT(*) AS total FROM raw_materials`).get() as { total: number }).total;
  const packagingCount = (db.prepare(`SELECT COUNT(*) AS total FROM packaging_materials`).get() as { total: number }).total;
  const supplierCount = (db.prepare(`SELECT COUNT(*) AS total FROM engineering_suppliers`).get() as { total: number }).total;
  const formulaCount = (db.prepare(`SELECT COUNT(*) AS total FROM engineering_formulas`).get() as { total: number }).total;
  return { rawMaterialCount, packagingCount, supplierCount, formulaCount };
}

type EngineeringProjectRow = { id: number; client_id: number; client_brand_name: string; product_id: number | null; product_name: string | null; name: string; status: string; briefing: string | null; created_at: string };
type FormulaPackagingRow = { id: number; formula_id: number; packaging_material_id: number; packaging_name: string; packaging_code: string; category: string; quantity: number; cost: number };
type PricingRequestRow = { id: number; formula_id: number; formula_name: string; project_id: number | null; raw_material_cost: number; packaging_cost: number; industrial_cost: number; status: string; created_at: string };
type CommercialProposalRow = { id: number; pricing_request_id: number; client_id: number; client_brand_name: string; title: string; customer_mode: string; pdf_status: string; send_status: string; created_at: string };

export function listEngineeringProjects() {
  return db.prepare(`
    SELECT engineering_projects.*, clients.brand_name AS client_brand_name, products.name AS product_name
    FROM engineering_projects
    INNER JOIN clients ON clients.id = engineering_projects.client_id
    LEFT JOIN products ON products.id = engineering_projects.product_id
    ORDER BY engineering_projects.created_at DESC, engineering_projects.id DESC
  `).all() as EngineeringProjectRow[];
}

export function createEngineeringProject(input: { clientId: number; productId?: number | null; name: string; briefing?: string | null }) {
  db.prepare(`INSERT INTO engineering_projects (client_id, product_id, name, briefing) VALUES (?, ?, ?, ?)`)
    .run(input.clientId, input.productId || null, required(input.name, "Nome do projeto"), optional(input.briefing));
}

export function listFormulaPackagingItems(formulaId: number) {
  return db.prepare(`
    SELECT formula_packaging_items.*, packaging_materials.name AS packaging_name, packaging_materials.internal_code AS packaging_code, packaging_materials.category
    FROM formula_packaging_items
    INNER JOIN packaging_materials ON packaging_materials.id = formula_packaging_items.packaging_material_id
    WHERE formula_packaging_items.formula_id = ?
    ORDER BY packaging_materials.category ASC
  `).all(formulaId) as FormulaPackagingRow[];
}

export function addFormulaPackagingItem(input: { formulaId: number; packagingMaterialId: number; quantity: number }) {
  const packaging = db.prepare(`SELECT unit_cost FROM packaging_materials WHERE id = ?`).get(input.packagingMaterialId) as { unit_cost: number } | undefined;
  if (!packaging) throw new Error("Embalagem nao encontrada.");
  const quantity = Number(input.quantity || 1);
  db.prepare(`INSERT INTO formula_packaging_items (formula_id, packaging_material_id, quantity, cost) VALUES (?, ?, ?, ?)`)
    .run(input.formulaId, input.packagingMaterialId, quantity, quantity * Number(packaging.unit_cost || 0));
}

export function sendFormulaToPricing(input: { formulaId: number; projectId?: number | null }) {
  const raw = db.prepare(`SELECT COALESCE(SUM(cost), 0) AS total FROM formula_items WHERE formula_id = ?`).get(input.formulaId) as { total: number };
  const pack = db.prepare(`SELECT COALESCE(SUM(cost), 0) AS total FROM formula_packaging_items WHERE formula_id = ?`).get(input.formulaId) as { total: number };
  db.prepare(`INSERT INTO pricing_requests (formula_id, project_id, raw_material_cost, packaging_cost, industrial_cost) VALUES (?, ?, ?, ?, ?)`)
    .run(input.formulaId, input.projectId || null, raw.total, pack.total, raw.total + pack.total);
}

export function listPricingRequests() {
  return db.prepare(`
    SELECT pricing_requests.*, engineering_formulas.name AS formula_name
    FROM pricing_requests
    INNER JOIN engineering_formulas ON engineering_formulas.id = pricing_requests.formula_id
    ORDER BY pricing_requests.created_at DESC, pricing_requests.id DESC
  `).all() as PricingRequestRow[];
}

export function createProposalFromPricing(pricingRequestId: number) {
  const row = db.prepare(`
    SELECT pricing_requests.id, engineering_formulas.name AS formula_name, COALESCE(engineering_formulas.client_id, engineering_projects.client_id) AS client_id
    FROM pricing_requests
    INNER JOIN engineering_formulas ON engineering_formulas.id = pricing_requests.formula_id
    LEFT JOIN engineering_projects ON engineering_projects.id = pricing_requests.project_id
    WHERE pricing_requests.id = ?
  `).get(pricingRequestId) as { id: number; formula_name: string; client_id: number | null } | undefined;
  if (!row?.client_id) throw new Error("Solicitacao de precificacao sem cliente vinculado.");
  db.prepare(`INSERT INTO commercial_proposals (pricing_request_id, client_id, title, customer_mode, pdf_status, send_status) VALUES (?, ?, ?, 'modo_cliente', 'gerado', 'pronto_para_envio')`)
    .run(pricingRequestId, row.client_id, `Proposta comercial - ${row.formula_name}`);
}

export function listCommercialProposals() {
  return db.prepare(`
    SELECT commercial_proposals.*, clients.brand_name AS client_brand_name
    FROM commercial_proposals
    INNER JOIN clients ON clients.id = commercial_proposals.client_id
    ORDER BY commercial_proposals.created_at DESC, commercial_proposals.id DESC
  `).all() as CommercialProposalRow[];
}
