import { NextResponse } from 'next/server';
import { loadCentral, saveCentral, createCentralProject, CentralError } from '@/lib/private-label-central';
import { assertWorkspaceWrite, WorkspaceAccessError } from '@/lib/workspace-auth';
import { createClient } from '@/lib/repository';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'no-store'};
function failure(error:unknown){return NextResponse.json({error:error instanceof Error?error.message:'Não foi possível completar a operação.'},{status:error instanceof WorkspaceAccessError?403:error instanceof CentralError?error.status:500,headers});}
export async function GET(){try{return NextResponse.json(await loadCentral(),{headers});}catch(error){return failure(error);}}
export async function POST(request:Request){try{
  const origin=request.headers.get('origin');if(origin&&origin!==new URL(request.url).origin)return NextResponse.json({error:'Origem não autorizada.'},{status:403});
  await assertWorkspaceWrite('private_label');
  const raw=await request.text();if(new TextEncoder().encode(raw).byteLength>300000)throw new CentralError('Registro muito grande.',413);
  const input=JSON.parse(raw);
  if(input.action==='createProject'){const id=await createCentralProject(input.project);return NextResponse.json({id},{headers});}
  if(input.action==='createClient'){
    const c=input.client;if(!c||typeof c.brandName!=='string'||typeof c.legalName!=='string'||c.brandName.length>300||c.legalName.length>300)throw new CentralError('Cliente inválido.');
    const client=await createClient({brandName:c.brandName,legalName:c.legalName,contactName:c.contactName||null,email:c.email||null,phone:c.phone||null});if(!client)throw new CentralError('Cliente não encontrado após cadastro.',500);return NextResponse.json({id:client.id},{headers});
  }
  return NextResponse.json({document:await saveCentral(input)},{headers});
}catch(error){return failure(error);}}
