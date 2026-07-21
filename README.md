# Rastreabilidade Vita Power

Sistema de rastreabilidade e workspace industrial da Vita Power Nutrition.

## Stack

- Next.js com App Router
- TypeScript
- Tailwind CSS
- SQLite com `better-sqlite3`
- QR Code por lote em SVG

## Como rodar

```bash
npm install
npm run db:seed
npm run dev
```

Se o terminal não tiver `node`/`npm` no PATH, use o Node local instalado em `.tools`:

```bash
export PATH="$PWD/.tools/node/current/bin:$PATH"
```

Acesse:

- Admin: http://localhost:3000/admin
- Engenharia: http://localhost:3000/admin/engenharia
- Private Label: http://localhost:3000/admin/modulos/private-label
- Questionário Private Label: http://localhost:3000/admin/modulos/private-label/questionario
- Consulta pública: http://localhost:3000/lote/VPW-2026-001

## Variáveis

Crie um `.env.local` se quiser trocar o caminho do banco ou a URL pública:

```bash
SQLITE_PATH=data/vitapower.db
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Em produção na Vercel, o MVP usa SQLite em memória com dados temporários de demonstração. Ele não cria a pasta `data/`, não escreve em disco e não persiste cadastros entre instâncias serverless.

## Funcionalidades

- Cadastro de clientes private label
- Cadastro de produtos vinculados ao cliente
- Cadastro de lotes vinculados ao produto
- Geração de QR Code por lote
- Página pública de consulta do lote
- Dashboard administrativo com indicadores e lotes recentes
- Módulo Engenharia para fornecedores, matérias-primas, embalagens, fórmulas, projetos, precificação e propostas
- Módulo Private Label com questionário nativo, salvamento local, resumo e impressão/PDF
