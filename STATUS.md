# Status da Migração Clerk → JWT

## O que foi feito

Toda a migração de autenticação Clerk → JWT customizado está **completa no código**, mas há um bug de roteamento no frontend que ainda não foi resolvido.

---

## Backend (100% funcionando)

Testado via curl — tudo OK:

- `POST /api/auth/register` → cria usuário, retorna JWT
- `POST /api/auth/login` → autentica, retorna JWT
- `GET /api/auth/me` → retorna dados do usuário logado
- Todas as rotas protegidas usam `requireAuth` (middleware JWT)
- Admin usa `requireAdmin` (checa flag `isAdmin` no token ou `ADMIN_EMAILS` env)

## Frontend (problema de roteamento)

### O que estava errado

O `index.html` original apontava para `script.js` — uma **app vanilla JS com Clerk**. Os componentes React em `src/` nunca eram carregados pelo Vite.

### O que foi corrigido

- `index.html` atualizado para carregar `src/main.tsx` (app React)
- `vite.config.ts` atualizado: adicionado plugin React + alias `@` para `src/`
- `src/index.css` corrigido: ordem dos `@import` (devem vir antes de `@layer`)

### Bug atual: todas as rotas mostram a Home

**Sintoma:** `/sign-in`, `/shop`, `/admin` — todas renderizam a Home page.

**Causa:** Em wouter 3.x, o path matching é por **prefixo** por padrão. `path="/"` corresponde a QUALQUER URL porque toda URL começa com `/`. Como `<Route path="/">` é o primeiro no `<Switch>`, ele sempre ganha.

**Fix tentado:** `path="~/"` (o `~` força match exato em wouter 3.x).

**Status:** O fix foi aplicado em `App.tsx` mas o bug persiste nas capturas de tela da ferramenta. O app React **está** carregando e fazendo chamadas à API (confirmado pelos logs do servidor). O problema pode ser timing da ferramenta de screenshot, ou o `~/` não está funcionando como esperado nessa versão do wouter.

---

## Próximos passos para resolver o roteamento

Opção 1 — **Mover a rota `/` para o final do Switch** (em vez de deixar no topo):
```tsx
<Switch>
  <Route path="/shop" component={Shop} />
  <Route path="/sign-in" component={SignIn} />
  // ... demais rotas ...
  <Route path="/" component={HomeRedirect} />  // por último
  <Route component={NotFound} />
</Switch>
```

Opção 2 — **Usar `useLocation` + lógica de redirect manual** em vez de depender do Switch.

Opção 3 — **Trocar wouter por react-router-dom** que tem matching exato como padrão.

---

## Aviso do Clerk no console

```
Clerk: Clerk has been loaded with development keys...
```

Isso ocorre porque `VITE_CLERK_PUBLISHABLE_KEY` ainda está definida nas variáveis de ambiente do Replit. O Vite injeta todas as variáveis `VITE_*` no bundle. O aviso é inofensivo — o Clerk não é mais usado na app, mas o pacote ainda está instalado e a chave ainda está no ambiente. Para remover: deletar a secret `VITE_CLERK_PUBLISHABLE_KEY` nas configurações do Replit.
