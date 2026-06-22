# Arquitetura Estrategica Vita Power

## Norte do Produto

O sistema deve evoluir de um MVP de rastreabilidade para o DNA digital da Vita Power: uma plataforma proprietaria que centraliza operacao, comercial, producao, qualidade, regulatorio, documentos, conhecimento interno e relacionamento com clientes.

A arquitetura deve ser orientada por dominios, com modulos independentes compartilhando entidades centrais. O alvo futuro recomendado e PostgreSQL gerenciado, storage externo para arquivos, fila de eventos para automacoes e uma camada de permissoes por perfil e cliente.

## Modulos

1. CRM Industrial: clientes, contatos, responsaveis, contratos, historico comercial, timeline e ocorrencias.
2. Central de Produtos: produtos, versoes, formulas, tabela nutricional, ingredientes, alegacoes, embalagem e arquivos tecnicos.
3. Regulatorio e Qualidade: dossies, especificacoes, laudos, certificados, estudos de estabilidade, POPs, licencas e alertas de vencimento.
4. Materias-Primas: cadastro, fornecedores, fabricantes, documentos, lotes recebidos, compras e vinculo com formulas.
5. Rastreabilidade Completa: grafo entre materia-prima, lote recebido, lote produzido, produto, pedido e cliente.
6. Pedidos e Producao: pedidos, itens, status operacional, ordens de producao, envase, rotulagem, expedicao, faturamento e entrega.
7. Portal do Cliente: visao restrita por cliente para pedidos, produtos, documentos, aprovacoes, solicitacoes e pendencias.
8. Inteligencia de Negocio: dashboards comercial, producao, qualidade, clientes e crescimento.
9. Base de Conhecimento: processos, POPs, treinamentos, decisoes, projetos e reunioes.

## Entidades Centrais

### Identidade e Acesso

- organizations: representa a Vita Power e, futuramente, unidades/empresas relacionadas.
- users: usuarios internos e usuarios de clientes.
- roles: perfis como admin, comercial, qualidade, regulatorio, producao e cliente.
- permissions: acoes permitidas por modulo.
- client_access: vinculo entre usuarios externos e clientes autorizados.

### CRM Industrial

- clients: razao social, nome fantasia, CNPJ, endereco, status, segmento e dados comerciais agregados.
- client_contacts: contatos por cliente, cargo, area, email, telefone e preferencia de comunicacao.
- client_responsibles: responsaveis internos pela conta.
- contracts: contratos, vigencia, arquivos, condicoes e status.
- commercial_history: primeiro pedido, ultimo pedido, faturamento acumulado, ticket medio e recompra.
- timeline_events: eventos cronologicos relacionados a cliente, produto, pedido, lote ou documento.
- complaints: reclamacoes, nao conformidades comerciais e tratativas.

### Produtos, Formulas e Embalagens

- products: produto comercial por cliente.
- product_versions: versoes tecnicas do produto, com status aprovado, em revisao ou descontinuado.
- formulas: formula aprovada por versao do produto.
- formula_items: composicao da formula e relacao N:N com materias-primas.
- nutrition_facts: tabela nutricional por versao.
- ingredients: lista declaratoria de ingredientes.
- claims: alegacoes aprovadas.
- packaging_specs: especificacoes de embalagem primaria, secundaria e rotulo.
- product_files: vinculos para documentos e arquivos tecnicos.
- version_changes: trilha de auditoria com quem alterou, quando e o que mudou.

### Materias-Primas, Fornecedores e Compras

- suppliers: fornecedores.
- manufacturers: fabricantes.
- raw_materials: materia-prima com codigo interno, categoria e especificacoes.
- raw_material_documents: COA, FISPQ, ficha tecnica e certificados.
- material_lots: lotes recebidos, validade, fornecedor, fabricante e documentos.
- purchase_orders: compras realizadas.
- purchase_order_items: itens comprados e lotes recebidos.

### Pedidos, Producao e Lotes

- orders: pedido comercial, cliente, data, valor, condicao de pagamento e status geral.
- order_items: produtos, quantidades e valores.
- production_orders: ordem de producao vinculada ao pedido ou reposicao.
- production_steps: etapas como materia-prima, producao, envase, rotulagem, expedicao e faturamento.
- lots: lote produzido, produto, datas, quantidade, status e QR publico.
- lot_inputs: relacao entre lote produzido e lotes de materias-primas utilizados.
- shipments: expedicao, romaneio, transportadora e entrega.
- invoices: notas fiscais e faturamento.

### Regulatorio, Qualidade e Documentos

- documents: metadados de arquivos, tipo, validade, status, dono e storage key.
- document_links: vinculo polimorfico entre documentos e clientes, produtos, lotes, materias-primas, fornecedores, pedidos ou dossies.
- regulatory_dossiers: dossie por produto/versao.
- dossier_items: documentos exigidos e status de preenchimento.
- stability_studies: estudos de estabilidade, prazos, resultados e validade.
- lab_reports: laudos laboratoriais.
- certificates: certificados e vencimentos.
- quality_events: nao conformidades, CAPA, desvios e reclamacoes tecnicas.
- expiration_alerts: alertas gerados para documentos, estudos e renovacoes.

### Conhecimento e BI

- knowledge_articles: POPs, processos, decisoes e treinamentos.
- meetings: reunioes, participantes e atas.
- projects: iniciativas internas ou por cliente.
- metrics_snapshots: agregados periodicos para dashboards.
- audit_logs: registro tecnico de acoes sensiveis.

## Relacionamentos Principais

- clients 1:N products
- clients 1:N orders
- clients 1:N contacts
- clients 1:N timeline_events
- products 1:N product_versions
- product_versions 1:1 formulas
- formulas N:M raw_materials via formula_items
- raw_materials 1:N material_lots
- suppliers 1:N raw_materials
- suppliers 1:N material_lots
- orders 1:N order_items
- order_items N:1 products
- production_orders N:1 orders
- production_orders 1:N lots
- lots N:M material_lots via lot_inputs
- lots N:1 products
- shipments N:1 orders
- regulatory_dossiers N:1 product_versions
- documents N:M qualquer entidade via document_links
- quality_events podem se relacionar com client, product, order, lot ou raw_material

## Fluxos de Rastreabilidade

Sentido materia-prima para cliente:

raw_materials -> material_lots -> lot_inputs -> lots -> products -> order_items -> orders -> clients

Sentido cliente para materia-prima:

clients -> orders -> order_items -> products -> lots -> lot_inputs -> material_lots -> raw_materials -> suppliers

Para cumprir a meta de encontrar qualquer informacao em menos de 30 segundos, o sistema deve ter busca global, filtros por entidade, timeline unificada e tela de grafo de rastreabilidade.

## Decisoes Tecnicas Recomendadas

- Banco futuro: PostgreSQL com migrations versionadas.
- Arquivos: storage externo, como Vercel Blob, S3 ou Cloudflare R2; nunca filesystem local em producao.
- Busca: Postgres full-text no inicio; evoluir para Meilisearch ou OpenSearch quando o volume justificar.
- Eventos: tabela domain_events no inicio; fila dedicada depois para alertas e integracoes.
- Permissoes: RBAC com escopo por cliente e modulo.
- Auditoria: audit_logs para alteracoes em formula, documentos, status de lote, pedidos e permissoes.
- API interna: services por dominio, evitando regras de negocio dentro das paginas.
- BI: tabelas agregadas ou materialized views para dashboards quando os dados crescerem.

## Roadmap por Fases

### Fase 1: Fundacao Operacional

- Remover dependencia de disco em producao.
- Manter MVP de rastreabilidade com dados temporarios.
- Criar modelo de dominios e camada de repositorios preparada para troca de SQLite por Postgres.
- Consolidar clientes, produtos, lotes e QR publico.

### Fase 2: CRM Industrial e Area do Cliente

- Expandir cadastro de clientes, contatos e responsaveis.
- Criar timeline unificada por cliente.
- Registrar solicitacoes, aprovacoes, reclamacoes e reunioes.
- Implementar controle de acesso por usuario e cliente.

### Fase 3: Produtos, Formulas e Documentos

- Criar versoes de produto e formula.
- Relacionar ingredientes, tabela nutricional, alegacoes e embalagens.
- Implementar biblioteca de documentos com validade e vinculos por entidade.
- Registrar historico de alteracoes.

### Fase 4: Regulatorio, Qualidade e Materias-Primas

- Criar dossies por produto.
- Cadastrar materias-primas, fornecedores, fabricantes e documentos.
- Registrar lotes recebidos e vinculos com lotes produzidos.
- Criar alertas de vencimento para certificados, laudos e estudos.

### Fase 5: Pedidos, PCP e Producao

- Criar pedidos, itens e status operacional.
- Vincular pedidos a ordens de producao e lotes.
- Registrar etapas de producao, envase, rotulagem, expedicao e faturamento.
- Implementar visao operacional por fila/status.

### Fase 6: Portal do Cliente

- Liberar acesso restrito para clientes.
- Exibir pedidos, produtos, documentos, aprovacoes, pendencias e comunicacao.
- Criar fluxo de aprovacoes de formula, rotulo e embalagem.

### Fase 7: BI e Memoria Institucional

- Criar dashboards por area.
- Implementar base de conhecimento, processos, POPs e treinamentos.
- Adicionar historico de decisoes e projetos.
- Evoluir indicadores para previsoes, alertas e recomendacoes.

### Fase 8: ERP Completo

- Integrar compras, estoque, logistica e financeiro.
- Criar conectores para sistemas fiscais e contabeis.
- Implementar planejamento de capacidade e PCP avancado.
- Estruturar data warehouse ou camada analitica dedicada.
