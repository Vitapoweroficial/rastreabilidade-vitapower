# Rastreabilidade Vita Power

Sistema de rastreabilidade de lotes para clientes private label.

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
- Consulta pública: http://localhost:3000/lote/VPW-2026-001

## Variáveis

Crie um `.env.local` se quiser trocar o caminho do banco ou a URL pública:

```bash
SQLITE_PATH=data/vitapower.db
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Funcionalidades do MVP

- Cadastro de clientes private label
- Cadastro de produtos vinculados ao cliente
- Cadastro de lotes vinculados ao produto
- Geração de QR Code por lote
- Página pública de consulta do lote
- Dashboard administrativo com indicadores e lotes recentes
