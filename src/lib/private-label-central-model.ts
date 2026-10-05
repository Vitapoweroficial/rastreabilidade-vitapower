export const stages = ['Novo Lead','Briefing','Desenvolvimento','Amostra','Aguardando Cliente','Precificação','Proposta','Negociação','Aprovado','Arte / Embalagem','Regulatório','Compras','Planejamento','Produção','Controle de Qualidade','Expedição','Entregue','Concluído'];
export const lanes = {
  Geral: stages,
  Comercial: ['Lead','Briefing','Precificação','Proposta','Negociação','Aprovado','Perdido'],
  Desenvolvimento: ['Formulação','Amostra','Enviada','Aguardando feedback','Ajustes','Aprovada'],
  Operacional: ['Aguardando insumos','Planejamento','Produção','Qualidade','Expedição','Entregue'],
  Arte: ['Aguardando arte','Arte recebida','Em revisão','Ajustes','Aguardando aprovação','Aprovada','Fornecedor']
};
export const gateNames = ['Fórmula aprovada','Amostra aprovada','Preço aprovado','Pedido fechado','Pagamento conforme condição','Rótulo aprovado','Regulatório concluído','Matéria-prima disponível','Embalagem disponível','OP criada'];
export type Party = 'Vita Power' | 'Cliente' | 'Fornecedor' | 'Terceiros';
export type ItemKind = 'Tarefa' | 'Decisão' | 'Aprovação' | 'Amostra' | 'Proposta' | 'Follow-up' | 'Bloqueio' | 'Nota' | 'Marco' | 'Dependência' | 'Documento' | 'Atualização';
export type Item = {
  id: string; kind: ItemKind; title: string; owner: string; party: Party; due: string; createdAt: string;
  status: 'Aberto' | 'Concluído' | 'Aprovado' | 'Rejeitado'; category: string; version: string;
  impact: string; channel: string; person: string; lastContact: string; productionCritical: boolean;
  planned: string; actual: string; value: number; url: string; dependsOn: string[];
};
export type Project = {
  id: number; clientId: number; client: string; name: string; products: string[]; owner: string;
  priority: 'Baixa' | 'Normal' | 'Alta' | 'Urgente'; due: string; stage: string;
  status: 'Ativo' | 'Bloqueado' | 'Em espera' | 'Cancelado'; waiting: Party | ''; waitingSince: string;
  nextAction: string; nextOwner: string; nextDue: string; enteredAt?: string; stageEnteredAt?: string;
  createdAt: string; updatedAt?: string; items: Item[]; gates: Record<string,boolean>;
  tracks: Record<string,string>; potential: number; closed: number; revision: number;
  sourceStage: string; sourceProductId: number | null;
};
export type Settings = { stages: string[]; thresholds: Record<string,{green:number;yellow:number}>; stallDays: number; phaseGates?:Record<string,string[]> };
export type Filters = { query:string; owner:string; client:string; product:string; stage:string; priority:string; status:string; waiting:string; attention:string; from:string; to:string; minValue:string };
export type Preferences = { favorites:number[]; views:{id:string;name:string;filters:Filters}[] };
export type Event = {id:string;project_id:string;actor_name:string;summary:string;previous_stage:string|null;new_stage:string|null;created_at:string;revision:number};
export type CentralData = {projects:Project[];clients:{id:number;brandName:string}[];products:{id:number;clientId:number;name:string}[];members:{id:number;name:string}[];settings:Settings;settingsRevision:number;preferences:Preferences;preferencesRevision:number;events:Event[];actor:{id:number;name:string;canWrite:boolean;canConfigure:boolean};loadedAt:string};
export const emptyFilters: Filters = {query:'',owner:'',client:'',product:'',stage:'',priority:'',status:'',waiting:'',attention:'',from:'',to:'',minValue:''};
export const defaultSettings: Settings = {stages,thresholds:Object.fromEntries(stages.map(s=>[s,{green:3,yellow:7}])),stallDays:7,phaseGates:{Desenvolvimento:['Briefing aprovado'],Amostra:['Fórmula aprovada'],Precificação:['Amostra aprovada'],Aprovado:['Preço aprovado','Pedido fechado'],Compras:['Rótulo aprovado','Regulatório concluído'],Produção:gateNames,'Controle de Qualidade':['Produção concluída'],Expedição:['Qualidade aprovada'],Entregue:['Entrega confirmada'],Concluído:['Pendências encerradas']}};
export function today(now=new Date()) { return new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).format(now); }
export function daysSince(date:string|undefined,now=new Date()) { return date ? Math.max(0,Math.floor((now.getTime()-new Date(date).getTime())/86400000)) : 0; }
export function isOpen(i:Item) { return i.status==='Aberto' || i.status==='Rejeitado'; }
export function isActive(p:Project) { return p.status!=='Cancelado' && !['Concluído','Entregue'].includes(p.stage); }
export function overdue(date:string,now=new Date()) { return Boolean(date && date.slice(0,10)<today(now)); }
export function reasons(p:Project,settings:Settings,now=new Date()) {
  if(!isActive(p)) return [];
  const items=p.items.filter(isOpen); const result:string[]=[];
  if(p.status==='Bloqueado' || items.some(i=>i.kind==='Bloqueio')) result.push('Bloqueio aberto');
  if(!p.nextAction || !p.nextOwner || !p.nextDue) result.push('Sem próxima ação completa');
  if(overdue(p.due,now) || overdue(p.nextDue,now) || items.some(i=>overdue(i.due,now))) result.push('Prazo vencido');
  if(daysSince(p.updatedAt || p.createdAt,now)>settings.stallDays) result.push('Sem movimentação');
  if(p.waiting==='Cliente' && daysSince(p.waitingSince,now)>settings.stallDays) result.push('Cliente aguardado há muitos dias');
  if(items.some(i=>i.kind==='Dependência' && !i.owner)) result.push('Dependência sem responsável');
  if(p.stageEnteredAt && daysSince(p.stageEnteredAt,now)>(settings.thresholds[p.stage]?.yellow??7)) result.push('Tempo excessivo na etapa');
  return result;
}
export function health(p:Project,settings:Settings,now=new Date()) {
  if(!isActive(p)) return 100;
  const open=p.items.filter(isOpen);
  const penalties=(overdue(p.due,now)?20:0)+(p.status==='Bloqueado'||open.some(i=>i.kind==='Bloqueio')?25:0)
    +Math.min(15,open.filter(i=>i.kind==='Tarefa'&&overdue(i.due,now)).length*5)
    +(daysSince(p.updatedAt||p.createdAt,now)>settings.stallDays?10:0)
    +Math.min(10,open.filter(i=>i.kind==='Dependência').length*2)
    +(!p.nextAction||!p.nextOwner||!p.nextDue?15:0)
    +Math.min(10,open.filter(i=>i.kind==='Aprovação'&&overdue(i.due,now)).length*5);
  return Math.max(0,100-penalties);
}
export function productionIssues(p:Project) { return [...gateNames.filter(g=>!p.gates[g]),...p.items.filter(i=>isOpen(i)&&(i.kind==='Bloqueio'||i.kind==='Dependência'||i.productionCritical)).map(i=>i.title)]; }
export function phaseIssues(p:Project,s:Settings,stage=p.stage){return [...(s.phaseGates?.[stage]??[]).filter(g=>!p.gates[g]),...p.items.filter(i=>isOpen(i)&&i.kind==='Dependência'&&i.category===stage).map(i=>i.title)];}
export function matches(p:Project,f:Filters,s:Settings,now=new Date()) {
  const hay=[p.client,p.name,p.stage,p.nextAction,p.owner,...p.products,...p.items.flatMap(i=>[i.title,i.category,i.version,i.person,i.impact])].join(' ').toLocaleLowerCase('pt-BR');
  const rs=reasons(p,s,now);
  return (!f.query||hay.includes(f.query.toLocaleLowerCase('pt-BR')))&&(!f.owner||p.owner===f.owner||p.nextOwner===f.owner||p.items.some(i=>i.owner===f.owner))
    &&(!f.client||String(p.clientId)===f.client)&&(!f.product||p.products.some(x=>x.toLowerCase().includes(f.product.toLowerCase())))
    &&(!f.stage||p.stage===f.stage)&&(!f.priority||p.priority===f.priority)&&(!f.status||p.status===f.status)&&(!f.waiting||p.waiting===f.waiting)
    &&(!f.attention||(f.attention==='Atrasados'?rs.includes('Prazo vencido'):f.attention==='Bloqueados'?rs.includes('Bloqueio aberto'):f.attention==='Sem movimentação'?rs.includes('Sem movimentação'):rs.length>0))
    &&(!f.from||(!!p.due&&p.due>=f.from))&&(!f.to||(!!p.due&&p.due<=f.to))&&(!f.minValue||p.potential>=Number(f.minValue));
}
export function brief(p:Project,s:Settings,events:Event[]) {
  return [`${p.client} — ${p.name}`,`Produtos: ${p.products.join(', ')||'Não informados'}`,`Situação: ${p.stage} · ${p.status} · saúde ${health(p,s)}/100`,
    `Responsável: ${p.owner||'Não definido'} · Prazo: ${p.due||'Não definido'}`,`Próxima ação: ${p.nextAction||'Não definida'} · ${p.nextOwner||'Sem responsável'} · ${p.nextDue||'Sem prazo'}`,
    `Aguardando: ${p.waiting||'Não registrado'}`,`Pendências: ${p.items.filter(isOpen).map(i=>`${i.kind}: ${i.title} (${i.owner||'sem responsável'}, ${i.due||'sem prazo'})`).join('; ')||'Nenhuma registrada'}`,
    `Atenção: ${reasons(p,s).join('; ')||'Nenhum alerta calculado'}`,`Liberação para produção: ${gateNames.filter(g=>p.gates[g]).length}/${gateNames.length}; faltam ${productionIssues(p).join('; ')||'nenhum item'}`,
    'Últimas movimentações:',...events.filter(e=>e.project_id===String(p.id)).slice(0,5).map(e=>`${new Date(e.created_at).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo'})} — ${e.actor_name}: ${e.summary}`)].join('\n');
}
