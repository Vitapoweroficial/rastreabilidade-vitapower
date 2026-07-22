# Rastreabilidade Vita Power + VITA IA

Sistema de rastreabilidade e workspace industrial da Vita Power Nutrition.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- SQLite com `better-sqlite3`
- Bling API v3 via OAuth 2.0
- OpenAI via API server-side

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
OPENAI_API_KEY=
BLING_CLIENT_ID=
BLING_CLIENT_SECRET=
BLING_REDIRECT_URI=http://localhost:3000/api/auth/bling/callback
```

No aplicativo do Bling, cadastre exatamente a URL de redirecionamento configurada em `BLING_REDIRECT_URI`.

## Fluxo de validação do Bling

1. Rode `npm run dev`.
2. Abra `http://localhost:3000/test/bling`.
3. Clique em **Autenticar no Bling**.
4. Autorize o aplicativo no Bling.
5. Ao retornar, use os botões de teste para consultar produtos, pedidos, estoque e ordens de produção.

Os tokens ficam salvos apenas no SQLite no servidor, na tabela `bling_oauth_tokens`, e não são expostos no frontend.

## Endpoints implementados

## Funcionalidades

- Cadastro de clientes private label
- Cadastro de produtos vinculados ao cliente
- Cadastro de lotes vinculados ao produto
- Geração de QR Code por lote
- Página pública de consulta do lote
- Dashboard administrativo com indicadores e lotes recentes
- Módulo Engenharia para fornecedores, matérias-primas, embalagens, fórmulas, projetos, precificação e propostas
- Módulo Private Label com questionário nativo, salvamento local, resumo e impressão/PDF
