# Fase 5 — Painel admin (relatórios + CRUD de produtos/mesas/usuários)

Última fase da ordem original (Fase 3/Pix segue adiada a pedido do cliente).

## O que foi entregue

- `/admin` reorganizado num route group `(admin)` com layout compartilhado (nav Início/Relatórios/Produtos/Mesas/Usuários), substituindo o placeholder da Fase 2. `ROLE_HOME.admin` passou de `/mesas` para `/admin`.
- **Relatórios** (`/admin/relatorios`): filtro de período via querystring (form GET simples, sem JS), com 4 seções — vendas por período (total, ticket médio, tabela por dia), produtos mais vendidos (top 10), comissão por garçom, fechamento de sessões de poker (arrecadado/rake/pool). Todas as agregações feitas em JS a partir de queries filtradas, mesmo padrão das Fases 2 e 4.
- **Produtos** (`/admin/produtos`): lista + criar/editar via `ProdutoDialog` compartilhado. Sem exclusão física — "indisponível" é a forma de retirar do cardápio.
- **Mesas** (`/admin/mesas`): lista + criar (número) + excluir (com tratamento de erro de FK — `23503` vira mensagem amigável em vez de estourar).
- **Usuários** (`/admin/usuarios`): lista + criar via `NovoUsuarioDialog`, que usa `createServiceClient()` (`src/lib/supabase/service.ts`, criado na Fase 1 e usado pela primeira vez aqui) para chamar `auth.admin.createUser` — o trigger `handle_new_auth_user` já popula `usuarios` automaticamente. Toggle de role e ativo/inativo inline por linha.

## Decisões de arquitetura (esclarecidas com o usuário)

- **Comissão por garçom** = a taxa de serviço opcional de 10% (Fase 2) cobrada nas comandas fechadas por aquele garçom — não um percentual configurável separado.
- **Escopo da fase**: além dos 4 relatórios pedidos originalmente, inclui CRUD básico de produtos/mesas/usuários (sem isso, cadastro só era possível via SQL/MCP, inviabilizando uso real do sistema).

## Migration nova

`supabase/migrations/20260716140000_fase5_taxa_servico_pagamento.sql`:
- `pagamentos.taxa_servico_valor numeric(12,2) not null default 0` — separa a taxa de serviço do restante do valor pago (antes só existia o total final combinado).

### Ajuste retroativo na Fase 2

`fecharComanda` (`src/app/(garcom)/comandas/[comandaId]/actions.ts`) ganhou um 4º parâmetro (`taxaServicoValor`); `FecharContaDialog` agora calcula e envia esse valor separadamente em vez de descartá-lo no `valorFinal`.

## Teste manual — passo a passo (executado em 2026-07-16)

### 1. Build e lint

```
npm run build
npm run lint
```
Resultado: build sem erro (rotas `/admin`, `/admin/relatorios`, `/admin/produtos`, `/admin/mesas`, `/admin/usuarios` geradas); lint sem warnings.

### 2. Fluxo ponta a ponta via SQL (simulando roles)

Criados usuários de teste (1 admin, 2 garçons), 1 produto (Chopp Fase5, R$12) e 2 mesas.

| Passo | Ação | Resultado |
|---|---|---|
| `garcom` tentando `insert into produtos` | direto no banco | **Bloqueado**: `42501 new row violates row-level security policy` |
| `garcom` tentando `update usuarios set role='admin'` (na própria linha) e `delete from mesas` | direto no banco | RLS filtra silenciosamente (0 linhas afetadas) — confirmado que nada mudou |
| Comanda 1 (garçom 1): 5× Chopp (R$60), fechada com taxa de serviço (R$6) → `pagamentos.valor=66, taxa_servico_valor=6` | | |
| Comanda 2 (garçom 2): 3× Chopp (R$36), fechada sem taxa → `pagamentos.valor=36, taxa_servico_valor=0` | | |
| Relatório "vendas no período" | `sum(valor)` | **R$102,00**, 2 pagamentos — bate com 66+36 |
| Relatório "comissão por garçom" | `sum(valor), sum(taxa_servico_valor)` agrupado | Garçom 1: vendas R$66 / comissão R$6. Garçom 2: vendas R$36 / comissão R$0 — bate exatamente |
| Relatório "produto mais vendido" | `sum(quantidade), sum(receita)` | Chopp Fase5: 8 unidades, R$96,00 — bate com 5+3 |

Dados de teste removidos ao final — banco voltou a 0 linhas em todas as tabelas de negócio. Advisor de segurança (`get_advisors`, tipo `security`) = **0 avisos**.

### Como reproduzir localmente

```bash
npm install
cp .env.local.example .env.local   # preencher com as credenciais reais, incluindo SUPABASE_SERVICE_ROLE_KEY
npm run dev
```

`SUPABASE_SERVICE_ROLE_KEY` é obrigatória pra `/admin/usuarios` funcionar (criação de usuário via `createServiceClient`) — já era uma pendência registrada desde a Fase 1.

## Fora de escopo

- Pix/Mercado Pago (Fase 3, segue adiada).
- Fluxo de convite por e-mail (sem SMTP configurado) — admin define senha inicial diretamente.
- Exclusão física de produtos, gráficos/dashboards visuais nos relatórios (tabelas simples).
