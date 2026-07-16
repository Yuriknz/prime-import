# Fase 4 — Módulo de poker (sessão, buy-in, rebuy, cash-out/eliminação, encerramento)

Fase 3 (Pix/Mercado Pago) foi deliberadamente adiada pelo cliente. Esta fase entrega o painel do `operador_poker`, pulando direto pro item 4 da ordem original.

## O que foi entregue

- `/poker` reorganizado num route group `(poker)` com layout compartilhado (`src/app/(poker)/layout.tsx`, `requireRole(['operador_poker','admin'])` + header), substituindo o placeholder da Fase 2.
- Lista de sessões (`/poker`) com criação de sessão torneio/cash_game via `NovaSessaoDialog`.
- Detalhe da sessão (`/poker/[sessaoId]`): registrar participante (buy-in inicial pré-preenchido com o buy-in da sessão), registrar rebuy, cash-out (com valor) e eliminar — cada ação um `Dialog`/botão simples com `useTransition`, mesmo padrão da Fase 2.
- Encerramento de sessão (`EncerrarSessaoDialog` → `encerrarSessao`): bloqueado enquanto houver participante `ativo` (checado no client e revalidado no server); rake sugerido automaticamente pra torneio (`taxa_casa_percentual` × total arrecadado), campo manual pra cash_game (rake por pote é cobrado fisicamente na mesa — a régua fica só como referência de texto na tela); pool/prêmios calculado ao vivo (arrecadado − rake).

## Decisões de arquitetura (esclarecidas com o usuário antes de implementar)

- **Rake do cash_game**: não é rastreado pote a pote no banco (inviável logar cada mão). O operador digita o total de rake coletado ao encerrar a sessão.
- **Pool/prêmios**: só um número de referência no encerramento — sem tela de distribuição por colocação. Quem foi premiado fica registrado organicamente via `participantes_sessao.status='cashout'` + `valor_cashout`.
- **Concorrência em rebuy**: cada clique cria um rebuy novo (comportamento correto — comprovado no teste: 2 inserts pro mesmo participante geraram 2 linhas em `rebuys`, somando corretamente). Proteção contra duplo-clique acidental é só client-side (`useTransition` desabilita o botão durante o envio).

## Migration nova

`supabase/migrations/20260716130000_fase4_rake_sessao.sql`:
- `sessoes_poker.rake_total numeric(12,2)` — único lugar no banco onde o rake final da sessão fica gravado (torneio: derivável, mas persistido pra referência/relatório futuro; cash_game: só existe aqui, digitado manualmente).
- `chk_sessao_rake_ao_encerrar` — trava a nível de banco garantindo que `rake_total` esteja preenchido sempre que `status='encerrada'` (defesa em profundidade além da checagem no server action).

`taxa_casa_por_hora` (schema da Fase 1) não é usada no cálculo desta fase — permanece no schema sem uso.

## Teste manual — passo a passo (executado em 2026-07-16)

### 1. Build e lint

```
npm run build
npm run lint
```
Resultado: build e typecheck sem erro (rotas `/poker` e `/poker/[sessaoId]` geradas); lint sem warnings.

### 2. Fluxo ponta a ponta via SQL (simulando roles)

Criados usuários de teste (`poker.fase4`, `garcom.fase4@texasbeer.local`), 1 sessão torneio (buy-in R$50, taxa 15%) e 1 cash_game (buy-in R$100).

| Passo | Ação | Resultado |
|---|---|---|
| Registrar 2 participantes no torneio | `insert into participantes_sessao` | Ambos `status='ativo'` |
| Registrar 2 rebuys seguidos no mesmo participante | `insert into rebuys` ×2 | **2 linhas criadas** (não sobrescreve) — total de rebuys R$100,00, confirma "cada clique = 1 rebuy" |
| Tentar `update sessoes_poker set status='encerrada'` sem `rake_total`, com participantes ainda ativos | direto no banco | **Bloqueado**: `23514 violates check constraint "chk_sessao_rake_ao_encerrar"` — constraint pega mesmo se a checagem de app falhar |
| Resolver os 2 participantes (1 cash-out R$200, 1 eliminado) e encerrar o torneio com `rake_total=30` (15% de R$200 arrecadado) | `update sessoes_poker` | `status='encerrada'`, `rake_total` gravado |
| Cash_game: 1 participante, cash-out R$85, encerrar com `rake_total=15` (digitado manualmente) | `update sessoes_poker` | `status='encerrada'`, `rake_total=15.00` — confirma que cash_game aceita valor manual sem depender de `taxa_casa_percentual`/`taxa_casa_por_hora` |
| Ler `sessoes_poker`/`participantes_sessao` como `garcom` | `select count(*)` | **0 em ambas** — isolamento de RLS intacto com a coluna nova |

Dados de teste removidos ao final — banco voltou a 0 linhas em todas as tabelas de negócio. Advisor de segurança (`get_advisors`, tipo `security`) = **0 avisos**.

## Fora de escopo (não implementado)

- Pix/Mercado Pago (Fase 3, adiada a pedido do cliente).
- Rastreamento de pote por pote / cálculo automático de rake por mão.
- Tela de distribuição de prêmios por colocação em torneio.
- Relatórios consolidados (comissão por garçom, fechamento agregado de poker) — Fase 5, painel admin.
