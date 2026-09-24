import { ensureSchema, getSql } from "@/lib/db";
import { calculateLandedCost, calculateSavings } from "@/lib/procurement-calculations";
import { ensureWorkspaceMemberSchema } from "@/lib/workspace-members";

export const procurementStatuses = [
  "Cotando",
  "Aguardando fornecedor",
  "Recebida",
  "Em negociação",
  "Aprovada",
  "Compra realizada",
  "Descartada"
] as const;

export type ProcurementStatus = (typeof procurementStatuses)[number];
export type ProcurementItemType = "raw_material" | "packaging";

export type ProcurementItemOption = {
  id: number;
  type: ProcurementItemType;
  code: string;
  name: string;
  category: string | null;
  defaultUnit: "kg" | "un";
  specification: string | null;
};

export type ProcurementSupplier = {
  id: number;
  name: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  category: string | null;
  document: string | null;
  website: string | null;
  notes: string | null;
  active: boolean;
  offerCount: number;
  purchaseCount: number;
  averageQuality: number | null;
  averageDelivery: number | null;
  averageCommercial: number | null;
};

export type ProcurementQuote = {
  id: number;
  title: string;
  itemType: ProcurementItemType;
  itemId: number;
  itemCode: string;
  itemName: string;
  itemCategory: string | null;
  requestedQuantity: number;
  normalizedUnit: "kg" | "un";
  priority: "Baixa" | "Normal" | "Alta" | "Urgente";
  requiredBy: string | null;
  status: ProcurementStatus;
  source: "manual" | "pcp";
  pcpReference: string | null;
  notes: string | null;
  awardedOfferId: number | null;
  awardedSupplierName: string | null;
  offerCount: number;
  bestLandedUnitCost: number | null;
  averageLandedUnitCost: number | null;
  totalNegotiatedSavings: number;
  createdAt: string;
  updatedAt: string;
};

export type SupplierOffer = {
  id: number;
  quoteId: number;
  supplierId: number;
  supplierName: string;
  reference: string | null;
  quotedQuantity: number;
  purchaseUnit: string;
  unitsPerPurchaseUnit: number;
  initialUnitPrice: number | null;
  unitPrice: number;
  normalizedUnitCost: number;
  freightCost: number | null;
  taxPercent: number;
  taxAmount: number;
  otherCost: number;
  discountAmount: number;
  landedTotal: number | null;
  landedUnitCost: number | null;
  moq: number;
  paymentTerms: string | null;
  leadTimeDays: number;
  quoteDate: string;
  validUntil: string | null;
  manufacturer: string | null;
  distributor: string | null;
  concentrationPurity: string | null;
  origin: string | null;
  minimumShelfLife: string | null;
  notes: string | null;
  previousNormalizedUnitCost: number | null;
  priceVariationPercent: number | null;
  negotiatedSavings: number;
  attachmentCount: number;
  createdAt: string;
};

export type ProcurementAttachment = {
  id: number;
  offerId: number;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  createdAt: string;
};

export type ProcurementDashboard = {
  openQuotes: number;
  awaitingSupplier: number;
  receivedOffers: number;
  approvedQuotes: number;
  purchasedQuotes: number;
  negotiatedSavings: number;
};

type DatabaseGlobal = typeof globalThis & { vitaPowerProcurementSchema?: Promise<void> };
const globalForProcurement = globalThis as DatabaseGlobal;

function iso(value: string | Date) {
  return value instanceof Date ? value.toISOString() : String(value);
}

function optional(value: string | null | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function required(value: string, label: string) {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${label} é obrigatório.`);
  return normalized;
}

export async function ensureProcurementSchema() {
  if (!globalForProcurement.vitaPowerProcurementSchema) {
    globalForProcurement.vitaPowerProcurementSchema = (async () => {
      await ensureSchema();
      await ensureWorkspaceMemberSchema();
      const sql = getSql();

      await Promise.all([
        sql.query(`ALTER TABLE engineering_suppliers ADD COLUMN IF NOT EXISTS document TEXT`),
        sql.query(`ALTER TABLE engineering_suppliers ADD COLUMN IF NOT EXISTS website TEXT`),
        sql.query(`ALTER TABLE engineering_suppliers ADD COLUMN IF NOT EXISTS notes TEXT`),
        sql.query(`ALTER TABLE raw_materials ADD COLUMN IF NOT EXISTS distributor TEXT`),
        sql.query(`ALTER TABLE raw_materials ADD COLUMN IF NOT EXISTS concentration_purity TEXT`),
        sql.query(`ALTER TABLE raw_materials ADD COLUMN IF NOT EXISTS origin_country TEXT`),
        sql.query(`ALTER TABLE raw_materials ADD COLUMN IF NOT EXISTS technical_sheet_url TEXT`),
        sql.query(`ALTER TABLE raw_materials ADD COLUMN IF NOT EXISTS coa_url TEXT`),
        sql.query(`ALTER TABLE packaging_materials ADD COLUMN IF NOT EXISTS dimensions TEXT`),
        sql.query(`ALTER TABLE packaging_materials ADD COLUMN IF NOT EXISTS material TEXT`),
        sql.query(`ALTER TABLE packaging_materials ADD COLUMN IF NOT EXISTS weight_g NUMERIC(18,4)`),
        sql.query(`ALTER TABLE packaging_materials ADD COLUMN IF NOT EXISTS color TEXT`),
        sql.query(`ALTER TABLE packaging_materials ADD COLUMN IF NOT EXISTS capacity TEXT`),
        sql.query(`ALTER TABLE packaging_materials ADD COLUMN IF NOT EXISTS units_per_box INTEGER`),
        sql.query(`ALTER TABLE packaging_materials ADD COLUMN IF NOT EXISTS mold TEXT`),
        sql.query(`ALTER TABLE packaging_materials ADD COLUMN IF NOT EXISTS customization_cliche TEXT`),
        sql.query(`ALTER TABLE packaging_materials ADD COLUMN IF NOT EXISTS custom_lead_time_days INTEGER`)
      ]);

      await sql.query(`
        CREATE TABLE IF NOT EXISTS procurement_quotes (
          id BIGSERIAL PRIMARY KEY,
          title TEXT NOT NULL,
          item_type TEXT NOT NULL CHECK (item_type IN ('raw_material', 'packaging')),
          raw_material_id INTEGER REFERENCES raw_materials(id) ON DELETE RESTRICT,
          packaging_material_id INTEGER REFERENCES packaging_materials(id) ON DELETE RESTRICT,
          requested_quantity NUMERIC(18,4) NOT NULL CHECK (requested_quantity > 0),
          normalized_unit TEXT NOT NULL CHECK (normalized_unit IN ('kg', 'un')),
          priority TEXT NOT NULL DEFAULT 'Normal' CHECK (priority IN ('Baixa','Normal','Alta','Urgente')),
          required_by DATE,
          status TEXT NOT NULL DEFAULT 'Cotando' CHECK (status IN ('Cotando','Aguardando fornecedor','Recebida','Em negociação','Aprovada','Compra realizada','Descartada')),
          source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual','pcp')),
          pcp_reference TEXT,
          notes TEXT,
          awarded_offer_id BIGINT,
          created_by_member_id BIGINT REFERENCES workspace_members(id) ON DELETE SET NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          CONSTRAINT procurement_quote_item_check CHECK (
            (item_type = 'raw_material' AND raw_material_id IS NOT NULL AND packaging_material_id IS NULL) OR
            (item_type = 'packaging' AND packaging_material_id IS NOT NULL AND raw_material_id IS NULL)
          )
        )
      `);

      await sql.query(`
        CREATE TABLE IF NOT EXISTS procurement_supplier_offers (
          id BIGSERIAL PRIMARY KEY,
          quote_id BIGINT NOT NULL REFERENCES procurement_quotes(id) ON DELETE CASCADE,
          supplier_id INTEGER NOT NULL REFERENCES engineering_suppliers(id) ON DELETE RESTRICT,
          reference TEXT,
          quoted_quantity NUMERIC(18,4) NOT NULL CHECK (quoted_quantity > 0),
          purchase_unit TEXT NOT NULL,
          units_per_purchase_unit NUMERIC(18,6) NOT NULL DEFAULT 1 CHECK (units_per_purchase_unit > 0),
          initial_unit_price NUMERIC(18,6),
          unit_price NUMERIC(18,6) NOT NULL CHECK (unit_price >= 0),
          normalized_unit_cost NUMERIC(18,6) NOT NULL,
          freight_cost NUMERIC(18,6),
          tax_percent NUMERIC(9,4) NOT NULL DEFAULT 0,
          tax_amount NUMERIC(18,6) NOT NULL DEFAULT 0,
          other_cost NUMERIC(18,6) NOT NULL DEFAULT 0,
          discount_amount NUMERIC(18,6) NOT NULL DEFAULT 0,
          landed_total NUMERIC(18,6),
          landed_unit_cost NUMERIC(18,6),
          moq NUMERIC(18,4) NOT NULL DEFAULT 0,
          payment_terms TEXT,
          lead_time_days INTEGER NOT NULL DEFAULT 0,
          quote_date DATE NOT NULL DEFAULT CURRENT_DATE,
          valid_until DATE,
          manufacturer TEXT,
          distributor TEXT,
          concentration_purity TEXT,
          origin TEXT,
          minimum_shelf_life TEXT,
          notes TEXT,
          created_by_member_id BIGINT REFERENCES workspace_members(id) ON DELETE SET NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);

      await sql.query(`
        CREATE TABLE IF NOT EXISTS procurement_offer_attachments (
          id BIGSERIAL PRIMARY KEY,
          offer_id BIGINT NOT NULL REFERENCES procurement_supplier_offers(id) ON DELETE CASCADE,
          file_name TEXT NOT NULL,
          content_type TEXT NOT NULL,
          size_bytes INTEGER NOT NULL,
          content BYTEA NOT NULL,
          created_by_member_id BIGINT REFERENCES workspace_members(id) ON DELETE SET NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);

      await sql.query(`
        CREATE TABLE IF NOT EXISTS procurement_purchase_orders (
          id BIGSERIAL PRIMARY KEY,
          quote_id BIGINT NOT NULL UNIQUE REFERENCES procurement_quotes(id) ON DELETE RESTRICT,
          offer_id BIGINT NOT NULL UNIQUE REFERENCES procurement_supplier_offers(id) ON DELETE RESTRICT,
          supplier_id INTEGER NOT NULL REFERENCES engineering_suppliers(id) ON DELETE RESTRICT,
          purchase_reference TEXT,
          total NUMERIC(18,6),
          status TEXT NOT NULL DEFAULT 'aprovada' CHECK (status IN ('aprovada','compra_realizada','cancelada')),
          bling_purchase_order_id TEXT,
          bling_sync_status TEXT NOT NULL DEFAULT 'aguardando_conector' CHECK (bling_sync_status IN ('aguardando_conector','sincronizada','erro','nao_aplicavel')),
          pcp_reference TEXT,
          purchased_at TIMESTAMPTZ,
          created_by_member_id BIGINT REFERENCES workspace_members(id) ON DELETE SET NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);

      await sql.query(`
        CREATE TABLE IF NOT EXISTS procurement_supplier_performance (
          id BIGSERIAL PRIMARY KEY,
          supplier_id INTEGER NOT NULL REFERENCES engineering_suppliers(id) ON DELETE CASCADE,
          purchase_order_id BIGINT REFERENCES procurement_purchase_orders(id) ON DELETE SET NULL,
          quality_score SMALLINT NOT NULL CHECK (quality_score BETWEEN 1 AND 5),
          delivery_score SMALLINT NOT NULL CHECK (delivery_score BETWEEN 1 AND 5),
          commercial_score SMALLINT NOT NULL CHECK (commercial_score BETWEEN 1 AND 5),
          delivered_on_time BOOLEAN,
          nonconformity_count INTEGER NOT NULL DEFAULT 0,
          notes TEXT,
          evaluated_by_member_id BIGINT REFERENCES workspace_members(id) ON DELETE SET NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);

      await sql.query(`DO $$ BEGIN
        ALTER TABLE procurement_quotes
          ADD CONSTRAINT procurement_quotes_awarded_offer_fk
          FOREIGN KEY (awarded_offer_id) REFERENCES procurement_supplier_offers(id) ON DELETE SET NULL;
      EXCEPTION WHEN duplicate_object THEN NULL; END $$`);

      await Promise.all([
        sql.query(`CREATE INDEX IF NOT EXISTS idx_procurement_quotes_status ON procurement_quotes(status)`),
        sql.query(`CREATE INDEX IF NOT EXISTS idx_procurement_quotes_raw_material ON procurement_quotes(raw_material_id)`),
        sql.query(`CREATE INDEX IF NOT EXISTS idx_procurement_quotes_packaging ON procurement_quotes(packaging_material_id)`),
        sql.query(`CREATE INDEX IF NOT EXISTS idx_procurement_offers_quote ON procurement_supplier_offers(quote_id)`),
        sql.query(`CREATE INDEX IF NOT EXISTS idx_procurement_offers_supplier ON procurement_supplier_offers(supplier_id)`),
        sql.query(`CREATE INDEX IF NOT EXISTS idx_procurement_performance_supplier ON procurement_supplier_performance(supplier_id)`)
      ]);
    })().catch((error) => {
      globalForProcurement.vitaPowerProcurementSchema = undefined;
      throw error;
    });
  }
  await globalForProcurement.vitaPowerProcurementSchema;
}

export async function listProcurementItems(): Promise<ProcurementItemOption[]> {
  await ensureProcurementSchema();
  const rows = await getSql().query(`
    SELECT id, 'raw_material'::text AS type, internal_code AS code, name, category,
      'kg'::text AS default_unit,
      CONCAT_WS(' · ', NULLIF(manufacturer,''), NULLIF(concentration_purity,''), NULLIF(origin_country,''), NULLIF(technical_specification,'')) AS specification
    FROM raw_materials WHERE status = 'Ativo'
    UNION ALL
    SELECT id, 'packaging'::text AS type, internal_code AS code, name, category,
      'un'::text AS default_unit,
      CONCAT_WS(' · ', NULLIF(material,''), NULLIF(dimensions,''), NULLIF(capacity,''), NULLIF(color,''), NULLIF(technical_specification,'')) AS specification
    FROM packaging_materials WHERE status = 'Ativo'
    ORDER BY type, name
  `) as unknown as Array<{ id: number; type: ProcurementItemType; code: string; name: string; category: string | null; default_unit: "kg" | "un"; specification: string | null }>;
  return rows.map((row) => ({ id: Number(row.id), type: row.type, code: row.code, name: row.name, category: row.category, defaultUnit: row.default_unit, specification: row.specification || null }));
}

export async function listProcurementSuppliers(): Promise<ProcurementSupplier[]> {
  await ensureProcurementSchema();
  const rows = await getSql().query(`
    SELECT s.id, s.name, s.contact_name, s.email, s.phone, s.category, s.document, s.website, s.notes, s.active,
      COUNT(DISTINCT o.id)::int AS offer_count,
      COUNT(DISTINCT po.id)::int AS purchase_count,
      AVG(p.quality_score)::float8 AS average_quality,
      AVG(p.delivery_score)::float8 AS average_delivery,
      AVG(p.commercial_score)::float8 AS average_commercial
    FROM engineering_suppliers s
    LEFT JOIN procurement_supplier_offers o ON o.supplier_id = s.id
    LEFT JOIN procurement_purchase_orders po ON po.supplier_id = s.id AND po.status = 'compra_realizada'
    LEFT JOIN procurement_supplier_performance p ON p.supplier_id = s.id
    GROUP BY s.id
    ORDER BY s.active DESC, s.name ASC
  `) as unknown as Array<Record<string, unknown>>;
  return rows.map((row) => ({
    id: Number(row.id), name: String(row.name), contactName: row.contact_name ? String(row.contact_name) : null,
    email: row.email ? String(row.email) : null, phone: row.phone ? String(row.phone) : null,
    category: row.category ? String(row.category) : null, document: row.document ? String(row.document) : null,
    website: row.website ? String(row.website) : null, notes: row.notes ? String(row.notes) : null,
    active: Boolean(row.active), offerCount: Number(row.offer_count), purchaseCount: Number(row.purchase_count),
    averageQuality: row.average_quality === null ? null : Number(row.average_quality),
    averageDelivery: row.average_delivery === null ? null : Number(row.average_delivery),
    averageCommercial: row.average_commercial === null ? null : Number(row.average_commercial)
  }));
}

export async function createProcurementSupplier(input: {
  name: string; contactName?: string | null; email?: string | null; phone?: string | null;
  category?: string | null; document?: string | null; website?: string | null; notes?: string | null;
}) {
  await ensureProcurementSchema();
  const [row] = await getSql().query(
    `INSERT INTO engineering_suppliers (name, contact_name, email, phone, category, document, website, notes, active)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,TRUE)
     ON CONFLICT (name) DO UPDATE SET contact_name = COALESCE(EXCLUDED.contact_name, engineering_suppliers.contact_name),
       email = COALESCE(EXCLUDED.email, engineering_suppliers.email), phone = COALESCE(EXCLUDED.phone, engineering_suppliers.phone),
       category = COALESCE(EXCLUDED.category, engineering_suppliers.category), document = COALESCE(EXCLUDED.document, engineering_suppliers.document),
       website = COALESCE(EXCLUDED.website, engineering_suppliers.website), notes = COALESCE(EXCLUDED.notes, engineering_suppliers.notes), active = TRUE
     RETURNING id`,
    [required(input.name, "Nome do fornecedor"), optional(input.contactName), optional(input.email), optional(input.phone), optional(input.category), optional(input.document), optional(input.website), optional(input.notes)]
  ) as unknown as Array<{ id: number }>;
  return Number(row.id);
}

export async function listProcurementQuotes(filters?: { status?: string | null; search?: string | null }): Promise<ProcurementQuote[]> {
  await ensureProcurementSchema();
  const status = procurementStatuses.includes(filters?.status as ProcurementStatus) ? filters?.status : null;
  const search = optional(filters?.search);
  const rows = await getSql().query(`
    SELECT q.id, q.title, q.item_type,
      CASE WHEN q.item_type = 'raw_material' THEN q.raw_material_id ELSE q.packaging_material_id END AS item_id,
      COALESCE(rm.internal_code, pm.internal_code) AS item_code,
      COALESCE(rm.name, pm.name) AS item_name,
      COALESCE(rm.category, pm.category) AS item_category,
      q.requested_quantity::float8, q.normalized_unit, q.priority, q.required_by::text,
      q.status, q.source, q.pcp_reference, q.notes, q.awarded_offer_id,
      winner.name AS awarded_supplier_name,
      COUNT(o.id)::int AS offer_count,
      MIN(o.landed_unit_cost)::float8 AS best_landed_unit_cost,
      AVG(o.landed_unit_cost)::float8 AS average_landed_unit_cost,
      COALESCE(SUM(GREATEST(COALESCE(o.initial_unit_price, o.unit_price) - o.unit_price, 0) * o.quoted_quantity), 0)::float8 AS total_negotiated_savings,
      q.created_at, q.updated_at
    FROM procurement_quotes q
    LEFT JOIN raw_materials rm ON rm.id = q.raw_material_id
    LEFT JOIN packaging_materials pm ON pm.id = q.packaging_material_id
    LEFT JOIN procurement_supplier_offers o ON o.quote_id = q.id
    LEFT JOIN procurement_supplier_offers wo ON wo.id = q.awarded_offer_id
    LEFT JOIN engineering_suppliers winner ON winner.id = wo.supplier_id
    WHERE ($1::text IS NULL OR q.status = $1)
      AND ($2::text IS NULL OR q.title ILIKE '%' || $2 || '%' OR COALESCE(rm.name, pm.name) ILIKE '%' || $2 || '%' OR COALESCE(q.pcp_reference,'') ILIKE '%' || $2 || '%')
    GROUP BY q.id, rm.internal_code, pm.internal_code, rm.name, pm.name, rm.category, pm.category, winner.name
    ORDER BY CASE q.priority WHEN 'Urgente' THEN 1 WHEN 'Alta' THEN 2 WHEN 'Normal' THEN 3 ELSE 4 END,
      q.updated_at DESC, q.id DESC
  `, [status, search]) as unknown as Array<Record<string, unknown>>;
  return rows.map((row) => ({
    id: Number(row.id), title: String(row.title), itemType: row.item_type as ProcurementItemType, itemId: Number(row.item_id),
    itemCode: String(row.item_code), itemName: String(row.item_name), itemCategory: row.item_category ? String(row.item_category) : null,
    requestedQuantity: Number(row.requested_quantity), normalizedUnit: row.normalized_unit as "kg" | "un",
    priority: row.priority as ProcurementQuote["priority"], requiredBy: row.required_by ? String(row.required_by) : null,
    status: row.status as ProcurementStatus, source: row.source as "manual" | "pcp", pcpReference: row.pcp_reference ? String(row.pcp_reference) : null,
    notes: row.notes ? String(row.notes) : null, awardedOfferId: row.awarded_offer_id === null ? null : Number(row.awarded_offer_id),
    awardedSupplierName: row.awarded_supplier_name ? String(row.awarded_supplier_name) : null,
    offerCount: Number(row.offer_count), bestLandedUnitCost: row.best_landed_unit_cost === null ? null : Number(row.best_landed_unit_cost),
    averageLandedUnitCost: row.average_landed_unit_cost === null ? null : Number(row.average_landed_unit_cost),
    totalNegotiatedSavings: Number(row.total_negotiated_savings), createdAt: iso(row.created_at as string | Date), updatedAt: iso(row.updated_at as string | Date)
  }));
}

export async function getProcurementQuote(quoteId: number) {
  return (await listProcurementQuotes()).find((quote) => quote.id === quoteId) ?? null;
}

export async function createProcurementQuote(input: {
  title: string; itemType: ProcurementItemType; itemId: number; requestedQuantity: number; normalizedUnit: "kg" | "un";
  priority: ProcurementQuote["priority"]; requiredBy?: string | null; source: "manual" | "pcp"; pcpReference?: string | null;
  notes?: string | null; createdByMemberId: number;
}) {
  await ensureProcurementSchema();
  const quantity = Number(input.requestedQuantity);
  if (!Number.isFinite(quantity) || quantity <= 0) throw new Error("Informe uma quantidade válida.");
  const [row] = await getSql().query(
    `INSERT INTO procurement_quotes (title, item_type, raw_material_id, packaging_material_id, requested_quantity, normalized_unit, priority, required_by, status, source, pcp_reference, notes, created_by_member_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'Cotando',$9,$10,$11,$12) RETURNING id`,
    [required(input.title, "Título"), input.itemType, input.itemType === "raw_material" ? input.itemId : null, input.itemType === "packaging" ? input.itemId : null,
      quantity, input.normalizedUnit, input.priority, optional(input.requiredBy), input.source, optional(input.pcpReference), optional(input.notes), input.createdByMemberId]
  ) as unknown as Array<{ id: number }>;
  return Number(row.id);
}

export async function listSupplierOffers(quoteId: number): Promise<SupplierOffer[]> {
  await ensureProcurementSchema();
  const rows = await getSql().query(`
    SELECT o.*, s.name AS supplier_name,
      (SELECT previous.normalized_unit_cost::float8
       FROM procurement_supplier_offers previous
       INNER JOIN procurement_quotes previous_quote ON previous_quote.id = previous.quote_id
       INNER JOIN procurement_quotes current_quote ON current_quote.id = o.quote_id
       WHERE previous.supplier_id = o.supplier_id AND previous.id <> o.id
         AND previous.created_at < o.created_at
         AND previous_quote.item_type = current_quote.item_type
         AND COALESCE(previous_quote.raw_material_id, -1) = COALESCE(current_quote.raw_material_id, -1)
         AND COALESCE(previous_quote.packaging_material_id, -1) = COALESCE(current_quote.packaging_material_id, -1)
       ORDER BY previous.created_at DESC LIMIT 1) AS previous_normalized_unit_cost,
      (SELECT COUNT(*)::int FROM procurement_offer_attachments a WHERE a.offer_id = o.id) AS attachment_count
    FROM procurement_supplier_offers o
    INNER JOIN engineering_suppliers s ON s.id = o.supplier_id
    WHERE o.quote_id = $1
    ORDER BY o.landed_unit_cost ASC NULLS LAST, o.unit_price ASC, o.created_at DESC
  `, [quoteId]) as unknown as Array<Record<string, unknown>>;
  return rows.map((row) => {
    const previous = row.previous_normalized_unit_cost === null ? null : Number(row.previous_normalized_unit_cost);
    const current = Number(row.normalized_unit_cost);
    return {
      id: Number(row.id), quoteId: Number(row.quote_id), supplierId: Number(row.supplier_id), supplierName: String(row.supplier_name),
      reference: row.reference ? String(row.reference) : null, quotedQuantity: Number(row.quoted_quantity), purchaseUnit: String(row.purchase_unit),
      unitsPerPurchaseUnit: Number(row.units_per_purchase_unit), initialUnitPrice: row.initial_unit_price === null ? null : Number(row.initial_unit_price),
      unitPrice: Number(row.unit_price), normalizedUnitCost: current, freightCost: row.freight_cost === null ? null : Number(row.freight_cost),
      taxPercent: Number(row.tax_percent), taxAmount: Number(row.tax_amount), otherCost: Number(row.other_cost), discountAmount: Number(row.discount_amount),
      landedTotal: row.landed_total === null ? null : Number(row.landed_total), landedUnitCost: row.landed_unit_cost === null ? null : Number(row.landed_unit_cost),
      moq: Number(row.moq), paymentTerms: row.payment_terms ? String(row.payment_terms) : null, leadTimeDays: Number(row.lead_time_days),
      quoteDate: String(row.quote_date), validUntil: row.valid_until ? String(row.valid_until) : null, manufacturer: row.manufacturer ? String(row.manufacturer) : null,
      distributor: row.distributor ? String(row.distributor) : null, concentrationPurity: row.concentration_purity ? String(row.concentration_purity) : null,
      origin: row.origin ? String(row.origin) : null, minimumShelfLife: row.minimum_shelf_life ? String(row.minimum_shelf_life) : null,
      notes: row.notes ? String(row.notes) : null, previousNormalizedUnitCost: previous,
      priceVariationPercent: previous && previous > 0 ? ((current - previous) / previous) * 100 : null,
      negotiatedSavings: calculateSavings(row.initial_unit_price === null ? null : Number(row.initial_unit_price), Number(row.unit_price), Number(row.quoted_quantity)),
      attachmentCount: Number(row.attachment_count), createdAt: iso(row.created_at as string | Date)
    };
  });
}

export async function createSupplierOffer(input: {
  quoteId: number; supplierId: number; reference?: string | null; quotedQuantity: number; purchaseUnit: string;
  unitsPerPurchaseUnit: number; initialUnitPrice?: number | null; unitPrice: number; freightCost: number | null;
  taxPercent: number; taxAmount: number; otherCost: number; discountAmount: number; moq: number; paymentTerms?: string | null;
  leadTimeDays: number; quoteDate: string; validUntil?: string | null; manufacturer?: string | null; distributor?: string | null;
  concentrationPurity?: string | null; origin?: string | null; minimumShelfLife?: string | null; notes?: string | null; createdByMemberId: number;
}) {
  await ensureProcurementSchema();
  const result = calculateLandedCost({ quotedQuantity: input.quotedQuantity, purchaseUnitPrice: input.unitPrice, unitsPerPurchaseUnit: input.unitsPerPurchaseUnit,
    freightCost: input.freightCost, taxPercent: input.taxPercent, taxAmount: input.taxAmount, otherCost: input.otherCost, discountAmount: input.discountAmount });
  const [row] = await getSql().query(
    `WITH inserted AS (
       INSERT INTO procurement_supplier_offers (quote_id, supplier_id, reference, quoted_quantity, purchase_unit, units_per_purchase_unit,
         initial_unit_price, unit_price, normalized_unit_cost, freight_cost, tax_percent, tax_amount, other_cost, discount_amount,
         landed_total, landed_unit_cost, moq, payment_terms, lead_time_days, quote_date, valid_until, manufacturer, distributor,
         concentration_purity, origin, minimum_shelf_life, notes, created_by_member_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28)
       RETURNING id
     ), updated AS (
       UPDATE procurement_quotes SET status = CASE WHEN status IN ('Cotando','Aguardando fornecedor') THEN 'Recebida' ELSE status END, updated_at = NOW()
       WHERE id = $1 RETURNING id
     ) SELECT id FROM inserted`,
    [input.quoteId, input.supplierId, optional(input.reference), input.quotedQuantity, required(input.purchaseUnit, "Unidade de compra"), input.unitsPerPurchaseUnit || 1,
      input.initialUnitPrice || null, input.unitPrice, result.normalizedUnitCost, input.freightCost, input.taxPercent || 0, result.calculatedTax,
      input.otherCost || 0, input.discountAmount || 0, result.landedTotal, result.landedUnitCost, input.moq || 0, optional(input.paymentTerms),
      input.leadTimeDays || 0, input.quoteDate || new Date().toISOString().slice(0, 10), optional(input.validUntil), optional(input.manufacturer), optional(input.distributor),
      optional(input.concentrationPurity), optional(input.origin), optional(input.minimumShelfLife), optional(input.notes), input.createdByMemberId]
  ) as unknown as Array<{ id: number }>;
  return Number(row.id);
}

export async function updateProcurementQuoteStatus(quoteId: number, status: ProcurementStatus) {
  await ensureProcurementSchema();
  if (!procurementStatuses.includes(status)) throw new Error("Status inválido.");
  await getSql().query(`UPDATE procurement_quotes SET status = $2, updated_at = NOW() WHERE id = $1`, [quoteId, status]);
}

export async function approveSupplierOffer(quoteId: number, offerId: number, memberId: number) {
  await ensureProcurementSchema();
  const rows = await getSql().query(
    `WITH selected AS (
       SELECT o.id, o.supplier_id, o.landed_total, q.pcp_reference FROM procurement_supplier_offers o
       INNER JOIN procurement_quotes q ON q.id = o.quote_id WHERE o.id = $2 AND o.quote_id = $1
     ), updated AS (
       UPDATE procurement_quotes SET awarded_offer_id = $2, status = 'Aprovada', updated_at = NOW()
       WHERE id = $1 AND EXISTS (SELECT 1 FROM selected) RETURNING id
     )
     INSERT INTO procurement_purchase_orders (quote_id, offer_id, supplier_id, total, status, pcp_reference, created_by_member_id)
     SELECT $1, selected.id, selected.supplier_id, selected.landed_total, 'aprovada', selected.pcp_reference, $3 FROM selected
     ON CONFLICT (quote_id) DO UPDATE SET offer_id = EXCLUDED.offer_id, supplier_id = EXCLUDED.supplier_id,
       total = EXCLUDED.total, status = 'aprovada', updated_at = NOW()
     RETURNING id`,
    [quoteId, offerId, memberId]
  ) as unknown as Array<{ id: number }>;
  if (!rows.length) throw new Error("Proposta não encontrada nesta cotação.");
}

export async function markPurchaseCompleted(input: { quoteId: number; purchaseReference?: string | null; blingPurchaseOrderId?: string | null }) {
  await ensureProcurementSchema();
  const rows = await getSql().query(
    `WITH updated_order AS (
       UPDATE procurement_purchase_orders SET status = 'compra_realizada', purchase_reference = $2,
         bling_purchase_order_id = $3,
         bling_sync_status = CASE WHEN $3::text IS NULL THEN 'aguardando_conector' ELSE 'sincronizada' END,
         purchased_at = NOW(), updated_at = NOW() WHERE quote_id = $1 RETURNING id
     )
     UPDATE procurement_quotes SET status = 'Compra realizada', updated_at = NOW()
     WHERE id = $1 AND EXISTS (SELECT 1 FROM updated_order) RETURNING id`,
    [input.quoteId, optional(input.purchaseReference), optional(input.blingPurchaseOrderId)]
  ) as unknown as Array<{ id: number }>;
  if (!rows.length) throw new Error("A cotação precisa ter uma proposta aprovada antes da compra.");
}

export async function addSupplierPerformance(input: {
  supplierId: number; purchaseOrderId?: number | null; qualityScore: number; deliveryScore: number; commercialScore: number;
  deliveredOnTime?: boolean | null; nonconformityCount: number; notes?: string | null; memberId: number;
}) {
  await ensureProcurementSchema();
  await getSql().query(
    `INSERT INTO procurement_supplier_performance (supplier_id, purchase_order_id, quality_score, delivery_score, commercial_score,
      delivered_on_time, nonconformity_count, notes, evaluated_by_member_id) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
    [input.supplierId, input.purchaseOrderId || null, input.qualityScore, input.deliveryScore, input.commercialScore,
      input.deliveredOnTime ?? null, Math.max(0, input.nonconformityCount || 0), optional(input.notes), input.memberId]
  );
}

export async function saveOfferAttachment(input: { offerId: number; fileName: string; contentType: string; contentBase64: string; sizeBytes: number; memberId: number }) {
  await ensureProcurementSchema();
  await getSql().query(
    `INSERT INTO procurement_offer_attachments (offer_id, file_name, content_type, size_bytes, content, created_by_member_id)
     VALUES ($1,$2,$3,$4,decode($5,'base64'),$6)`,
    [input.offerId, input.fileName, input.contentType, input.sizeBytes, input.contentBase64, input.memberId]
  );
}

export async function listOfferAttachments(quoteId: number): Promise<ProcurementAttachment[]> {
  await ensureProcurementSchema();
  const rows = await getSql().query(`
    SELECT a.id, a.offer_id, a.file_name, a.content_type, a.size_bytes, a.created_at
    FROM procurement_offer_attachments a
    INNER JOIN procurement_supplier_offers o ON o.id = a.offer_id
    WHERE o.quote_id = $1 ORDER BY a.created_at DESC
  `, [quoteId]) as unknown as Array<Record<string, unknown>>;
  return rows.map((row) => ({ id: Number(row.id), offerId: Number(row.offer_id), fileName: String(row.file_name), contentType: String(row.content_type), sizeBytes: Number(row.size_bytes), createdAt: iso(row.created_at as string | Date) }));
}

export async function getOfferAttachment(attachmentId: number) {
  await ensureProcurementSchema();
  const [row] = await getSql().query(
    `SELECT id, file_name, content_type, size_bytes, encode(content,'base64') AS content_base64
     FROM procurement_offer_attachments WHERE id = $1`, [attachmentId]
  ) as unknown as Array<{ id: number; file_name: string; content_type: string; size_bytes: number; content_base64: string }>;
  return row ? { id: Number(row.id), fileName: row.file_name, contentType: row.content_type, sizeBytes: Number(row.size_bytes), contentBase64: row.content_base64 } : null;
}

export async function getProcurementDashboard(): Promise<ProcurementDashboard> {
  await ensureProcurementSchema();
  const [row] = await getSql().query(`
    SELECT
      COUNT(*) FILTER (WHERE status NOT IN ('Compra realizada','Descartada'))::int AS open_quotes,
      COUNT(*) FILTER (WHERE status = 'Aguardando fornecedor')::int AS awaiting_supplier,
      COUNT(*) FILTER (WHERE status IN ('Recebida','Em negociação'))::int AS received_offers,
      COUNT(*) FILTER (WHERE status = 'Aprovada')::int AS approved_quotes,
      COUNT(*) FILTER (WHERE status = 'Compra realizada')::int AS purchased_quotes,
      COALESCE((SELECT SUM(GREATEST(COALESCE(o.initial_unit_price, o.unit_price) - o.unit_price, 0) * o.quoted_quantity)
        FROM procurement_supplier_offers o), 0)::float8 AS negotiated_savings
    FROM procurement_quotes
  `) as unknown as Array<Record<string, unknown>>;
  return { openQuotes: Number(row.open_quotes), awaitingSupplier: Number(row.awaiting_supplier), receivedOffers: Number(row.received_offers),
    approvedQuotes: Number(row.approved_quotes), purchasedQuotes: Number(row.purchased_quotes), negotiatedSavings: Number(row.negotiated_savings) };
}

export async function getPurchaseOrderByQuote(quoteId: number) {
  await ensureProcurementSchema();
  const [row] = await getSql().query(`SELECT id, supplier_id, status, purchase_reference, bling_purchase_order_id, bling_sync_status, purchased_at::text FROM procurement_purchase_orders WHERE quote_id = $1`, [quoteId]) as unknown as Array<Record<string, unknown>>;
  return row ? { id: Number(row.id), supplierId: Number(row.supplier_id), status: String(row.status), purchaseReference: row.purchase_reference ? String(row.purchase_reference) : null,
    blingPurchaseOrderId: row.bling_purchase_order_id ? String(row.bling_purchase_order_id) : null, blingSyncStatus: String(row.bling_sync_status), purchasedAt: row.purchased_at ? String(row.purchased_at) : null } : null;
}
