# Rastreabilidade Vita Power + VITA IA

Sistema Next.js para rastreabilidade Vita Power com primeira versão funcional da **VITA IA**, capaz de consultar dados reais do Bling por OAuth e responder no chat usando OpenAI.

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
- VITA IA: http://localhost:3000/admin/vita-ia
- Teste Bling: http://localhost:3000/test/bling
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

- `GET /api/auth/bling` — inicia OAuth do Bling.
- `GET /api/auth/bling/callback` — troca o `code` por tokens.
- `GET /api/bling/products` — lista produtos reais do Bling.
- `GET /api/bling/orders` — consulta pedidos reais do Bling.
- `GET /api/bling/stock` — consulta estoque real do Bling.
- `GET /api/bling/production-orders` — consulta ordens de produção reais do Bling.
- `POST /api/chat` — conversa com a VITA IA e executa consultas reais no Bling.

## Perguntas suportadas no chat

- "Liste meus produtos"
- "Quais pedidos estão abertos?"
- "Qual o estoque da Creatina?"
- "Quais OPs estão em andamento?"

Nesta versão, a integração é somente leitura: não cria, edita, exclui, cria OP ou altera estoque.
