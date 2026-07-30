# Vita Power Workspace

Sistema de rastreabilidade e workspace industrial da Vita Power Nutrition.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- SQLite com `better-sqlite3`

## Instalação

```bash
npm install
npm run db:seed
npm run dev
```

Acesse:

- Admin: http://localhost:3000/admin
- Engenharia: http://localhost:3000/admin/engenharia
- Private Label: http://localhost:3000/admin/modulos/private-label
- Questionário Private Label: http://localhost:3000/admin/modulos/private-label/questionario
- Consulta pública: http://localhost:3000/lote/VPW-2026-001

## Configuração `.env.local`

Copie `.env.example` para `.env.local`:

```bash
cp .env.example .env.local
```

Preencha:

```bash
SQLITE_PATH=data/vitapower.db
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Funcionalidades

- Cadastro de clientes private label
- Cadastro de produtos vinculados ao cliente
- Cadastro de lotes vinculados ao produto
- Geração de QR Code por lote
- Página pública de consulta do lote
- Dashboard administrativo com indicadores e lotes recentes
- Módulo Engenharia para fornecedores, matérias-primas, embalagens, fórmulas, projetos, precificação e propostas
- Módulo Private Label com questionário nativo, salvamento local, resumo e impressão/PDF
