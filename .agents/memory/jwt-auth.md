---
name: JWT Auth Migration
description: Clerk foi removido; auth customizado com JWT + bcryptjs. Detalhes da implementação e decisões.
---

## Regra
O projeto NÃO usa Clerk. Usa JWT próprio com bcryptjs para hash de senha.

**Why:** Usuário pediu explicitamente ("login com jwt sem usar esse api de login atual").

## Como funciona
- Token: `jsonwebtoken` assinado com `SESSION_SECRET` env var, TTL 30 dias
- Hash: `bcryptjs` com salt 12
- Frontend: token guardado em `localStorage` com chave `jerseystore_token`
- `apiFetch()` lê o token do localStorage e anexa `Authorization: Bearer <token>`

## Arquivos-chave
- `artifacts/api-server/src/middlewares/jwtMiddleware.ts` — `requireAuth` e `requireAdmin` middlewares
- `artifacts/api-server/src/routes/auth.ts` — `POST /auth/register`, `POST /auth/login`, `GET /auth/me`
- `artifacts/jersey-store/script.js` — funções `initAuth()`, `authSetSession()`, `authClearSession()`, `logout()`

## Schema DB (users)
- Removido: `clerkId` (text, unique)
- Adicionado: `passwordHash` (text, nullable)
- Email agora tem constraint `unique()`
- `orders.userId` e `cartItems.userId` são texto — armazena o ID numérico do usuário como string (e.g. "42")

## Cuidados
- `lib/db/src/schema/*.ts`: NÃO usar `zod/v4` — usar `zod` diretamente. drizzle-zod incompatível com zod v4.
- `createInsertSchema` do drizzle-zod pode gerar erros de tipo com `z.infer` — preferir `typeof table.$inferInsert`.
- `ListProductsQueryParams` gerado pelo Orval NÃO inclui `page`/`limit` — ler direto de `req.query`.
