import 'server-only';
import { ensureSchema, getSql } from '@/lib/db';
import { listActiveClients, listActiveProducts } from '@/lib/repository';
import { listPrivateLabelProjects } from '@/lib/private-label-repository';
import { listWorkspaceMembers } from '@/lib/workspace-members';
import { assertWorkspaceModule, assertWorkspaceWrite, canWriteWorkspace, WorkspaceAccessError } from '@/lib/workspace-auth';
import { defaultSettings, gateNames, isActive, lanes, productionIssues, phaseIssues, type CentralData, type Project, type Settings, type Preferences, type Event } from '@/lib/private-label-central-model';

type Document = {kind:'project'|'settings'|'preferences';id:string;payload:Record<string,unknown>;revision:number};
type Loaded = {documents:Document[];events:Event[]};
export class CentralError extends Error { constructor(message:string,public status=400){super(message);} }
async function remote<T>(body:unknown):Promise<T> {
  if(!process.env.PL_CENTRAL_URL || !process.env.PL_CENTRAL_TOKEN) throw new CentralError('A conexão da Central Private Label não está configurada.',503);
  const response=await fetch(process.env.PL_CENTRAL_URL,{method:'POST',cache:'no-store',headers:{'Content-Type':'application/json','x-central-token':process.env.PL_CENTRAL_TOKEN},body:JSON.stringify(body),signal:AbortSignal.timeout(20000)});
  const data=await response.json();
  if(!response.ok) throw new CentralError(response.status===409?'Outra pessoa alterou este registro. Atualize antes de salvar.':'Não foi possível salvar ou carregar o banco da Central.',response.status===409?409:503);
  return data as T;
}
export const sourceStageLabels:Record<string,string>={briefing:'Briefing',formula:'Desenvolvimento',embalagem:'Arte / Embalagem',precificacao:'Precificação',proposta:'Proposta',aprovado:'Aprovado',producao:'Produção',lote:'Controle de Qualidade',entregue:'Entregue'};
export async function loadCentral():Promise<CentralData> {
  const session=await assertWorkspaceModule('private_label');
  const [canonical,clients,products,members,saved]=await Promise.all([listPrivateLabelProjects(),listActiveClients(),listActiveProducts(),listWorkspaceMembers({activeOnly:true}),remote<Loaded>({action:'load'})]);
  const settingsDoc=saved.documents.find(d=>d.kind==='settings');
  const preferencesDoc=saved.documents.find(d=>d.kind==='preferences'&&d.id===String(session.member.id));
  const docs=new Map(saved.documents.filter(d=>d.kind==='project').map(d=>[d.id,d]));
  const projects=canonical.map(p=>{
    const doc=docs.get(String(p.id));
    const defaults:Project={id:Number(p.id),clientId:Number(p.clientId),client:p.clientBrandName,name:p.name,products:p.productName?[p.productName]:[],owner:'',priority:'Normal',due:'',stage:sourceStageLabels[p.stageId]||'Briefing',status:'Ativo',waiting:'',waitingSince:'',nextAction:'',nextOwner:'',nextDue:'',createdAt:p.createdAt,items:[],gates:Object.fromEntries(gateNames.map(g=>[g,false])),tracks:{},potential:0,closed:0,revision:0,sourceStage:p.stageId,sourceProductId:p.productId};
    return {...defaults,...doc?.payload,id:Number(p.id),clientId:Number(p.clientId),client:p.clientBrandName,name:p.name,revision:doc?.revision??0,sourceStage:p.stageId,sourceProductId:p.productId} as Project;
  });
  return {projects,clients:clients.map(c=>({id:c.id,brandName:c.brandName})),products:products.map(p=>({id:p.id,clientId:p.clientId,name:p.name})),members:members.map(m=>({id:m.id,name:m.name})),settings:settingsDoc?.payload as unknown as Settings??defaultSettings,settingsRevision:settingsDoc?.revision??0,preferences:preferencesDoc?.payload as unknown as Preferences??{favorites:[],views:[]},preferencesRevision:preferencesDoc?.revision??0,events:saved.events,actor:{id:session.member.id,name:session.member.name,canWrite:canWriteWorkspace(session.member),canConfigure:['admin','gestor'].includes(session.member.accessLevel)},loadedAt:new Date().toISOString()};
}
function date(value:unknown){ if(typeof value!=='string')throw new CentralError('Data inválida.');if(value){const parsed=new Date(value+'T12:00:00Z');if(!/^\d{4}-\d{2}-\d{2}$/.test(value)||!Number.isFinite(parsed.getTime())||parsed.toISOString().slice(0,10)!==value)throw new CentralError('Data inválida.');} }
function text(value:unknown,max=5000){if(typeof value!=='string'||value.length>max)throw new CentralError('Texto inválido ou muito longo.');}
export function validateProject(p:Project,s:Settings) {
  if(!s.stages.includes(p.stage)||!['Ativo','Bloqueado','Em espera','Cancelado'].includes(p.status)||!['Baixa','Normal','Alta','Urgente'].includes(p.priority)||!['','Vita Power','Cliente','Fornecedor','Terceiros'].includes(p.waiting))throw new CentralError('Etapa ou situação inválida.');
  for(const key of ['owner','nextAction','nextOwner','waitingSince'] as const)text(p[key]);
  for(const key of ['due','nextDue','waitingSince'] as const)date(p[key]);
  if(isActive(p)&&(!p.nextAction.trim()||!p.nextOwner.trim()||!p.nextDue))throw new CentralError('Informe a próxima ação, o responsável e o prazo do projeto ativo.');
  if(p.waiting&&!p.waitingSince)throw new CentralError('Informe desde quando o projeto está aguardando.');
  if(!Array.isArray(p.products)||p.products.length>50||p.products.some(x=>typeof x!=='string'||x.length>300))throw new CentralError('Produtos inválidos.');
  if(!Number.isFinite(p.potential)||p.potential<0||!Number.isFinite(p.closed)||p.closed<0)throw new CentralError('Valores inválidos.');
  if(!Array.isArray(p.items)||p.items.length>500)throw new CentralError('Limite de 500 registros por projeto.');
  const ids=new Set<string>();
  for(const i of p.items){
    if(typeof i.id!=='string'||ids.has(i.id)||!i.id)throw new CentralError('Registro duplicado.');ids.add(i.id);
    if(!['Tarefa','Decisão','Aprovação','Amostra','Proposta','Follow-up','Bloqueio','Nota','Marco','Dependência','Documento','Atualização'].includes(i.kind)||!['Aberto','Concluído','Aprovado','Rejeitado'].includes(i.status)||!['Vita Power','Cliente','Fornecedor','Terceiros'].includes(i.party))throw new CentralError('Registro inválido.');
    for(const k of ['title','owner','category','version','impact','channel','person','url'] as const)text(i[k]);
    if(!i.title.trim())throw new CentralError('Informe o título.');
    for(const k of ['due','lastContact','planned','actual'] as const)date(i[k]);
    if(i.url&&!/^https?:\/\//.test(i.url))throw new CentralError('Use um link https ou http.');
    if(!Number.isFinite(i.value)||i.value<0||typeof i.productionCritical!=='boolean'||!Array.isArray(i.dependsOn))throw new CentralError('Dados do registro inválidos.');
    if(i.kind==='Aprovação'&&(!i.owner||!i.due||!i.version||!i.category))throw new CentralError('A aprovação precisa de categoria, versão, responsável e prazo.');
  }
  const byId=new Map(p.items.map(i=>[i.id,i])); const visiting=new Set<string>();const visited=new Set<string>();
  function walk(id:string){if(visiting.has(id))throw new CentralError('As dependências formam um ciclo.');if(visited.has(id))return;visiting.add(id);for(const dep of byId.get(id)?.dependsOn??[]){if(!byId.has(dep))throw new CentralError('Dependência não encontrada.');walk(dep);}visiting.delete(id);visited.add(id);}
  for(const id of ids)walk(id);
  for(const i of p.items){if(!['Aberto','Rejeitado'].includes(i.status)&&i.dependsOn.some(id=>['Aberto','Rejeitado'].includes(byId.get(id)!.status)))throw new CentralError('Conclua as dependências antes de liberar '+i.title);}
  if(!p.tracks||typeof p.tracks!=='object'||!p.gates||typeof p.gates!=='object'||Object.values(p.gates).some(x=>typeof x!=='boolean'))throw new CentralError('Checklist ou visão inválidos.');
  for(const [track,value]of Object.entries(p.tracks)){if(!Object.prototype.hasOwnProperty.call(lanes,track)||!lanes[track as keyof typeof lanes].includes(value))throw new CentralError('Etapa da visão específica inválida.');}
  for(const name of gateNames){if(typeof p.gates[name]!=='boolean')throw new CentralError('Checklist inválido.');}
}
export async function saveCentral(input:{kind:string;id:string;revision:number;payload:unknown;summary:string}) {
  const session=await assertWorkspaceWrite('private_label');
  const data=await loadCentral();
  if(!Number.isInteger(input.revision)||input.revision<0)throw new CentralError('Versão inválida.');
  text(input.summary,2000);if(!input.summary.trim())throw new CentralError('Informe a atualização.');
  let payload=input.payload;
  if(input.kind==='project'){
    const existing=data.projects.find(p=>String(p.id)===input.id);if(!existing)throw new CentralError('Projeto não encontrado.',404);
    const incoming=payload as Project;
    if(!incoming||typeof incoming!=='object')throw new CentralError('Projeto inválido.');
    const fixed={...incoming,id:existing.id,clientId:existing.clientId,client:existing.client,name:existing.name,createdAt:existing.createdAt,sourceStage:existing.sourceStage,sourceProductId:existing.sourceProductId};
    validateProject(fixed,data.settings);
    if(fixed.stage!==existing.stage&&phaseIssues(fixed,data.settings).length)throw new CentralError('Entrada na fase bloqueada por: '+phaseIssues(fixed,data.settings).join('; '));
    if(fixed.stage==='Produção'&&existing.stage!=='Produção'&&(fixed.status==='Bloqueado'||productionIssues(fixed).length))throw new CentralError('Produção bloqueada por: '+(productionIssues(fixed).join('; ')||fixed.status));
    fixed.items=fixed.items.map(i=>({...i,createdAt:existing.items.find(old=>old.id===i.id)?.createdAt||new Date().toISOString()}));
    payload=fixed;
  }else if(input.kind==='preferences'){
    if(input.id!==String(session.member.id))throw new WorkspaceAccessError();
    const p=payload as Preferences;
    if(!p||!Array.isArray(p.favorites)||p.favorites.some(x=>!Number.isSafeInteger(x))||!Array.isArray(p.views)||p.views.length>50||p.views.some(v=>typeof v.name!=='string'||v.name.length>120||typeof v.id!=='string'||!v.filters||Object.values(v.filters).some(x=>typeof x!=='string'||x.length>1000)))throw new CentralError('Visualização inválida.');
  }else if(input.kind==='settings'){
    if(!data.actor.canConfigure||input.id!=='global')throw new WorkspaceAccessError('Somente gestores podem configurar etapas.');
    const s=payload as Settings;
    if(!s||!Array.isArray(s.stages)||s.stages.length<2||s.stages.length>50||s.stages.some(x=>typeof x!=='string'||!x.trim()||x.length>80)||new Set(s.stages).size!==s.stages.length||!Number.isInteger(s.stallDays)||s.stallDays<1||s.stallDays>365)throw new CentralError('Configuração inválida.');
    if(data.projects.some(p=>!s.stages.includes(p.stage)))throw new CentralError('Mova os projetos antes de remover a etapa.');
    for(const stage of s.stages){const t=s.thresholds[stage];if(!t||!Number.isInteger(t.green)||!Number.isInteger(t.yellow)||t.green<0||t.yellow<t.green||t.yellow>365)throw new CentralError('Limites de alerta inválidos.');}
    if(s.phaseGates&&Object.entries(s.phaseGates).some(([stage,gates])=>!s.stages.includes(stage)||!Array.isArray(gates)||gates.length>30||gates.some(g=>typeof g!=='string'||!g.trim()||g.length>150)))throw new CentralError('Gates da fase inválidos.');
  }else throw new CentralError('Operação inválida.');
  const saved=await remote<{document:Document}>({action:'save',...input,payload,actorId:session.member.id,actorName:session.member.name});
  return saved.document;
}
export async function createCentralProject(input:{key:string;clientId:number;productId:number|null;name:string;nextAction:string;nextOwner:string;nextDue:string}) {
  await assertWorkspaceWrite('private_label');
  if(!/^[0-9a-f-]{36}$/.test(input.key))throw new CentralError('Identificador inválido.');
  for(const x of [input.name,input.nextAction,input.nextOwner]){text(x);if(!x.trim())throw new CentralError('Preencha projeto e próxima ação.');}date(input.nextDue);if(!input.nextDue)throw new CentralError('Prazo obrigatório.');
  const [clients,products]=await Promise.all([listActiveClients(),listActiveProducts()]);
  if(!clients.some(c=>c.id===input.clientId)||input.productId&&!products.some(p=>p.id===input.productId&&p.clientId===input.clientId))throw new CentralError('Cliente ou produto inválido.');
  await ensureSchema(); const sql=getSql();
  await sql.query('ALTER TABLE engineering_projects ADD COLUMN IF NOT EXISTS central_creation_key uuid');
  await sql.query('CREATE UNIQUE INDEX IF NOT EXISTS engineering_projects_central_key ON engineering_projects(central_creation_key)');
  const rows=await sql.query(`INSERT INTO engineering_projects(client_id,product_id,name,status,central_creation_key) VALUES($1,$2,$3,'briefing',$4::uuid) ON CONFLICT(central_creation_key) DO UPDATE SET central_creation_key=EXCLUDED.central_creation_key RETURNING id`,[input.clientId,input.productId,input.name,input.key]) as unknown as {id:number}[];
  const data=await loadCentral();const project=data.projects.find(p=>p.id===Number(rows[0].id))!;
  if(project.revision>0)return project.id;
  await saveCentral({kind:'project',id:String(project.id),revision:0,summary:'Projeto criado',payload:{...project,stage:data.settings.stages[0],owner:input.nextOwner,nextAction:input.nextAction,nextOwner:input.nextOwner,nextDue:input.nextDue}});
  return project.id;
}

export async function recordCentralIndustrialEvent(projectId:number,summary:string,patch:Partial<Project>={}){
  const session=await assertWorkspaceWrite('private_label');
  const data=await loadCentral();const p=data.projects.find(x=>x.id===projectId);if(!p)throw new CentralError('Projeto não encontrado.',404);
  // Imported legacy projects remain visible with missing-action alerts until the manager completes their next action.
  return remote({action:'save',kind:'project',id:String(projectId),revision:p.revision,payload:{...p,...patch},summary,actorId:session.member.id,actorName:session.member.name});
}
export async function assertCentralProductionReady(projectId:number){
  const data=await loadCentral();const p=data.projects.find(x=>x.id===projectId);if(!p)throw new CentralError('Projeto não encontrado.',404);
  const issues=productionIssues(p);if(p.status==='Bloqueado'||p.status==='Cancelado'||issues.length)throw new CentralError('Produção bloqueada por: '+(issues.join('; ')||p.status));
  if(!p.nextAction||!p.nextOwner||!p.nextDue)throw new CentralError('Defina a próxima ação, responsável e prazo antes de iniciar produção.');
}
