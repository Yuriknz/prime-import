# Fase 1 — Setup do projeto + schema base + RLS

## O que foi entregue

- Repositório GitHub `Yuriknz/prime-import` reaproveitado (conteúdo antigo removido; rename para `texas-beer-comanda` pendente de `gh auth login`).
- Projeto Supabase `texas-beer-comanda` (free tier, região `sa-east-1`/São Paulo), ref `mgkqfzkqsrmfjpxepane`.
- Projeto Vercel `texas-beer-comanda` conectado ao repositório GitHub, deploy automático a partir de `main`.
- Next.js 16 (App Router) + TypeScript + Tailwind v4 + shadcn/ui + PWA (manifest + service worker), fontes Oswald/Inter/JetBrains Mono, paleta escura verde-feltro/âmbar/cream.
- Autenticação via Supabase Auth (não via `usuarios.senha_hash` — decisão tomada e confirmada durante o setup; ver seção "Decisões" abaixo).
- Schema completo aplicado via migrations (`supabase/migrations/`): `usuarios`, `mesas`, `sessoes_poker`, `participantes_sessao`, `rebuys`, `comandas`, `produtos`, `itens_comanda`, `pedidos`, `pagamentos`.
- RLS explícito em todas as tabelas, isolando `garcom` de `sessoes_poker`/`participantes_sessao`/`rebuys` e `operador_poker` de `comandas`/`itens_comanda`/`pedidos`/`pagamentos`.

## Decisões de arquitetura

- **Auth**: Supabase Auth (`auth.users`) em vez de senha própria. A tabela `usuarios` é um perfil de aplicação (sem `senha_hash`) preenchido automaticamente por um trigger (`handle_new_auth_user`) quando um usuário é criado no Auth. `role`/`nome` iniciais vêm de `raw_user_meta_data` (definidos ao convidar o usuário).
- **Valores monetários**: `numeric(12,2)` no Postgres (reais, não centavos) — evita imprecisão de float e mapeia direto para `R$ 0,00` via `Intl.NumberFormat('pt-BR', {style:'currency', currency:'BRL'})` em `src/lib/format.ts`.
- **Timezone**: todo timestamp é `timestamptz` (armazenado em UTC); a conversão para `America/Sao_Paulo` acontece na camada de apresentação (`src/lib/format.ts`).
- **Funções SECURITY DEFINER** (`current_user_role`, `handle_new_auth_user`) vivem no schema `private` (não exposto pelo PostgREST), evitando que fiquem chamáveis como RPC público — corrigido após o advisor de segurança do Supabase apontar o problema.
- **Env vars client-side**: renomeadas para `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY` (em vez de `SUPABASE_URL`/`SUPABASE_ANON_KEY` como no pedido original) — exigência do Next.js para expor variáveis ao bundle do browser. `SUPABASE_SERVICE_ROLE_KEY` continua sem prefixo, só no servidor.
- **Next.js 16**: convenção `middleware.ts` foi renomeada para `proxy.ts` nesta versão (breaking change) — usado `src/proxy.ts` com `export function proxy(...)`.

## Pendências antes da Fase 2

- `SUPABASE_SERVICE_ROLE_KEY` — pegar em Supabase Dashboard → Project Settings → API → service_role secret key, colar em `.env.local` e em `vercel env add SUPABASE_SERVICE_ROLE_KEY`.
- `MP_ACCESS_TOKEN` / `MP_WEBHOOK_SECRET` — só necessários na Fase 3 (integração Pix).
- Rename do repositório GitHub para `texas-beer-comanda` — pendente de `gh auth login`.
- Ícones PWA reais (`public/icon.svg` é um placeholder "TB" gerado programaticamente, sem arte de marca).

## Teste manual — passo a passo (executado em 2026-07-16)

### 1. Build local roda sem erro

```
npm run build
```
Resultado: compilação e typecheck concluídos sem erro (Next.js 16.2.10, Turbopack).

### 2. Migrations aplicam limpo em banco zerado

Aplicadas via Supabase MCP (`apply_migration`) em ordem, no projeto recém-criado (banco vazio):
1. `20260716042100_schema_base.sql` — tabelas, enums, constraints, índices, trigger de auth.
2. `20260716042200_rls_policies.sql` — RLS + policies por role.
3. `20260716042300_move_definer_functions_private.sql` — move funções SECURITY DEFINER para schema `private`.

Todas as 3 aplicaram sem erro (`{"success":true}`). Advisor de segurança do Supabase (`get_advisors`, tipo `security`) retornou **0 avisos** após a 3ª migration.

### 3. Isolamento de RLS por role — prova ponta a ponta

Criados 3 usuários de teste diretamente em `auth.users` (dispara o trigger que popula `usuarios` com o `role` correto via `raw_user_meta_data`):
- `garcom.teste@texasbeer.local` → role `garcom`
- `poker.teste@texasbeer.local` → role `operador_poker`
- `admin.teste@texasbeer.local` → role `admin`

Seed de dados base: 1 `mesa`, 1 `produto`, 1 `sessao_poker`, 1 `comanda` vinculada à mesa.

Simulando cada role via `set_config('request.jwt.claims', ...)` + `set local role authenticated` (mesmo mecanismo que o PostgREST usa em produção):

| Role testado | `comandas` | `sessoes_poker` | `participantes_sessao` | `rebuys` | `mesas` |
|---|---|---|---|---|---|
| `garcom` | 1 (vê) | **0 (bloqueado)** | **0 (bloqueado)** | **0 (bloqueado)** | 1 (vê) |
| `operador_poker` | **0 (bloqueado)** | 1 (vê) | — | — | **0 (bloqueado)** |
| `admin` | 1 (vê) | 1 (vê) | — | — | 1 (vê) |

Testes de escrita cruzada (devem falhar):
- `garcom` tentando `INSERT` em `sessoes_poker` → **bloqueado**: `ERROR 42501: new row violates row-level security policy for table "sessoes_poker"`.
- `operador_poker` tentando `INSERT` em `comandas` (com `mesa_id` literal, não obtido por SELECT) → **bloqueado**: `ERROR 42501: new row violates row-level security policy for table "comandas"`.

Dados de teste removidos ao final (`delete from ... ; delete from auth.users where email like '%@texasbeer.local'`) — banco voltou a 0 linhas em todas as tabelas de negócio, pronto para uso real.

### 4. Deploy automático

Push para `main` deve disparar build automático no projeto Vercel `texas-beer-comanda` (git integration confirmada durante `vercel link`). Verificar em `vercel ls --scope yuriknzs-projects` ou no dashboard após o primeiro push.

### Como reproduzir localmente

```bash
npm install
cp .env.local.example .env.local   # preencher com as credenciais reais (ver README/Supabase Dashboard)
npm run dev
```
