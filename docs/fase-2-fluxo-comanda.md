# Fase 2 — Fluxo de comanda de bar (mesas → pedido → fechamento manual)

## O que foi entregue

- Login via Supabase Auth (`src/app/login/`) com redirecionamento por role (`ROLE_HOME` em `src/lib/auth.ts`), e `proxy.ts` fazendo checagem otimista de sessão (sem sessão → `/login`; com sessão em `/login` → `/mesas`).
- `requireRole()` (`src/lib/auth.ts`) como checagem de UX em cada layout/página sensível — a segurança de verdade continua sendo o RLS, auditado na Fase 1.
- Grade de mesas (`/mesas`) com status em tempo real via Supabase Realtime (canal `postgres_changes` na tabela `mesas`).
- Abrir comanda ao tocar numa mesa (`entrarNaMesa`, em `src/app/(garcom)/mesas/actions.ts`) — resiliente a concorrência: se outro garçom já abriu a mesma mesa, entra na comanda existente em vez de falhar.
- Página de comanda (`/comandas/[comandaId]`) com cardápio por categoria (`Cardapio`), carrinho local no client, envio de pedido roteado por setor (`enviarPedido` → RPC `enviar_pedido`), lista de itens já lançados com status do pedido, e fechamento de conta manual (`FecharContaDialog` → `fecharComanda`) com split por pessoa (informativo) e taxa de serviço opcional de 10%.
- Placeholders `/poker` e `/admin` para `operador_poker` e `admin` não ficarem sem destino de login antes das Fases 4 e 5.

## Migrations novas (`supabase/migrations/`)

1. `20260716120000_fase2_pedidos_e_sync_mesa.sql`:
   - `itens_comanda.pedido_id` (FK obrigatória para `pedidos`) — itens só existem no banco a partir do envio do pedido.
   - Índice único parcial `uniq_comanda_mesa_aberta` em `comandas(mesa_id) where status <> 'fechada'` — impede duas comandas abertas na mesma mesa.
   - Trigger `sync_mesa_status_from_comanda` — mantém `mesas.status` em sincronia com o ciclo de vida da comanda (`aberta→ocupada`, `aguardando_pagamento→aguardando_pagamento`, `fechada→livre`).
   - Função `enviar_pedido(comanda_id, itens jsonb)` — `SECURITY INVOKER` (RLS do usuário real continua valendo), agrupa itens por `setor_destino` (resolvido via join em `produtos`, nunca confiando em preço/setor vindo do client) e cria pedidos + itens numa única transação.
2. `20260716120100_fase2_fix_search_path.sql` — corrige aviso do advisor (`function_search_path_mutable`) nas duas funções novas.
3. `20260716120200_fase2_enable_realtime_mesas.sql` — adiciona `mesas` à publicação `supabase_realtime` (necessário pro `postgres_changes` funcionar).

Aplicadas via Supabase MCP (`apply_migration`) no projeto `texas-beer-comanda`. `get_advisors` (tipo `security`) retornou **0 avisos** após todas as migrations.

## Teste manual — passo a passo (executado em 2026-07-16)

### 1. Build e lint

```
npm run build
npm run lint
```
Resultado: build e typecheck concluídos sem erro (Next.js 16.2.10, Turbopack); lint sem warnings.

### 2. Fluxo ponta a ponta via SQL (simulando roles como na Fase 1)

Criados usuários de teste (`garcom1.fase2`, `garcom2.fase2`, `poker.fase2@texasbeer.local`), 2 mesas (101, 102) e 2 produtos (`Chopp 500ml` → setor `bar`, `Porção de Fritas` → setor `cozinha`). Simulado cada role via `set_config('request.jwt.claims', ...)` + `set local role authenticated`.

| Passo | Ação | Resultado |
|---|---|---|
| Abrir mesa 101 (garcom1) | `insert into comandas (mesa_id, garcom_id)` | Comanda criada com `status='aberta'`; **mesa 101 mudou pra `ocupada` automaticamente** (trigger) |
| Abrir a mesma mesa 101 de novo (garcom2) | `insert into comandas` na mesma mesa | **Bloqueado**: `23505 duplicate key value violates unique constraint "uniq_comanda_mesa_aberta"` — sem duplicata |
| Enviar pedido (garcom1) | `select enviar_pedido(comanda_id, itens_de_2_setores)` | Criados 2 `pedidos` (1 `bar`, 1 `cozinha`), cada um com seus `itens_comanda` (`pedido_id` correto), subtotais batendo (R$ 24,00 bar / R$ 28,00 cozinha) |
| Ler comandas/itens/pedidos como `operador_poker` | `select count(*) from comandas/itens_comanda/pedidos` | **0 em todas** — isolamento de RLS intacto mesmo com a coluna nova |
| Fechar conta (garcom1) | `insert into pagamentos (..., status='pago')` + `update comandas set status='fechada'` | **Mesa 101 voltou pra `livre` automaticamente** (trigger) |
| Reabrir mesa 101 (garcom2) | `insert into comandas` | Permitido normalmente — o índice único só bloqueia enquanto há comanda não-fechada |

Dados de teste removidos ao final — banco voltou a 0 linhas em todas as tabelas de negócio. Advisor de segurança (`get_advisors`, tipo `security`) = **0 avisos**.

### Como reproduzir localmente

```bash
npm install
cp .env.local.example .env.local   # preencher com as credenciais reais
npm run dev
```

Pra testar o app de verdade (não só via SQL), é preciso criar um usuário `garcom` em Supabase Auth (Dashboard → Authentication → Users → Invite, com `raw_user_meta_data.role = "garcom"`) e cadastrar mesas/produtos (ainda sem UI de admin — via SQL Editor ou MCP até a Fase 5).

## Pendências / fora de escopo desta fase

- Pix/Mercado Pago (Fase 3) — fechamento aqui é sempre conciliação manual (`dinheiro`/`cartão`).
- Cancelamento de item lançado (`itens_comanda.cancelado` existe no schema, sem UI ainda).
- Tela de cozinha/bar acompanhando `pedidos.status` (`enviado`→`em_preparo`→`pronto`).
- CRUD de produtos/mesas/usuários (Fase 5, painel admin).
- Ícones PWA reais e rename do repositório GitHub — pendências já registradas na Fase 1.
