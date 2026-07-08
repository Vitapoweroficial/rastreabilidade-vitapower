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

export type EngineeringSort = "code" | "name" | "category" | "supplier" | "stock" | "cost" | "validity" | "status";
export type EngineeringFilters = {
  query?: string;
  category?: string;
  supplierId?: number;
  status?: string;
  sort?: EngineeringSort;
};

type EngineeringSupplierRow = { id: number; name: string };
type EngineeringRawMaterialRow = {
  id: number;
  internal_code: string;
  name: string;
  category: string | null;
  unit: string;
  supplier_id: number | null;
  supplier_name: string | null;
  last_cost_cents: number;
  manufacturer: string | null;
  price_per_dose_cents: number;
  stock_quantity: number;
  minimum_stock_quantity: number;
  lot_code: string | null;
  expiration_date: string | null;
  storage_location: string | null;
  status: string;
  notes: string | null;
  created_at: string;
};
type EngineeringPackagingRow = {
  id: number;
  internal_code: string;
  name: string;
  packaging_type: string | null;
  supplier_id: number | null;
  supplier_name: string | null;
  last_cost_cents: number;
  moq: number;
  lead_time_days: number;
  color: string | null;
  material: string | null;
  notes: string | null;
  created_at: string;
};
type EngineeringDashboardRow = { total: number; value_cents?: number };
type EngineeringHistoryRow = { id: number; item_code: string; item_name: string; supplier_name: string | null; cost_cents: number; created_at: string; reason: string | null };

type CreateEngineeringMaterialInput = {
  code: string;
  name: string;
  category?: string | null;
  supplierId?: number | null;
  manufacturer?: string | null;
  unit?: string | null;
  costPerKgCents: number;
  pricePerDoseCents: number;
  stockQuantity: number;
  minimumStockQuantity: number;
  lotCode?: string | null;
  expirationDate?: string | null;
  storageLocation?: string | null;
  status?: string | null;
  notes?: string | null;
};

type CreateEngineeringPackagingInput = {
  code: string;
  name: string;
  category?: string | null;
  supplierId?: number | null;
  costCents: number;
  moq: number;
  leadTimeDays: number;
  color?: string | null;
  material?: string | null;
  notes?: string | null;
};

function cents(value: FormDataEntryValue | string | number | null | undefined) {
  const parsed = Number(String(value ?? "0").replace(".", "").replace(",", "."));
  return Number.isFinite(parsed) ? Math.round(parsed * 100) : 0;
}

function filterSql(filters: EngineeringFilters, tableAlias: string) {
  const clauses: string[] = [];
  const params: Array<string | number> = [];

  if (filters.query) {
    clauses.push(`(${tableAlias}.internal_code LIKE ? OR ${tableAlias}.name LIKE ? OR ${tableAlias}.category LIKE ?)`);
    const query = `%${filters.query}%`;
    params.push(query, query, query);
  }

  if (filters.category) {
    clauses.push(`${tableAlias}.category = ?`);
    params.push(filters.category);
  }

  if (filters.supplierId) {
    clauses.push(`${tableAlias}.supplier_id = ?`);
    params.push(filters.supplierId);
  }

  if (filters.status) {
    clauses.push(`${tableAlias}.status = ?`);
    params.push(filters.status);
  }

  return { where: clauses.length ? `WHERE ${clauses.join(" AND ")}` : "", params };
}

export function listEngineeringSuppliers() {
  return db.prepare("SELECT id, name FROM suppliers WHERE active = 1 ORDER BY name ASC").all() as EngineeringSupplierRow[];
}

export function listEngineeringMaterialCategories() {
  const rows = db.prepare("SELECT DISTINCT category FROM raw_materials WHERE category IS NOT NULL AND category <> '' ORDER BY category ASC").all() as { category: string }[];
  return rows.map((row) => row.category);
}

export function listEngineeringPackagingCategories() {
  const rows = db.prepare("SELECT DISTINCT packaging_type AS category FROM packaging_materials WHERE packaging_type IS NOT NULL AND packaging_type <> '' ORDER BY packaging_type ASC").all() as { category: string }[];
  return rows.map((row) => row.category);
}

export function listEngineeringRawMaterials(filters: EngineeringFilters = {}) {
  const { where, params } = filterSql(filters, "raw_materials");
  const sortMap: Record<EngineeringSort, string> = {
    code: "raw_materials.internal_code ASC",
    name: "raw_materials.name ASC",
    category: "raw_materials.category ASC, raw_materials.name ASC",
    supplier: "supplier_name ASC, raw_materials.name ASC",
    stock: "raw_materials.stock_quantity ASC",
    cost: "raw_materials.last_cost_cents DESC",
    validity: "raw_materials.expiration_date ASC",
    status: "raw_materials.status ASC, raw_materials.name ASC"
  };

  return db.prepare(`
    SELECT raw_materials.*, suppliers.name AS supplier_name
    FROM raw_materials
    LEFT JOIN suppliers ON suppliers.id = raw_materials.supplier_id
    ${where}
    ORDER BY ${sortMap[filters.sort ?? "name"]}
  `).all(...params) as EngineeringRawMaterialRow[];
}

export function listEngineeringPackaging(filters: EngineeringFilters = {}) {
  const clauses: string[] = [];
  const params: Array<string | number> = [];

  if (filters.query) {
    clauses.push("(packaging_materials.internal_code LIKE ? OR packaging_materials.name LIKE ? OR packaging_materials.packaging_type LIKE ?)");
    const query = `%${filters.query}%`;
    params.push(query, query, query);
  }

  if (filters.category) {
    clauses.push("packaging_materials.packaging_type = ?");
    params.push(filters.category);
  }

  if (filters.supplierId) {
    clauses.push("packaging_materials.supplier_id = ?");
    params.push(filters.supplierId);
  }

  const sortMap: Record<EngineeringSort, string> = {
    code: "packaging_materials.internal_code ASC",
    name: "packaging_materials.name ASC",
    category: "packaging_materials.packaging_type ASC, packaging_materials.name ASC",
    supplier: "supplier_name ASC, packaging_materials.name ASC",
    stock: "packaging_materials.moq DESC",
    cost: "packaging_materials.last_cost_cents DESC",
    validity: "packaging_materials.lead_time_days ASC",
    status: "packaging_materials.active DESC, packaging_materials.name ASC"
  };

  return db.prepare(`
    SELECT packaging_materials.*, suppliers.name AS supplier_name
    FROM packaging_materials
    LEFT JOIN suppliers ON suppliers.id = packaging_materials.supplier_id
    ${clauses.length ? `WHERE ${clauses.join(" AND ")}` : ""}
    ORDER BY ${sortMap[filters.sort ?? "name"]}
  `).all(...params) as EngineeringPackagingRow[];
}

export function getEngineeringDashboard() {
  const materialCount = db.prepare("SELECT COUNT(*) AS total FROM raw_materials WHERE active = 1").get() as EngineeringDashboardRow;
  const packagingCount = db.prepare("SELECT COUNT(*) AS total FROM packaging_materials WHERE active = 1").get() as EngineeringDashboardRow;
  const stockValue = db.prepare("SELECT COALESCE(SUM(stock_quantity * last_cost_cents), 0) AS value_cents FROM raw_materials WHERE active = 1").get() as EngineeringDashboardRow;
  const missingSupplier = db.prepare("SELECT COUNT(*) AS total FROM raw_materials WHERE active = 1 AND supplier_id IS NULL").get() as EngineeringDashboardRow;
  const lowStock = db.prepare("SELECT COUNT(*) AS total FROM raw_materials WHERE active = 1 AND stock_quantity <= minimum_stock_quantity").get() as EngineeringDashboardRow;
  const latestPriceChanges = db.prepare(`
    SELECT raw_material_price_history.id, raw_materials.internal_code AS item_code, raw_materials.name AS item_name, suppliers.name AS supplier_name, raw_material_price_history.cost_cents, raw_material_price_history.created_at, raw_material_price_history.reason
    FROM raw_material_price_history
    INNER JOIN raw_materials ON raw_materials.id = raw_material_price_history.raw_material_id
    LEFT JOIN suppliers ON suppliers.id = raw_material_price_history.supplier_id
    ORDER BY raw_material_price_history.created_at DESC, raw_material_price_history.id DESC
    LIMIT 5
  `).all() as EngineeringHistoryRow[];

  return {
    materialCount: materialCount.total,
    packagingCount: packagingCount.total,
    stockValueCents: stockValue.value_cents ?? 0,
    missingSupplier: missingSupplier.total,
    lowStock: lowStock.total,
    latestPriceChanges
  };
}

export function createEngineeringMaterial(input: CreateEngineeringMaterialInput) {
  const result = db.prepare(`
    INSERT INTO raw_materials (internal_code, name, category, unit, supplier_id, last_cost_cents, manufacturer, price_per_dose_cents, stock_quantity, minimum_stock_quantity, lot_code, expiration_date, storage_location, status, notes, active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
  `).run(required(input.code, "Codigo").toUpperCase(), required(input.name, "Nome"), optional(input.category), optional(input.unit) ?? "kg", input.supplierId || null, input.costPerKgCents, optional(input.manufacturer), input.pricePerDoseCents, input.stockQuantity, input.minimumStockQuantity, optional(input.lotCode), optional(input.expirationDate), optional(input.storageLocation), optional(input.status) ?? "active", optional(input.notes));
  const id = Number(result.lastInsertRowid);
  db.prepare("INSERT INTO raw_material_price_history (raw_material_id, supplier_id, cost_cents, reason) VALUES (?, ?, ?, ?)").run(id, input.supplierId || null, input.costPerKgCents, "Cadastro inicial");
  if (input.supplierId) {
    const supplier = db.prepare("SELECT name FROM suppliers WHERE id = ?").get(input.supplierId) as { name: string } | undefined;
    db.prepare("INSERT INTO raw_material_supplier_history (raw_material_id, supplier_id, supplier_name) VALUES (?, ?, ?)").run(id, input.supplierId, supplier?.name ?? "Fornecedor não identificado");
  }
  return id;
}

export function createEngineeringPackaging(input: CreateEngineeringPackagingInput) {
  const result = db.prepare(`
    INSERT INTO packaging_materials (internal_code, name, packaging_type, unit, supplier_id, last_cost_cents, moq, lead_time_days, color, material, notes, active)
    VALUES (?, ?, ?, 'un', ?, ?, ?, ?, ?, ?, ?, 1)
  `).run(required(input.code, "Codigo").toUpperCase(), required(input.name, "Nome"), optional(input.category), input.supplierId || null, input.costCents, input.moq, input.leadTimeDays, optional(input.color), optional(input.material), optional(input.notes));
  return Number(result.lastInsertRowid);
}

export function duplicateEngineeringMaterial(id: number) {
  const row = db.prepare("SELECT * FROM raw_materials WHERE id = ?").get(id) as EngineeringRawMaterialRow | undefined;
  if (!row) return null;
  return createEngineeringMaterial({ code: `${row.internal_code}-COPIA-${Date.now().toString().slice(-4)}`, name: `${row.name} (cópia)`, category: row.category, supplierId: row.supplier_id, manufacturer: row.manufacturer, unit: row.unit, costPerKgCents: row.last_cost_cents, pricePerDoseCents: row.price_per_dose_cents, stockQuantity: row.stock_quantity, minimumStockQuantity: row.minimum_stock_quantity, lotCode: row.lot_code, expirationDate: row.expiration_date, storageLocation: row.storage_location, status: row.status, notes: row.notes });
}

export function duplicateEngineeringPackaging(id: number) {
  const row = db.prepare("SELECT * FROM packaging_materials WHERE id = ?").get(id) as EngineeringPackagingRow | undefined;
  if (!row) return null;
  return createEngineeringPackaging({ code: `${row.internal_code}-COPIA-${Date.now().toString().slice(-4)}`, name: `${row.name} (cópia)`, category: row.packaging_type, supplierId: row.supplier_id, costCents: row.last_cost_cents, moq: row.moq, leadTimeDays: row.lead_time_days, color: row.color, material: row.material, notes: row.notes });
}

export function createEngineeringMaterialFromForm(formData: FormData) {
  return createEngineeringMaterial({
    code: String(formData.get("code") ?? ""),
    name: String(formData.get("name") ?? ""),
    category: String(formData.get("category") ?? ""),
    supplierId: Number(formData.get("supplierId")) || null,
    manufacturer: String(formData.get("manufacturer") ?? ""),
    unit: String(formData.get("unit") ?? "kg"),
    costPerKgCents: cents(formData.get("costPerKg")),
    pricePerDoseCents: cents(formData.get("pricePerDose")),
    stockQuantity: Number(formData.get("stockQuantity") ?? 0),
    minimumStockQuantity: Number(formData.get("minimumStockQuantity") ?? 0),
    lotCode: String(formData.get("lotCode") ?? ""),
    expirationDate: String(formData.get("expirationDate") ?? ""),
    storageLocation: String(formData.get("storageLocation") ?? ""),
    status: String(formData.get("status") ?? "active"),
    notes: String(formData.get("notes") ?? "")
  });
}

export function createEngineeringPackagingFromForm(formData: FormData) {
  return createEngineeringPackaging({
    code: String(formData.get("code") ?? ""),
    name: String(formData.get("name") ?? ""),
    category: String(formData.get("category") ?? ""),
    supplierId: Number(formData.get("supplierId")) || null,
    costCents: cents(formData.get("cost")),
    moq: Number(formData.get("moq") ?? 0),
    leadTimeDays: Number(formData.get("leadTimeDays") ?? 0),
    color: String(formData.get("color") ?? ""),
    material: String(formData.get("material") ?? ""),
    notes: String(formData.get("notes") ?? "")
  });
}

export type EngineeringProductFormulaItem = {
  id: number;
  rawMaterialCode: string;
  rawMaterialName: string;
  supplierName: string | null;
  quantity: number;
  unit: string;
  costPerKgCents: number;
  lossPercentage: number;
  costCents: number;
  notes: string | null;
};

export type EngineeringProductFormula = {
  id: number;
  code: string;
  version: string;
  name: string;
  status: string;
  batchYieldQuantity: number;
  batchYieldUnit: string;
  totalMaterialCostCents: number;
  items: EngineeringProductFormulaItem[];
};

export type EngineeringPackagingCost = {
  id: number;
  code: string;
  name: string;
  type: string | null;
  supplierName: string | null;
  unitCostCents: number;
};

export type EngineeringPricingScenario = {
  materialCostCents: number;
  packagingCostCents: number;
  laborCostCents: number;
  lossCostCents: number;
  industrialExpenseCents: number;
  industrialCostCents: number;
  taxCents: number;
  commissionCents: number;
  freightCents: number;
  financialCostCents: number;
  finalCostCents: number;
  wholesalePriceCents: number;
  distributorPriceCents: number;
  suggestedPriceCents: number;
  grossProfitCents: number;
  grossMarginPercentage: number;
  desiredMarginPercentage: number;
};

function toCentsFromDecimal(value: string | number | null | undefined) {
  const parsed = Number(String(value ?? "0").replace(".", "").replace(",", "."));
  return Number.isFinite(parsed) ? Math.round(parsed * 100) : 0;
}

export function getEngineeringProductDevelopment(productId: number) {
  const product = getProductById(productId);
  if (!product) return null;

  const formulaRows = db.prepare(`
    SELECT id, code, version, name, batch_yield_quantity, batch_yield_unit, status
    FROM formulas
    WHERE product_id = ?
    ORDER BY created_at DESC, id DESC
  `).all(productId) as Array<{ id: number; code: string; version: string; name: string; batch_yield_quantity: number; batch_yield_unit: string; status: string }>;

  const formulas = formulaRows.map((formula) => {
    const items = db.prepare(`
      SELECT formula_items.id, raw_materials.internal_code AS raw_material_code, raw_materials.name AS raw_material_name, suppliers.name AS supplier_name,
        formula_items.quantity, formula_items.unit, formula_items.loss_percentage, raw_materials.last_cost_cents AS cost_per_kg_cents,
        ROUND((formula_items.quantity * (1 + formula_items.loss_percentage / 100.0)) * raw_materials.last_cost_cents) AS cost_cents,
        raw_materials.notes
      FROM formula_items
      INNER JOIN raw_materials ON raw_materials.id = formula_items.raw_material_id
      LEFT JOIN suppliers ON suppliers.id = raw_materials.supplier_id
      WHERE formula_items.formula_id = ?
      ORDER BY formula_items.id ASC
    `).all(formula.id) as Array<{ id: number; raw_material_code: string; raw_material_name: string; supplier_name: string | null; quantity: number; unit: string; loss_percentage: number; cost_per_kg_cents: number; cost_cents: number; notes: string | null }>;

    return {
      id: formula.id,
      code: formula.code,
      version: formula.version,
      name: formula.name,
      status: formula.status,
      batchYieldQuantity: formula.batch_yield_quantity,
      batchYieldUnit: formula.batch_yield_unit,
      totalMaterialCostCents: items.reduce((sum, item) => sum + item.cost_cents, 0),
      items: items.map((item) => ({
        id: item.id,
        rawMaterialCode: item.raw_material_code,
        rawMaterialName: item.raw_material_name,
        supplierName: item.supplier_name,
        quantity: item.quantity,
        unit: item.unit,
        costPerKgCents: item.cost_per_kg_cents,
        lossPercentage: item.loss_percentage,
        costCents: item.cost_cents,
        notes: item.notes
      }))
    } satisfies EngineeringProductFormula;
  });

  const packagingCosts = db.prepare(`
    SELECT packaging_materials.id, packaging_materials.internal_code AS code, packaging_materials.name, packaging_materials.packaging_type AS type,
      suppliers.name AS supplier_name, packaging_materials.last_cost_cents AS unit_cost_cents
    FROM packaging_materials
    LEFT JOIN suppliers ON suppliers.id = packaging_materials.supplier_id
    WHERE LOWER(COALESCE(packaging_materials.packaging_type, '')) IN ('pote', 'tampa', 'lacre', 'scoop', 'rótulo', 'rotulo', 'caixa', 'etiqueta')
    ORDER BY packaging_materials.packaging_type ASC, packaging_materials.name ASC
  `).all() as Array<{ id: number; code: string; name: string; type: string | null; supplier_name: string | null; unit_cost_cents: number }>;

  return {
    product,
    formulas,
    packagingCosts: packagingCosts.map((item) => ({ id: item.id, code: item.code, name: item.name, type: item.type, supplierName: item.supplier_name, unitCostCents: item.unit_cost_cents })) as EngineeringPackagingCost[]
  };
}

export function calculateEngineeringPricingScenario(input: {
  materialCostCents: number;
  packagingCostCents: number;
  labor?: string | number | null;
  losses?: string | number | null;
  industrialExpenses?: string | number | null;
  taxes?: string | number | null;
  commission?: string | number | null;
  freight?: string | number | null;
  financialCost?: string | number | null;
  desiredMargin?: string | number | null;
}): EngineeringPricingScenario {
  const laborCostCents = toCentsFromDecimal(input.labor);
  const industrialExpenseCents = toCentsFromDecimal(input.industrialExpenses);
  const taxCents = toCentsFromDecimal(input.taxes);
  const commissionCents = toCentsFromDecimal(input.commission);
  const freightCents = toCentsFromDecimal(input.freight);
  const financialCostCents = toCentsFromDecimal(input.financialCost);
  const lossPercentage = Number(String(input.losses ?? "0").replace(",", "."));
  const desiredMarginPercentage = Number(String(input.desiredMargin ?? "35").replace(",", "."));
  const baseIndustrialCost = input.materialCostCents + input.packagingCostCents + laborCostCents + industrialExpenseCents;
  const lossCostCents = Math.round(baseIndustrialCost * (Number.isFinite(lossPercentage) ? lossPercentage : 0) / 100);
  const industrialCostCents = baseIndustrialCost + lossCostCents;
  const finalCostCents = industrialCostCents + taxCents + commissionCents + freightCents + financialCostCents;
  const suggestedPriceCents = Math.round(finalCostCents / Math.max(0.01, 1 - (Number.isFinite(desiredMarginPercentage) ? desiredMarginPercentage : 0) / 100));
  const grossProfitCents = suggestedPriceCents - finalCostCents;

  return {
    materialCostCents: input.materialCostCents,
    packagingCostCents: input.packagingCostCents,
    laborCostCents,
    lossCostCents,
    industrialExpenseCents,
    industrialCostCents,
    taxCents,
    commissionCents,
    freightCents,
    financialCostCents,
    finalCostCents,
    wholesalePriceCents: Math.round(suggestedPriceCents * 0.82),
    distributorPriceCents: Math.round(suggestedPriceCents * 0.68),
    suggestedPriceCents,
    grossProfitCents,
    grossMarginPercentage: suggestedPriceCents > 0 ? (grossProfitCents / suggestedPriceCents) * 100 : 0,
    desiredMarginPercentage: Number.isFinite(desiredMarginPercentage) ? desiredMarginPercentage : 0
  };
}
