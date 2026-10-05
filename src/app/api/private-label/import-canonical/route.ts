import { timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { ensureSchema, getSql } from '@/lib/db';

export const dynamic = 'force-dynamic';

function authorized(request: Request) {
  const supplied = Buffer.from(request.headers.get('x-central-token') || '');
  const expected = Buffer.from(process.env.PL_CENTRAL_TOKEN || '');
  return supplied.length > 0 && supplied.length === expected.length && timingSafeEqual(supplied, expected);
}

function required(value: unknown, max = 5000) {
  if (typeof value !== 'string' || !value.trim() || value.length > max) throw new Error('Texto obrigatório inválido.');
  return value.trim();
}

function optional(value: unknown, max = 5000) {
  if (value == null || value === '') return null;
  if (typeof value !== 'string' || value.length > max) throw new Error('Texto opcional inválido.');
  return value.trim() || null;
}

export async function POST(request: Request) {
  try {
    if (!authorized(request)) return NextResponse.json({error:'Não autorizado.'},{status:401});
    const raw = await request.text();
    if (new TextEncoder().encode(raw).byteLength > 200000) return NextResponse.json({error:'Payload muito grande.'},{status:413});
    const input = JSON.parse(raw) as {records?: unknown[]};
    if (!Array.isArray(input.records) || input.records.length < 1 || input.records.length > 30) throw new Error('Registros inválidos.');

    await ensureSchema();
    const sql = getSql();
    await sql.query('ALTER TABLE engineering_projects ADD COLUMN IF NOT EXISTS central_creation_key uuid');
    await sql.query('CREATE UNIQUE INDEX IF NOT EXISTS engineering_projects_central_key ON engineering_projects(central_creation_key)');
    const actorRows = await sql.query(`SELECT id,name FROM workspace_members WHERE LOWER(email)=LOWER($1) AND active=true LIMIT 1`,['andrew@vitapowernutrition.com.br']) as unknown as Array<{id:number;name:string}>;
    if (!actorRows.length) throw new Error('Responsável Andrew não encontrado.');

    const results=[];
    for (const entry of input.records as Array<Record<string,unknown>>) {
      const key=required(entry.key,100);
      const client=entry.client as Record<string,unknown>;
      const project=entry.project as Record<string,unknown>;
      const products=entry.products as Array<Record<string,unknown>>;
      if (!client || !project || !Array.isArray(products) || products.length<1 || products.length>50) throw new Error('Estrutura de cadastro inválida.');
      const brandName=required(client.brandName,300);
      let clientRows=await sql.query(`SELECT * FROM clients WHERE LOWER(brand_name)=LOWER($1) LIMIT 1`,[brandName]) as unknown as Array<Record<string,unknown>>;
      if (clientRows.length) {
        clientRows=await sql.query(`UPDATE clients SET legal_name=COALESCE(NULLIF($2,''),legal_name),tax_id=COALESCE(NULLIF($3,''),tax_id),contact_name=COALESCE(NULLIF($4,''),contact_name),email=COALESCE(NULLIF($5,''),email),phone=COALESCE(NULLIF($6,''),phone),active=true WHERE id=$1 RETURNING *`,[clientRows[0].id,optional(client.legalName,300)||'',optional(client.taxId,100)||'',optional(client.contactName,300)||'',optional(client.email,300)||'',optional(client.phone,100)||'']) as unknown as Array<Record<string,unknown>>;
      } else {
        clientRows=await sql.query(`INSERT INTO clients(brand_name,legal_name,tax_id,contact_name,email,phone,active) VALUES($1,$2,$3,$4,$5,$6,true) RETURNING *`,[brandName,optional(client.legalName,300)||brandName,optional(client.taxId,100),optional(client.contactName,300),optional(client.email,300),optional(client.phone,100)]) as unknown as Array<Record<string,unknown>>;
      }
      const clientRow=clientRows[0];
      const productRows=[];
      for (const product of products) {
        const rows=await sql.query(`INSERT INTO products(client_id,sku,name,category,description,formula_version,active) VALUES($1,$2,$3,$4,$5,$6,true) ON CONFLICT(client_id,sku) DO UPDATE SET name=EXCLUDED.name,category=EXCLUDED.category,description=EXCLUDED.description,formula_version=EXCLUDED.formula_version,active=true RETURNING *`,[clientRow.id,required(product.sku,200),required(product.name,300),optional(product.category,300),optional(product.description),optional(product.formulaVersion,300)]) as unknown as Array<Record<string,unknown>>;
        productRows.push(rows[0]);
      }
      const projectName=required(project.name,500);
      let projectRows=await sql.query(`SELECT * FROM engineering_projects WHERE client_id=$1 AND LOWER(name)=LOWER($2) ORDER BY id LIMIT 1`,[clientRow.id,projectName]) as unknown as Array<Record<string,unknown>>;
      if (projectRows.length) projectRows=await sql.query(`UPDATE engineering_projects SET product_id=COALESCE(product_id,$2),briefing=$3 WHERE id=$1 RETURNING *`,[projectRows[0].id,productRows[0].id,optional(project.briefing)]) as unknown as Array<Record<string,unknown>>;
      else projectRows=await sql.query(`INSERT INTO engineering_projects(client_id,product_id,name,status,briefing) VALUES($1,$2,$3,'briefing',$4) RETURNING *`,[clientRow.id,productRows[0].id,projectName,optional(project.briefing)]) as unknown as Array<Record<string,unknown>>;
      results.push({key,client:clientRow,products:productRows,project:projectRows[0]});
    }
    return NextResponse.json({actor:actorRows[0],records:results},{headers:{'Cache-Control':'no-store'}});
  } catch(error) {
    return NextResponse.json({error:error instanceof Error?error.message:'Falha na importação.'},{status:400,headers:{'Cache-Control':'no-store'}});
  }
}
