import { ensureSchema, getSql } from "@/lib/db";
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

type Numeric = number | string;
type DateValue = string | Date;

type ClientRow = {
  id: number;
  brand_name: string;
  legal_name: string;
  tax_id: string | null;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  active: boolean;
  created_at: DateValue;
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
  active: boolean;
  created_at: DateValue;
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
  quantity: Numeric;
  unit: string;
  status: LotStatus;
  origin: string | null;
  analysis_summary: string | null;
  traceability_notes: string | null;
  created_at: DateValue;
};

type PublicLotRow = LotRow & {
  legal_name: string;
  product_category: string | null;
  product_description: string | null;
  formula_version: string | null;
};

type EngineeringSupplierRow = {
  id: number;
  name: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  category: string | null;
  active: boolean;
  created_at: DateValue;
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
  created_at: DateValue;
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
  created_at: DateValue;
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
  created_at: DateValue;
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

type EngineeringProjectRow = {
  id: number;
  client_id: number;
  client_brand_name: string;
  product_id: number | null;
  product_name: string | null;
  name: string;
  status: string;
  briefing: string | null;
  created_at: DateValue;
};

type FormulaPackagingRow = {
  id: number;
  formula_id: number;
  packaging_material_id: number;
  packaging_name: string;
  packaging_code: string;
  category: string;
  quantity: number;
  cost: number;
};

type PricingRequestRow = {
  id: number;
  formula_id: number;
  formula_name: string;
  project_id: number | null;
  raw_material_cost: number;
  packaging_cost: number;
  industrial_cost: number;
  status: string;
  created_at: DateValue;
};

type CommercialProposalRow = {
  id: number;
  pricing_request_id: number;
  client_id: number;
  client_brand_name: string;
  title: string;
  customer_mode: string;
  pdf_status: string;
  send_status: string;
  created_at: DateValue;
};

async function query<T>(statement: string, params: unknown[] = []): Promise<T[]> {
  await ensureSchema();
  const sql = getSql();
  return (await sql.query(statement, params)) as unknown as T[];
}

function optional(value: string | null | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function required(value: string, field: string) {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${field} e obrigatorio.`);
  return normalized;
}

function normalizeCode(value: string) {
  return required(value, "Codigo do lote").replace(/\s+/g, "-").toUpperCase();
}

function dateString(value: DateValue) {
  return value instanceof Date ? value.toISOString() : String(value);
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
    active: row.active,
    createdAt: dateString(row.created_at)
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
    active: row.active,
    createdAt: dateString(row.created_at)
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
    quantity: Number(row.quantity),
    unit: row.unit,
    status: row.status,
    origin: row.origin,
    analysisSummary: row.analysis_summary,
    traceabilityNotes: row.traceability_notes,
    createdAt: dateString(row.created_at)
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

const clientSelect = `
  SELECT id, brand_name, legal_name, tax_id, contact_name, email, phone, active, created_at
  FROM clients
`;

const productSelect = `
  SELECT products.id, products.client_id, clients.brand_name AS client_brand_name,
    products.sku, products.name, products.category, products.description,
    products.formula_version, products.active, products.created_at
  FROM products
  INNER JOIN clients ON clients.id = products.client_id
`;

const lotSelect = `
  SELECT lots.id, lots.product_id, products.name AS product_name, products.sku,
    clients.id AS client_id, clients.brand_name AS client_brand_name, lots.code,
    lots.manufacturing_date::text AS manufacturing_date,
    lots.expiration_date::text AS expiration_date,
    lots.quantity::float8 AS quantity, lots.unit, lots.status, lots.origin,
    lots.analysis_summary, lots.traceability_notes, lots.created_at
  FROM lots
  INNER JOIN products ON products.id = lots.product_id
  INNER JOIN clients ON clients.id = products.client_id
`;

export async function listClients() {
  const result = await query<ClientRow>(`${clientSelect} ORDER BY created_at DESC, id DESC`);
  return result.map(mapClient);
}

export async function listActiveClients() {
  const result = await query<ClientRow>(`${clientSelect} WHERE active = TRUE ORDER BY brand_name ASC`);
  return result.map(mapClient);
}

export async function getClientById(id: number) {
  const [row] = await query<ClientRow>(`${clientSelect} WHERE id = $1`, [id]);
  return row ? mapClient(row) : null;
}

export async function createClient(input: CreateClientInput) {
  const [created] = await query<{ id: number }>(
    `INSERT INTO clients (brand_name, legal_name, tax_id, contact_name, email, phone, active)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id`,
    [
      required(input.brandName, "Marca"),
      required(input.legalName, "Razao social"),
      optional(input.taxId),
      optional(input.contactName),
      optional(input.email),
      optional(input.phone),
      input.active !== false
    ]
  );
  return getClientById(created.id);
}

export async function listProducts() {
  const result = await query<ProductRow>(`${productSelect} ORDER BY products.created_at DESC, products.id DESC`);
  return result.map(mapProduct);
}

export async function listActiveProducts() {
  const result = await query<ProductRow>(
    `${productSelect} WHERE products.active = TRUE AND clients.active = TRUE
     ORDER BY clients.brand_name ASC, products.name ASC`
  );
  return result.map(mapProduct);
}

export async function getProductById(id: number) {
  const [row] = await query<ProductRow>(`${productSelect} WHERE products.id = $1`, [id]);
  return row ? mapProduct(row) : null;
}

export async function createProduct(input: CreateProductInput) {
  const [created] = await query<{ id: number }>(
    `INSERT INTO products (client_id, sku, name, category, description, formula_version, active)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id`,
    [
      input.clientId,
      required(input.sku, "SKU").toUpperCase(),
      required(input.name, "Produto"),
      optional(input.category),
      optional(input.description),
      optional(input.formulaVersion),
      input.active !== false
    ]
  );
  return getProductById(created.id);
}

export async function listLots(limit?: number) {
  const result = await query<LotRow>(
    `${lotSelect} ORDER BY lots.created_at DESC, lots.id DESC ${limit ? "LIMIT $1" : ""}`,
    limit ? [limit] : []
  );
  return result.map(mapLot);
}

export async function getLotById(id: number) {
  const [row] = await query<LotRow>(`${lotSelect} WHERE lots.id = $1`, [id]);
  return row ? mapLot(row) : null;
}

export async function getPublicLotByCode(code: string) {
  const [row] = await query<PublicLotRow>(
    `SELECT lots.id, lots.product_id, products.name AS product_name, products.sku,
      clients.id AS client_id, clients.brand_name AS client_brand_name, clients.legal_name,
      lots.code, lots.manufacturing_date::text AS manufacturing_date,
      lots.expiration_date::text AS expiration_date, lots.quantity::float8 AS quantity,
      lots.unit, lots.status, lots.origin, lots.analysis_summary, lots.traceability_notes,
      lots.created_at, products.category AS product_category,
      products.description AS product_description, products.formula_version
     FROM lots
     INNER JOIN products ON products.id = lots.product_id
     INNER JOIN clients ON clients.id = products.client_id
     WHERE lots.code = $1`,
    [normalizeCode(code)]
  );
  return row ? mapPublicLot(row) : null;
}

export async function createLot(input: CreateLotInput) {
  const [created] = await query<{ id: number }>(
    `INSERT INTO lots (
      product_id, code, manufacturing_date, expiration_date, quantity, unit, status,
      origin, analysis_summary, traceability_notes
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING id`,
    [
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
    ]
  );
  return getLotById(created.id);
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const [row] = await query<{
    active_clients: number;
    active_products: number;
    total_lots: number;
    released_lots: number;
    quarantine_lots: number;
    expiring_lots: number;
    active_projects: number;
    raw_materials: number;
    packaging_materials: number;
    formulas: number;
    pricing_models: number;
  }>(`
    SELECT
      (SELECT COUNT(*)::int FROM clients WHERE active = TRUE) AS active_clients,
      (SELECT COUNT(*)::int FROM products WHERE active = TRUE) AS active_products,
      (SELECT COUNT(*)::int FROM lots) AS total_lots,
      (SELECT COUNT(*)::int FROM lots WHERE status = 'released') AS released_lots,
      (SELECT COUNT(*)::int FROM lots WHERE status = 'quarantine') AS quarantine_lots,
      (SELECT COUNT(*)::int FROM lots WHERE expiration_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '45 days') AS expiring_lots,
      (SELECT COUNT(*)::int FROM engineering_projects WHERE status NOT IN ('delivered', 'cancelled')) AS active_projects,
      (SELECT COUNT(*)::int FROM raw_materials WHERE status = 'Ativo') AS raw_materials,
      (SELECT COUNT(*)::int FROM packaging_materials WHERE status = 'Ativo') AS packaging_materials,
      (SELECT COUNT(*)::int FROM engineering_formulas) AS formulas,
      (SELECT COUNT(*)::int FROM pricing_requests) AS pricing_models
  `);

  return {
    activeClients: row.active_clients,
    activeProducts: row.active_products,
    totalLots: row.total_lots,
    releasedLots: row.released_lots,
    quarantineLots: row.quarantine_lots,
    expiringLots: row.expiring_lots,
    activeProjects: row.active_projects,
    rawMaterials: row.raw_materials,
    packagingMaterials: row.packaging_materials,
    formulas: row.formulas,
    pricingModels: row.pricing_models
  };
}

export async function getDashboardData() {
  const [stats, recentLots] = await Promise.all([getDashboardStats(), listLots(6)]);
  return { stats, recentLots };
}

export async function listEngineeringSuppliers() {
  return query<EngineeringSupplierRow>(
    `SELECT id, name, contact_name, email, phone, category, active, created_at
     FROM engineering_suppliers ORDER BY name ASC`
  );
}

export async function createEngineeringSupplier(input: {
  name: string;
  contactName?: string | null;
  email?: string | null;
  phone?: string | null;
  category?: string | null;
  active: boolean;
}) {
  await query(
    `INSERT INTO engineering_suppliers (name, contact_name, email, phone, category, active)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [
      required(input.name, "Nome do fornecedor"),
      optional(input.contactName),
      optional(input.email),
      optional(input.phone),
      optional(input.category),
      input.active
    ]
  );
}

export async function listRawMaterials() {
  return query<RawMaterialRow>(`
    SELECT raw_materials.id, raw_materials.name, raw_materials.internal_code,
      raw_materials.category, raw_materials.primary_supplier_id,
      ps.name AS primary_supplier_name, raw_materials.secondary_supplier_id,
      ss.name AS secondary_supplier_name, raw_materials.unit,
      raw_materials.price_per_kg::float8 AS price_per_kg,
      raw_materials.price_per_g::float8 AS price_per_g,
      raw_materials.minimum_stock::float8 AS minimum_stock,
      raw_materials.lead_time_days, raw_materials.lot, raw_materials.manufacturer,
      raw_materials.expiration_date::text AS expiration_date,
      raw_materials.technical_specification, raw_materials.status, raw_materials.created_at
    FROM raw_materials
    LEFT JOIN engineering_suppliers ps ON ps.id = raw_materials.primary_supplier_id
    LEFT JOIN engineering_suppliers ss ON ss.id = raw_materials.secondary_supplier_id
    ORDER BY raw_materials.name ASC
  `);
}

export async function createRawMaterial(input: {
  name: string;
  internalCode: string;
  category?: string | null;
  primarySupplierId?: number | null;
  secondarySupplierId?: number | null;
  unit: string;
  pricePerKg: number;
  minimumStock: number;
  leadTimeDays: number;
  lot?: string | null;
  manufacturer?: string | null;
  expirationDate?: string | null;
  technicalSpecification?: string | null;
  status: string;
}) {
  const pricePerKg = Number(input.pricePerKg || 0);
  await query(
    `INSERT INTO raw_materials (
      name, internal_code, category, primary_supplier_id, secondary_supplier_id,
      unit, price_per_kg, price_per_g, minimum_stock, lead_time_days, lot,
      manufacturer, expiration_date, technical_specification, status
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
    [
      required(input.name, "Nome da materia-prima"),
      required(input.internalCode, "Codigo interno"),
      optional(input.category),
      input.primarySupplierId || null,
      input.secondarySupplierId || null,
      input.unit,
      pricePerKg,
      pricePerKg / 1000,
      Number(input.minimumStock || 0),
      Number(input.leadTimeDays || 0),
      optional(input.lot),
      optional(input.manufacturer),
      optional(input.expirationDate),
      optional(input.technicalSpecification),
      input.status || "Ativo"
    ]
  );
}

export async function listPackagingMaterials() {
  return query<PackagingMaterialRow>(`
    SELECT packaging_materials.id, packaging_materials.name,
      packaging_materials.internal_code, packaging_materials.category,
      packaging_materials.supplier_id, engineering_suppliers.name AS supplier_name,
      packaging_materials.unit_cost::float8 AS unit_cost,
      packaging_materials.minimum_stock::float8 AS minimum_stock,
      packaging_materials.lead_time_days, packaging_materials.lot,
      packaging_materials.manufacturer, packaging_materials.technical_specification,
      packaging_materials.status, packaging_materials.created_at
    FROM packaging_materials
    LEFT JOIN engineering_suppliers ON engineering_suppliers.id = packaging_materials.supplier_id
    ORDER BY packaging_materials.category ASC, packaging_materials.name ASC
  `);
}

export async function createPackagingMaterial(input: {
  name: string;
  internalCode: string;
  category: string;
  supplierId?: number | null;
  unitCost: number;
  minimumStock: number;
  leadTimeDays: number;
  lot?: string | null;
  manufacturer?: string | null;
  technicalSpecification?: string | null;
  status: string;
}) {
  await query(
    `INSERT INTO packaging_materials (
      name, internal_code, category, supplier_id, unit_cost, minimum_stock,
      lead_time_days, lot, manufacturer, technical_specification, status
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
    [
      required(input.name, "Nome da embalagem"),
      required(input.internalCode, "Codigo interno"),
      input.category,
      input.supplierId || null,
      Number(input.unitCost || 0),
      Number(input.minimumStock || 0),
      Number(input.leadTimeDays || 0),
      optional(input.lot),
      optional(input.manufacturer),
      optional(input.technicalSpecification),
      input.status || "Ativo"
    ]
  );
}

export async function listEngineeringFormulas() {
  return query<FormulaRow>(`
    SELECT ef.id, ef.name, ef.code, ef.version, ef.client_id,
      clients.brand_name AS client_brand_name, ef.product_id,
      products.name AS product_name, ef.category, ef.responsible,
      ef.formula_date::text AS formula_date, ef.status,
      ef.approved_at::text AS approved_at, ef.source_formula_id, ef.created_at,
      (SELECT COALESCE(SUM(fi.percentage), 0)::float8 FROM formula_items fi WHERE fi.formula_id = ef.id) AS total_percentage,
      (SELECT COALESCE(SUM(fi.cost), 0)::float8 FROM formula_items fi WHERE fi.formula_id = ef.id) AS total_cost,
      (SELECT COUNT(*)::int FROM formula_items fi WHERE fi.formula_id = ef.id) AS item_count
    FROM engineering_formulas ef
    LEFT JOIN clients ON clients.id = ef.client_id
    LEFT JOIN products ON products.id = ef.product_id
    ORDER BY ef.created_at DESC, ef.id DESC
  `);
}

export async function listFormulaItems(formulaId: number) {
  return query<FormulaItemRow>(
    `SELECT formula_items.id, formula_items.formula_id, formula_items.raw_material_id,
      raw_materials.name AS raw_material_name,
      raw_materials.internal_code AS raw_material_code,
      formula_items.percentage::float8 AS percentage,
      formula_items.grams_per_serving::float8 AS grams_per_serving,
      formula_items.grams_per_container::float8 AS grams_per_container,
      formula_items.kg_per_batch::float8 AS kg_per_batch,
      formula_items.cost::float8 AS cost, formula_items.notes
     FROM formula_items
     INNER JOIN raw_materials ON raw_materials.id = formula_items.raw_material_id
     WHERE formula_items.formula_id = $1
     ORDER BY formula_items.id ASC`,
    [formulaId]
  );
}

export async function createEngineeringFormula(input: {
  name: string;
  code: string;
  version: string;
  clientId?: number | null;
  productId?: number | null;
  category?: string | null;
  responsible?: string | null;
  formulaDate: string;
}) {
  await query(
    `INSERT INTO engineering_formulas (
      name, code, version, client_id, product_id, category, responsible, formula_date
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      required(input.name, "Nome da formula"),
      required(input.code, "Codigo da formula"),
      required(input.version, "Versao"),
      input.clientId || null,
      input.productId || null,
      optional(input.category),
      optional(input.responsible),
      input.formulaDate || new Date().toISOString().slice(0, 10)
    ]
  );
}

export async function addFormulaItem(input: {
  formulaId: number;
  rawMaterialId: number;
  percentage: number;
  gramsPerServing: number;
  gramsPerContainer: number;
  kgPerBatch: number;
  notes?: string | null;
}) {
  const [material] = await query<{ price_per_kg: number }>(
    `SELECT price_per_kg::float8 AS price_per_kg FROM raw_materials WHERE id = $1`,
    [input.rawMaterialId]
  );
  if (!material) throw new Error("Materia-prima nao encontrada.");
  const cost = Number(input.kgPerBatch || 0) * Number(material.price_per_kg || 0);
  await query(
    `INSERT INTO formula_items (
      formula_id, raw_material_id, percentage, grams_per_serving,
      grams_per_container, kg_per_batch, cost, notes
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      input.formulaId,
      input.rawMaterialId,
      Number(input.percentage || 0),
      Number(input.gramsPerServing || 0),
      Number(input.gramsPerContainer || 0),
      Number(input.kgPerBatch || 0),
      cost,
      optional(input.notes)
    ]
  );
}

export async function duplicateEngineeringFormula(formulaId: number) {
  const [original] = await query<FormulaRow>(
    `SELECT id, name, code, version, client_id, product_id, category, responsible,
      formula_date::text AS formula_date, status, approved_at::text AS approved_at,
      source_formula_id, created_at, 0::float8 AS total_percentage,
      0::float8 AS total_cost, 0::int AS item_count,
      NULL::text AS client_brand_name, NULL::text AS product_name
     FROM engineering_formulas WHERE id = $1`,
    [formulaId]
  );
  if (!original) throw new Error("Formula nao encontrada.");

  const nextVersion = `${original.version}-copy-${Date.now()}`;
  await query(
    `WITH inserted AS (
      INSERT INTO engineering_formulas (
        name, code, version, client_id, product_id, category,
        responsible, formula_date, source_formula_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_DATE, $8)
      RETURNING id
    )
    INSERT INTO formula_items (
      formula_id, raw_material_id, percentage, grams_per_serving,
      grams_per_container, kg_per_batch, cost, notes
    )
    SELECT inserted.id, fi.raw_material_id, fi.percentage, fi.grams_per_serving,
      fi.grams_per_container, fi.kg_per_batch, fi.cost, fi.notes
    FROM formula_items fi
    CROSS JOIN inserted
    WHERE fi.formula_id = $8`,
    [
      `${original.name} - copia`,
      original.code,
      nextVersion,
      original.client_id,
      original.product_id,
      original.category,
      original.responsible,
      formulaId
    ]
  );
}

export async function approveEngineeringFormula(formulaId: number) {
  await query(
    `UPDATE engineering_formulas SET status = 'Aprovada', approved_at = NOW() WHERE id = $1`,
    [formulaId]
  );
}

export async function getEngineeringDashboard() {
  const [row] = await query<{
    raw_material_count: number;
    packaging_count: number;
    supplier_count: number;
    formula_count: number;
  }>(`
    SELECT
      (SELECT COUNT(*)::int FROM raw_materials) AS raw_material_count,
      (SELECT COUNT(*)::int FROM packaging_materials) AS packaging_count,
      (SELECT COUNT(*)::int FROM engineering_suppliers) AS supplier_count,
      (SELECT COUNT(*)::int FROM engineering_formulas) AS formula_count
  `);
  return {
    rawMaterialCount: row.raw_material_count,
    packagingCount: row.packaging_count,
    supplierCount: row.supplier_count,
    formulaCount: row.formula_count
  };
}

export async function listEngineeringProjects() {
  return query<EngineeringProjectRow>(`
    SELECT engineering_projects.id, engineering_projects.client_id,
      clients.brand_name AS client_brand_name, engineering_projects.product_id,
      products.name AS product_name, engineering_projects.name,
      engineering_projects.status, engineering_projects.briefing,
      engineering_projects.created_at
    FROM engineering_projects
    INNER JOIN clients ON clients.id = engineering_projects.client_id
    LEFT JOIN products ON products.id = engineering_projects.product_id
    ORDER BY engineering_projects.created_at DESC, engineering_projects.id DESC
  `);
}

export async function createEngineeringProject(input: {
  clientId: number;
  productId?: number | null;
  name: string;
  briefing?: string | null;
}) {
  await query(
    `INSERT INTO engineering_projects (client_id, product_id, name, briefing)
     VALUES ($1, $2, $3, $4)`,
    [input.clientId, input.productId || null, required(input.name, "Nome do projeto"), optional(input.briefing)]
  );
}

export async function listFormulaPackagingItems(formulaId: number) {
  return query<FormulaPackagingRow>(
    `SELECT formula_packaging_items.id, formula_packaging_items.formula_id,
      formula_packaging_items.packaging_material_id,
      packaging_materials.name AS packaging_name,
      packaging_materials.internal_code AS packaging_code,
      packaging_materials.category,
      formula_packaging_items.quantity::float8 AS quantity,
      formula_packaging_items.cost::float8 AS cost
     FROM formula_packaging_items
     INNER JOIN packaging_materials ON packaging_materials.id = formula_packaging_items.packaging_material_id
     WHERE formula_packaging_items.formula_id = $1
     ORDER BY packaging_materials.category ASC`,
    [formulaId]
  );
}

export async function addFormulaPackagingItem(input: {
  formulaId: number;
  packagingMaterialId: number;
  quantity: number;
}) {
  const [packaging] = await query<{ unit_cost: number }>(
    `SELECT unit_cost::float8 AS unit_cost FROM packaging_materials WHERE id = $1`,
    [input.packagingMaterialId]
  );
  if (!packaging) throw new Error("Embalagem nao encontrada.");
  const quantity = Number(input.quantity || 1);
  await query(
    `INSERT INTO formula_packaging_items (formula_id, packaging_material_id, quantity, cost)
     VALUES ($1, $2, $3, $4)`,
    [input.formulaId, input.packagingMaterialId, quantity, quantity * Number(packaging.unit_cost || 0)]
  );
}

export async function sendFormulaToPricing(input: {
  formulaId: number;
  projectId?: number | null;
}) {
  await query(
    `INSERT INTO pricing_requests (
      formula_id, project_id, raw_material_cost, packaging_cost, industrial_cost
     )
     SELECT $1, $2,
       COALESCE((SELECT SUM(cost) FROM formula_items WHERE formula_id = $1), 0),
       COALESCE((SELECT SUM(cost) FROM formula_packaging_items WHERE formula_id = $1), 0),
       COALESCE((SELECT SUM(cost) FROM formula_items WHERE formula_id = $1), 0) +
       COALESCE((SELECT SUM(cost) FROM formula_packaging_items WHERE formula_id = $1), 0)`,
    [input.formulaId, input.projectId || null]
  );
}

export async function listPricingRequests() {
  return query<PricingRequestRow>(`
    SELECT pricing_requests.id, pricing_requests.formula_id,
      engineering_formulas.name AS formula_name, pricing_requests.project_id,
      pricing_requests.raw_material_cost::float8 AS raw_material_cost,
      pricing_requests.packaging_cost::float8 AS packaging_cost,
      pricing_requests.industrial_cost::float8 AS industrial_cost,
      pricing_requests.status, pricing_requests.created_at
    FROM pricing_requests
    INNER JOIN engineering_formulas ON engineering_formulas.id = pricing_requests.formula_id
    ORDER BY pricing_requests.created_at DESC, pricing_requests.id DESC
  `);
}

export async function createProposalFromPricing(pricingRequestId: number) {
  const [row] = await query<{
    id: number;
    formula_name: string;
    client_id: number | null;
  }>(
    `SELECT pricing_requests.id, engineering_formulas.name AS formula_name,
      COALESCE(engineering_formulas.client_id, engineering_projects.client_id) AS client_id
     FROM pricing_requests
     INNER JOIN engineering_formulas ON engineering_formulas.id = pricing_requests.formula_id
     LEFT JOIN engineering_projects ON engineering_projects.id = pricing_requests.project_id
     WHERE pricing_requests.id = $1`,
    [pricingRequestId]
  );
  if (!row?.client_id) throw new Error("Solicitacao de precificacao sem cliente vinculado.");
  await query(
    `INSERT INTO commercial_proposals (
      pricing_request_id, client_id, title, customer_mode, pdf_status, send_status
     ) VALUES ($1, $2, $3, 'modo_cliente', 'gerado', 'pronto_para_envio')`,
    [pricingRequestId, row.client_id, `Proposta comercial - ${row.formula_name}`]
  );
}

export async function listCommercialProposals() {
  return query<CommercialProposalRow>(`
    SELECT commercial_proposals.id, commercial_proposals.pricing_request_id,
      commercial_proposals.client_id, clients.brand_name AS client_brand_name,
      commercial_proposals.title, commercial_proposals.customer_mode,
      commercial_proposals.pdf_status, commercial_proposals.send_status,
      commercial_proposals.created_at
    FROM commercial_proposals
    INNER JOIN clients ON clients.id = commercial_proposals.client_id
    ORDER BY commercial_proposals.created_at DESC, commercial_proposals.id DESC
  `);
}
