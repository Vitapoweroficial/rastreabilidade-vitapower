import assert from 'node:assert/strict';
import test from 'node:test';
import {today,health,reasons,matches,productionIssues,phaseIssues,gateNames,defaultSettings,emptyFilters} from '../src/lib/private-label-central-model.ts';
const now=new Date('2026-10-05T15:00:00Z');
const p={id:1,clientId:2,client:'Cliente A',name:'Creatina',products:['Creatina'],owner:'Andrew',priority:'Alta',stage:'Amostra',status:'Ativo',waiting:'Cliente',waitingSince:'2026-10-01',nextAction:'Avaliar sabor',nextOwner:'Cliente',nextDue:'2026-10-07',due:'2026-10-10',createdAt:'2026-09-30T15:00:00Z',updatedAt:'2026-10-04T15:00:00Z',stageEnteredAt:'2026-10-01T15:00:00Z',items:[],gates:Object.fromEntries(gateNames.map(g=>[g,false])),potential:50000};
test('fuso de São Paulo mantém o prazo correto perto da meia-noite UTC',()=>assert.equal(today(new Date('2026-10-06T01:00:00Z')),'2026-10-05'));
test('projeto saudável não gera alertas artificiais',()=>{assert.equal(health(p,defaultSettings,now),100);assert.deepEqual(reasons(p,defaultSettings,now),[]);});
test('bloqueios e ação incompleta deterioram saúde e exigem atenção',()=>{const blocked={...p,status:'Bloqueado',nextAction:'',nextDue:''};assert.equal(health(blocked,defaultSettings,now),60);assert.deepEqual(reasons(blocked,defaultSettings,now),['Bloqueio aberto','Sem próxima ação completa']);});
test('filtros combinam responsável cliente produto valor e aguardando',()=>{const f={...emptyFilters,owner:'Andrew',client:'2',product:'Creatina',waiting:'Cliente',minValue:'50000'};assert.equal(matches(p,f,defaultSettings,now),true);assert.equal(matches(p,{...f,client:'3'},defaultSettings,now),false);});
test('produção exige dez gates e dependências em aberto',()=>{assert.equal(productionIssues(p).length,10);const ready={...p,gates:Object.fromEntries(gateNames.map(g=>[g,true]))};assert.equal(productionIssues(ready).length,0);assert.deepEqual(productionIssues({...ready,items:[{kind:'Dependência',status:'Aberto',title:'Pouch recebido',productionCritical:false}]}),['Pouch recebido']);});
test('projeto cancelado não polui projetos parados',()=>assert.deepEqual(reasons({...p,status:'Cancelado',nextAction:''},defaultSettings,now),[]));

test('avançar de fase exige seus gates e dependências específicos',()=>{assert.deepEqual(phaseIssues(p,defaultSettings,'Amostra'),['Fórmula aprovada']);assert.deepEqual(phaseIssues({...p,gates:{...p.gates,'Fórmula aprovada':true}},defaultSettings,'Amostra'),[]);});
