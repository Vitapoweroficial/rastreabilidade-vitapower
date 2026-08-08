# Vita Power Workspace

Workspace industrial e sistema de rastreabilidade da Vita Power Nutrition.

## Produção

- Workspace: https://rastreabilidade-vitapower.vercel.app/admin
- Health check: https://rastreabilidade-vitapower.vercel.app/api/health

## Stack

- Next.js App Router
- React 19
- TypeScript
- Tailwind CSS
- Neon Postgres com `@neondatabase/serverless`
- Vercel

## Instalação local

```bash
npm install
cp .env.example .env.local
npm run dev
```

Preencha o `.env.local` com uma conexão Neon/Postgres válida:

```bash
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

O schema é criado de forma idempotente pela aplicação. Não existe mais dependência de SQLite, Bling ou VITA IA neste repositório.

## Rotas principais

- Dashboard: http://localhost:3000/admin
- Clientes: http://localhost:3000/admin/clientes
- Produtos: http://localhost:3000/admin/produtos
- Lotes: http://localhost:3000/admin/lotes
- Engenharia: http://localhost:3000/admin/engenharia
- Private Label: http://localhost:3000/admin/modulos/private-label
- Questionário Private Label: http://localhost:3000/admin/modulos/private-label/questionario
- Consulta pública: http://localhost:3000/lote/SEU-CODIGO-DE-LOTE
- Health check: http://localhost:3000/api/health

## Funcionalidades

- Dashboard executivo responsivo e interativo com busca, filtros, indicadores e navegação acionável
- Cadastro de clientes private label
- Cadastro de produtos vinculados ao cliente
- Cadastro de lotes vinculados ao produto
- Geração de QR Code por lote
- Página pública de consulta e rastreabilidade por lote
- Engenharia com fornecedores, matérias-primas, embalagens, fórmulas, projetos, precificação e propostas
- Módulo Private Label com questionário nativo, resumo e impressão/PDF
- Persistência real em Neon Postgres
- Estados de carregamento, feedback visual e microinterações no workspace

## Validação e deploy

O workflow `Build validation` roda em pull requests, pushes para `main` e manualmente. Ele executa:

1. instalação das dependências;
2. `npx tsc --noEmit`;
3. `npm run build`;
4. smoke test de produção em `/api/health`, `/admin`, clientes, produtos, lotes, engenharia e Private Label.

Nos builds da Vercel, `npm run build` também executa `scripts/verify-neon-persistence.mjs`, que grava um marcador no Neon, lê o mesmo marcador por outra conexão e valida a remoção por uma terceira conexão antes de iniciar o build do Next.js.
