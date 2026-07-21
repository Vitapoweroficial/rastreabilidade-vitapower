# Vita Power Workspace — Master Architecture

## 1. Visão do sistema

O **Vita Power Workspace** será o coração digital da Vita Power Nutrition: um ERP/workspace industrial para operar private label, produção própria, rastreabilidade, qualidade, regulatório, engenharia, compras, estoque, financeiro e CRM em uma única plataforma modular.

A primeira missão preserva o MVP de rastreabilidade existente e cria a base enterprise para expansão incremental, com foco em:

- rastreabilidade pública por lote sem regressões;
- navegação lateral persistente e identidade visual premium;
- dashboard executivo como entrada operacional;
- estrutura de dados inicial para CRM, private label e engenharia;
- arquitetura de pastas por módulos para evolução organizada.

## 2. Arquitetura atual identificada

### Stack

- Next.js App Router com TypeScript.
- Tailwind CSS para design system utilitário.
- SQLite via `better-sqlite3`.
- QR Code SVG com `qrcode`.
- Deploy previsto na Vercel, hoje com SQLite em memória em produção/serverless.

### Rotas atuais

- `/` redireciona para `/admin`.
- `/admin` contém dashboard administrativo do MVP.
- `/admin/clientes` cadastra e lista clientes private label.
- `/admin/produtos` cadastra e lista produtos vinculados a clientes.
- `/admin/lotes` cadastra e lista lotes, com QR Code e link público.
- `/lote/[code]` exibe consulta pública de lote.
- `/api/lotes/[code]/qr` gera QR Code SVG para consulta pública.
- `/api/health` expõe health check.

### Componentes atuais

- `AdminNav`: navegação administrativa.
- `StatCard`: card de indicador.
- `StatusBadge`: status de lote.
- `ClientForm`, `ProductForm`, `LotForm`: formulários server actions.

### Banco atual

Tabelas existentes:

- `clients`: clientes private label.
- `products`: produtos por cliente.
- `lots`: lotes rastreáveis por produto.

Índices existentes para cliente, produto, lote, status e validade.

### Módulo preservado

O módulo de rastreabilidade é composto por:

- cadastro de clientes;
- cadastro de produtos;
- cadastro de lotes;
- consulta pública por lote;
- geração de QR Code;
- indicadores básicos no admin.

## 3. Arquitetura proposta

### Princípios

1. Evolução incremental sobre o MVP atual.
2. Separação de domínio por módulo.
3. Banco relacional como fonte canônica.
4. Server Components e server actions para fluxo administrativo simples.
5. Futuro upgrade para autenticação, permissões e banco persistente gerenciado.
6. Design system consistente para telas industriais limpas e rápidas.

### Camadas sugeridas

- `src/app`: rotas e layouts por área.
- `src/components`: componentes reutilizáveis de UI e formulários.
- `src/lib`: acesso a dados, migrações, tipos, formatação e catálogo de módulos.
- `src/modules`: contratos e documentação técnica por domínio de negócio.
- `docs`: decisões complementares e documentação histórica.

### Evolução de persistência

SQLite é adequado para MVP e Codespaces, mas o Workspace deve migrar para PostgreSQL gerenciado antes de uso multiusuário em produção. A camada `repository` deve ser progressivamente quebrada em repositories por domínio.

## 4. Módulos do Vita Power Workspace

1. **Dashboard Executivo** — indicadores gerais, produção do dia, OPs, atrasos, alertas, margem e faturamento.
2. **CRM** — clientes, contatos, pipeline, histórico, propostas, pedidos e pagamentos.
3. **Private Label** — briefing, projeto, fórmula, proposta, aprovações, dossiê, arte, OP, produção, CQ e expedição.
4. **Engenharia** — matérias-primas, fornecedores, embalagens, fórmulas, BOM, memorial técnico e precificação.
5. **Produção / PCP** — ordens de produção, etapas produtivas, apontamentos, gargalos e status.
6. **Qualidade** — CQ, liberações, reprovações, não conformidades, laudos, contraprovas e inspeções.
7. **Regulatório** — dossiê técnico, rotulagem, ANVISA, estabilidade, POPs, RT e versionamento.
8. **Rastreabilidade** — lote interno, matéria-prima, produto acabado, cliente, OP, fornecedor, expedição e consulta pública.
9. **Compras** — fornecedores, cotações, pedidos de compra, histórico de preços e previsão de necessidade.
10. **Estoque** — matérias-primas, embalagens, produto acabado, quarentena, aprovado, reprovado, lotes e validade.
11. **Financeiro** — propostas, pedidos, recebimentos, pagamentos, margem, comissão, custos, AP/AR.
12. **Configurações** — usuários, permissões, parâmetros industriais, categorias, unidades, etapas e status.

## 5. Banco de dados — estrutura inicial proposta

Além das tabelas preservadas (`clients`, `products`, `lots`), a base inicial cria:

- `client_contacts`: contatos por cliente.
- `projects`: projetos private label/produção por cliente.
- `suppliers`: fornecedores de insumos e embalagens.
- `raw_materials`: matérias-primas com unidade, categoria, fornecedor e custo.
- `packaging_materials`: embalagens com tipo, unidade, fornecedor e custo.
- `formulas`: cabeçalho de fórmulas por produto/projeto, versão e rendimento.
- `formula_items`: composição de fórmulas com matéria-prima, quantidade e unidade.
- `pricing_models`: snapshot de precificação por produto/projeto, incluindo custos, impostos, frete, comissões e margem.

Próximas tabelas recomendadas:

- `production_orders`, `production_order_steps`, `production_records`.
- `quality_inspections`, `non_conformities`, `lab_reports`, `retention_samples`.
- `regulatory_documents`, `label_reviews`, `stability_studies`.
- `purchase_orders`, `purchase_order_items`, `stock_movements`, `inventory_lots`.
- `users`, `roles`, `permissions`, `audit_logs`.

## 6. Entidades principais

- Cliente, contato e histórico comercial.
- Projeto private label.
- Produto e fórmula.
- Matéria-prima, embalagem e fornecedor.
- Modelo de precificação.
- Ordem de produção e etapas produtivas.
- Lote interno, lote de insumo e lote de produto acabado.
- Inspeção de qualidade, laudo e não conformidade.
- Documento regulatório, aprovação RT e versão de rótulo.
- Pedido de compra, estoque e movimentação.
- Proposta, pedido, cobrança, pagamento e margem.
- Usuário, perfil, permissão e auditoria.

## 7. Roadmap incremental

### Fase 1 — Fundação enterprise

- Layout principal com menu lateral persistente.
- Dashboard executivo inicial.
- Cards de módulos principais.
- Estrutura de pastas por módulos.
- Migração inicial de dados para CRM/engenharia/private label.
- Documento mestre de arquitetura.

### Fase 2 — CRM + Private Label

- Pipeline comercial.
- Projetos por cliente.
- Briefing e checklist de aprovações.
- Propostas e status comerciais.

### Fase 3 — Engenharia + Precificação

- Cadastros completos de insumos e embalagens.
- Fórmulas versionadas.
- BOM e memorial técnico.
- Precificação industrial detalhada.

### Fase 4 — PCP + Qualidade

- Ordens de produção.
- Etapas e apontamentos.
- CQ em processo e liberação final.
- Não conformidades e retenção.

### Fase 5 — Regulatório + Estoque + Compras + Financeiro

- Dossiês e aprovações RT.
- Estoque por lote, validade e status.
- Compras e previsão de necessidade.
- Contas a pagar/receber e margem.

### Fase 6 — Escala corporativa

- Autenticação e RBAC.
- Auditoria completa.
- PostgreSQL gerenciado.
- Observabilidade, backups e ambiente homologação.
- Integrações fiscais, gateway de pagamento e BI.

## 8. Riscos técnicos

- **SQLite em Vercel serverless**: hoje é volátil em produção. Mitigação: migrar para PostgreSQL/Supabase/Neon/Vercel Postgres antes do uso real.
- **Ausência de autenticação**: área admin está pública. Mitigação: implementar auth e RBAC na próxima fase.
- **Repository monolítico**: tende a crescer demais. Mitigação: quebrar por módulo conforme novas telas surgirem.
- **Sem trilha de auditoria**: necessário para qualidade/regulatório. Mitigação: criar `audit_logs` e eventos por entidade.
- **Regras regulatórias complexas**: exigem validação com RT e jurídico. Mitigação: documentar decisões e versionar documentos.
- **Dados industriais sensíveis**: fórmulas e precificação exigem permissões granulares e criptografia/segurança operacional.

## 9. Próximos passos

1. Implementar autenticação e perfis de acesso.
2. Criar CRUD de projetos private label e contatos.
3. Criar CRUD de matérias-primas, embalagens e fornecedores.
4. Criar primeira tela de fórmula/BOM.
5. Criar primeira tela de precificação industrial.
6. Criar ordens de produção conectadas a lotes.
7. Adicionar auditoria e histórico por entidade.
8. Planejar migração PostgreSQL com migrations versionadas.
