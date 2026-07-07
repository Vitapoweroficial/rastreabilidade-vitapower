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
