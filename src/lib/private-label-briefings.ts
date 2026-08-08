import { ensureSchema, getSql } from "@/lib/db";

type BriefingAnswers = Record<string, string | boolean>;

type BriefingRow = {
  id: number;
  submission_key: string;
  client_id: number | null;
  project_id: number | null;
  product_id: number | null;
  source: string;
  status: string;
  answers: BriefingAnswers | string;
  submitted_at: string | Date;
};

async function sqlQuery<T>(statement: string, params: unknown[] = []): Promise<T[]> {
  await ensureSchema();
  await ensurePrivateLabelBriefingSchema();
  return (await getSql().query(statement, params)) as unknown as T[];
}

let schemaPromise: Promise<void> | null = null;

export async function ensurePrivateLabelBriefingSchema() {
  if (!schemaPromise) {
    schemaPromise = (async () => {
      await ensureSchema();
      const sql = getSql();
      await sql.query(`
        CREATE TABLE IF NOT EXISTS private_label_briefings (
          id BIGSERIAL PRIMARY KEY,
          submission_key TEXT NOT NULL UNIQUE,
          client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,
          project_id INTEGER REFERENCES engineering_projects(id) ON DELETE SET NULL,
          product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
          source TEXT NOT NULL DEFAULT 'public_form',
          status TEXT NOT NULL DEFAULT 'processing',
          answers JSONB NOT NULL DEFAULT '{}'::jsonb,
          submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);
      await Promise.all([
        sql.query("CREATE INDEX IF NOT EXISTS idx_private_label_briefings_client ON private_label_briefings(client_id)"),
        sql.query("CREATE INDEX IF NOT EXISTS idx_private_label_briefings_project ON private_label_briefings(project_id)"),
        sql.query("CREATE INDEX IF NOT EXISTS idx_private_label_briefings_status ON private_label_briefings(status)")
      ]);
    })().catch((error) => {
      schemaPromise = null;
      throw error;
    });
  }

  await schemaPromise;
}

function text(answers: BriefingAnswers, key: string) {
  const value = answers[key];
  return typeof value === "string" ? value.trim() : value === true ? "Sim" : value === false ? "Não" : "";
}

function digits(value: string) {
  return value.replace(/\D/g, "");
}

function firstNonEmpty(...values: string[]) {
  return values.find((value) => value.trim())?.trim() ?? "";
}

function buildProductDescription(answers: BriefingAnswers) {
  const lines = [
    ["Objetivo", text(answers, "productPurpose") || text(answers, "projectObjective")],
    ["Diferencial", text(answers, "productDifferential")],
    ["Formato", text(answers, "format")],
    ["Peso/volume", text(answers, "netWeight")],
    ["Sabor", text(answers, "flavor")],
    ["Ingredientes desejados", text(answers, "activeIngredients")],
    ["Restrições", text(answers, "restrictions")],
    ["Claims", text(answers, "claims")]
  ].filter(([, value]) => value);
  return lines.map(([label, value]) => `${label}: ${value}`).join("\n");
}

function buildProjectBriefing(answers: BriefingAnswers) {
  const lines = [
    ["Marca", text(answers, "tradeName")],
    ["Site", text(answers, "website")],
    ["Instagram", text(answers, "instagram")],
    ["Objetivo do projeto", text(answers, "projectObjective")],
    ["Público", [text(answers, "audienceAge"), text(answers, "audienceGender"), text(answers, "audienceLocation")].filter(Boolean).join(" · ")],
    ["Estilo de vida", text(answers, "lifestyle")],
    ["Dores do público", text(answers, "audiencePains")],
    ["Benchmark", text(answers, "benchmark")],
    ["Quantidade", text(answers, "quantity")],
    ["Lançamento desejado", text(answers, "targetLaunch")],
    ["Canais de venda", text(answers, "salesChannels")],
    ["Embalagem", [text(answers, "primaryPackaging"), text(answers, "packagingMaterial"), text(answers, "packagingColor")].filter(Boolean).join(" · ")]
  ].filter(([, value]) => value);
  return lines.map(([label, value]) => `${label}: ${value}`).join("\n");
}

function parseAnswers(value: BriefingRow["answers"]): BriefingAnswers {
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as BriefingAnswers;
    } catch {
      return {};
    }
  }
  return value ?? {};
}

export async function submitPrivateLabelBriefing(input: {
  submissionKey: string;
  answers: BriefingAnswers;
  source?: string;
}) {
  const submissionKey = input.submissionKey.trim();
  if (!submissionKey) throw new Error("Identificador do envio não informado.");

  const answers = input.answers ?? {};
  const companyName = firstNonEmpty(text(answers, "companyName"), text(answers, "tradeName"));
  const brandName = firstNonEmpty(text(answers, "tradeName"), companyName);
  const contactName = text(answers, "contactName");
  const email = text(answers, "email");
  const phone = text(answers, "phone");
  const projectName = firstNonEmpty(text(answers, "projectName"), text(answers, "productName"));
  const productName = firstNonEmpty(text(answers, "productName"), text(answers, "category"));

  if (!companyName) throw new Error("Informe o nome da empresa ou marca.");
  if (!contactName) throw new Error("Informe o responsável pelo projeto.");
  if (!email && !phone) throw new Error("Informe um e-mail ou WhatsApp para contato.");
  if (!projectName) throw new Error("Informe o nome do projeto.");
  if (!productName) throw new Error("Informe o produto desejado.");

  await ensurePrivateLabelBriefingSchema();
  const sql = getSql();

  const existing = (await sql.query(
    `SELECT id, submission_key, client_id, project_id, product_id, source, status, answers, submitted_at
     FROM private_label_briefings WHERE submission_key = $1`,
    [submissionKey]
  )) as unknown as BriefingRow[];

  if (existing[0]?.project_id && existing[0]?.client_id) {
    return {
      briefingId: existing[0].id,
      clientId: existing[0].client_id,
      projectId: existing[0].project_id,
      productId: existing[0].product_id,
      alreadySubmitted: true
    };
  }

  let briefingId = existing[0]?.id;
  if (!briefingId) {
    const inserted = (await sql.query(
      `INSERT INTO private_label_briefings (submission_key, source, status, answers)
       VALUES ($1, $2, 'processing', $3::jsonb)
       ON CONFLICT (submission_key) DO NOTHING
       RETURNING id`,
      [submissionKey, input.source ?? "public_form", JSON.stringify(answers)]
    )) as unknown as { id: number }[];
    briefingId = inserted[0]?.id;

    if (!briefingId) {
      const raced = (await sql.query(
        `SELECT id, client_id, project_id, product_id FROM private_label_briefings WHERE submission_key = $1`,
        [submissionKey]
      )) as unknown as { id: number; client_id: number | null; project_id: number | null; product_id: number | null }[];
      if (raced[0]?.project_id && raced[0]?.client_id) {
        return {
          briefingId: raced[0].id,
          clientId: raced[0].client_id,
          projectId: raced[0].project_id,
          productId: raced[0].product_id,
          alreadySubmitted: true
        };
      }
      briefingId = raced[0]?.id;
    }
  }

  if (!briefingId) throw new Error("Não foi possível iniciar o registro do briefing.");

  const taxDigits = digits(text(answers, "document"));
  const phoneDigits = digits(phone);
  let clientId: number | null = null;

  if (taxDigits) {
    const rows = (await sql.query(
      `SELECT id FROM clients
       WHERE regexp_replace(COALESCE(tax_id, ''), '[^0-9]', '', 'g') = $1
       ORDER BY id ASC LIMIT 1`,
      [taxDigits]
    )) as unknown as { id: number }[];
    clientId = rows[0]?.id ?? null;
  }

  if (!clientId && email) {
    const rows = (await sql.query(
      `SELECT id FROM clients WHERE LOWER(COALESCE(email, '')) = LOWER($1) ORDER BY id ASC LIMIT 1`,
      [email]
    )) as unknown as { id: number }[];
    clientId = rows[0]?.id ?? null;
  }

  if (!clientId && phoneDigits) {
    const rows = (await sql.query(
      `SELECT id FROM clients
       WHERE regexp_replace(COALESCE(phone, ''), '[^0-9]', '', 'g') = $1
       ORDER BY id ASC LIMIT 1`,
      [phoneDigits]
    )) as unknown as { id: number }[];
    clientId = rows[0]?.id ?? null;
  }

  if (clientId) {
    await sql.query(
      `UPDATE clients SET
        brand_name = COALESCE(NULLIF($2, ''), brand_name),
        legal_name = COALESCE(NULLIF($3, ''), legal_name),
        tax_id = COALESCE(NULLIF($4, ''), tax_id),
        contact_name = COALESCE(NULLIF($5, ''), contact_name),
        email = COALESCE(NULLIF($6, ''), email),
        phone = COALESCE(NULLIF($7, ''), phone),
        active = TRUE
       WHERE id = $1`,
      [clientId, brandName, companyName, text(answers, "document"), contactName, email, phone]
    );
  } else {
    const insertedClient = (await sql.query(
      `INSERT INTO clients (brand_name, legal_name, tax_id, contact_name, email, phone, active)
       VALUES ($1, $2, NULLIF($3, ''), NULLIF($4, ''), NULLIF($5, ''), NULLIF($6, ''), TRUE)
       RETURNING id`,
      [brandName, companyName, text(answers, "document"), contactName, email, phone]
    )) as unknown as { id: number }[];
    clientId = insertedClient[0].id;
  }

  const provisionalSku = `PL-${submissionKey.replace(/[^a-zA-Z0-9]/g, "").slice(0, 12).toUpperCase()}`;
  const existingProduct = (await sql.query(
    `SELECT id FROM products WHERE client_id = $1 AND sku = $2 LIMIT 1`,
    [clientId, provisionalSku]
  )) as unknown as { id: number }[];

  let productId = existingProduct[0]?.id ?? null;
  if (!productId) {
    const insertedProduct = (await sql.query(
      `INSERT INTO products (client_id, sku, name, category, description, formula_version, active)
       VALUES ($1, $2, $3, NULLIF($4, ''), NULLIF($5, ''), 'Briefing', TRUE)
       RETURNING id`,
      [clientId, provisionalSku, productName, text(answers, "category"), buildProductDescription(answers)]
    )) as unknown as { id: number }[];
    productId = insertedProduct[0].id;
  }

  const existingProject = (await sql.query(
    `SELECT id FROM engineering_projects
     WHERE client_id = $1 AND product_id = $2 AND name = $3
     ORDER BY id ASC LIMIT 1`,
    [clientId, productId, projectName]
  )) as unknown as { id: number }[];

  let projectId = existingProject[0]?.id ?? null;
  if (!projectId) {
    const insertedProject = (await sql.query(
      `INSERT INTO engineering_projects (client_id, product_id, name, status, briefing)
       VALUES ($1, $2, $3, 'briefing', NULLIF($4, ''))
       RETURNING id`,
      [clientId, productId, projectName, buildProjectBriefing(answers)]
    )) as unknown as { id: number }[];
    projectId = insertedProject[0].id;
  }

  await sql.query(
    `UPDATE private_label_briefings SET
      client_id = $2,
      project_id = $3,
      product_id = $4,
      status = 'submitted',
      answers = $5::jsonb,
      updated_at = NOW()
     WHERE id = $1`,
    [briefingId, clientId, projectId, productId, JSON.stringify(answers)]
  );

  return { briefingId, clientId, projectId, productId, alreadySubmitted: false };
}

export async function listPrivateLabelBriefingsForClient(clientId: number) {
  const rows = await sqlQuery<BriefingRow>(
    `SELECT id, submission_key, client_id, project_id, product_id, source, status, answers, submitted_at
     FROM private_label_briefings WHERE client_id = $1 ORDER BY submitted_at DESC, id DESC`,
    [clientId]
  );

  return rows.map((row) => ({
    id: row.id,
    submissionKey: row.submission_key,
    clientId: row.client_id,
    projectId: row.project_id,
    productId: row.product_id,
    source: row.source,
    status: row.status,
    answers: parseAnswers(row.answers),
    submittedAt: row.submitted_at instanceof Date ? row.submitted_at.toISOString() : String(row.submitted_at)
  }));
}
