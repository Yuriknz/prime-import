-- RLS explícito por role em cada tabela. Nenhuma tabela fica com RLS aberto.
--
-- Isolamento de domínio:
--   garcom          -> mesas, comandas, itens_comanda, pedidos, pagamentos, produtos (leitura)
--   operador_poker  -> sessoes_poker, participantes_sessao, rebuys
--   admin           -> acesso total a tudo
--
-- garcom NUNCA acessa sessoes_poker/participantes_sessao/rebuys.
-- operador_poker NUNCA acessa comandas/itens_comanda/pedidos/pagamentos.

-- current_user_role() é SECURITY DEFINER para poder ler a linha de `usuarios`
-- do próprio usuário sem recursão de RLS (uma policy em `usuarios` que
-- consultasse `usuarios` diretamente entraria em loop).
create function public.current_user_role()
returns user_role
language sql
security definer
set search_path = public
stable
as $$
  select role from public.usuarios where id = auth.uid() and ativo = true;
$$;

-- ============================================================
-- usuarios
-- ============================================================
alter table usuarios enable row level security;

-- Diretório interno: qualquer usuário autenticado e ativo pode ver nome/role
-- dos colegas ativos (necessário para exibir "lançado por"/"registrado por").
-- Admin vê todos, inclusive inativos.
create policy usuarios_select on usuarios
  for select
  using (
    public.current_user_role() = 'admin'
    or (ativo = true and public.current_user_role() is not null)
  );

-- Criação de perfil acontece via trigger (security definer) no signup;
-- só admin insere diretamente (ex: backfill).
create policy usuarios_insert_admin on usuarios
  for insert
  with check (public.current_user_role() = 'admin');

create policy usuarios_update_admin on usuarios
  for update
  using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

create policy usuarios_delete_admin on usuarios
  for delete
  using (public.current_user_role() = 'admin');

-- ============================================================
-- mesas (domínio garçom)
-- ============================================================
alter table mesas enable row level security;

create policy mesas_select on mesas
  for select
  using (public.current_user_role() in ('garcom', 'admin'));

create policy mesas_insert on mesas
  for insert
  with check (public.current_user_role() = 'admin');

create policy mesas_update on mesas
  for update
  using (public.current_user_role() in ('garcom', 'admin'))
  with check (public.current_user_role() in ('garcom', 'admin'));

create policy mesas_delete on mesas
  for delete
  using (public.current_user_role() = 'admin');

-- ============================================================
-- sessoes_poker (domínio operador_poker) — garcom SEM acesso
-- ============================================================
alter table sessoes_poker enable row level security;

create policy sessoes_poker_select on sessoes_poker
  for select
  using (public.current_user_role() in ('operador_poker', 'admin'));

create policy sessoes_poker_insert on sessoes_poker
  for insert
  with check (public.current_user_role() in ('operador_poker', 'admin'));

create policy sessoes_poker_update on sessoes_poker
  for update
  using (public.current_user_role() in ('operador_poker', 'admin'))
  with check (public.current_user_role() in ('operador_poker', 'admin'));

create policy sessoes_poker_delete on sessoes_poker
  for delete
  using (public.current_user_role() = 'admin');

-- ============================================================
-- participantes_sessao (domínio operador_poker) — garcom SEM acesso
-- ============================================================
alter table participantes_sessao enable row level security;

create policy participantes_sessao_select on participantes_sessao
  for select
  using (public.current_user_role() in ('operador_poker', 'admin'));

create policy participantes_sessao_insert on participantes_sessao
  for insert
  with check (public.current_user_role() in ('operador_poker', 'admin'));

create policy participantes_sessao_update on participantes_sessao
  for update
  using (public.current_user_role() in ('operador_poker', 'admin'))
  with check (public.current_user_role() in ('operador_poker', 'admin'));

create policy participantes_sessao_delete on participantes_sessao
  for delete
  using (public.current_user_role() = 'admin');

-- ============================================================
-- rebuys (domínio operador_poker) — garcom SEM acesso
-- ============================================================
alter table rebuys enable row level security;

create policy rebuys_select on rebuys
  for select
  using (public.current_user_role() in ('operador_poker', 'admin'));

create policy rebuys_insert on rebuys
  for insert
  with check (
    public.current_user_role() = 'admin'
    or (public.current_user_role() = 'operador_poker' and registrado_por = auth.uid())
  );

create policy rebuys_update on rebuys
  for update
  using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

create policy rebuys_delete on rebuys
  for delete
  using (public.current_user_role() = 'admin');

-- ============================================================
-- comandas (domínio garçom) — operador_poker SEM acesso
-- ============================================================
alter table comandas enable row level security;

create policy comandas_select on comandas
  for select
  using (public.current_user_role() in ('garcom', 'admin'));

create policy comandas_insert on comandas
  for insert
  with check (
    public.current_user_role() = 'admin'
    or (public.current_user_role() = 'garcom' and garcom_id = auth.uid())
  );

create policy comandas_update on comandas
  for update
  using (public.current_user_role() in ('garcom', 'admin'))
  with check (public.current_user_role() in ('garcom', 'admin'));

create policy comandas_delete on comandas
  for delete
  using (public.current_user_role() = 'admin');

-- ============================================================
-- produtos (cardápio — leitura para garçom, gestão só admin)
-- ============================================================
alter table produtos enable row level security;

create policy produtos_select on produtos
  for select
  using (public.current_user_role() in ('garcom', 'admin'));

create policy produtos_insert on produtos
  for insert
  with check (public.current_user_role() = 'admin');

create policy produtos_update on produtos
  for update
  using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

create policy produtos_delete on produtos
  for delete
  using (public.current_user_role() = 'admin');

-- ============================================================
-- itens_comanda (domínio garçom) — operador_poker SEM acesso
-- ============================================================
alter table itens_comanda enable row level security;

create policy itens_comanda_select on itens_comanda
  for select
  using (public.current_user_role() in ('garcom', 'admin'));

create policy itens_comanda_insert on itens_comanda
  for insert
  with check (
    public.current_user_role() = 'admin'
    or (public.current_user_role() = 'garcom' and lancado_por = auth.uid())
  );

create policy itens_comanda_update on itens_comanda
  for update
  using (public.current_user_role() in ('garcom', 'admin'))
  with check (public.current_user_role() in ('garcom', 'admin'));

create policy itens_comanda_delete on itens_comanda
  for delete
  using (public.current_user_role() = 'admin');

-- ============================================================
-- pedidos (domínio garçom) — operador_poker SEM acesso
-- ============================================================
alter table pedidos enable row level security;

create policy pedidos_select on pedidos
  for select
  using (public.current_user_role() in ('garcom', 'admin'));

create policy pedidos_insert on pedidos
  for insert
  with check (public.current_user_role() in ('garcom', 'admin'));

create policy pedidos_update on pedidos
  for update
  using (public.current_user_role() in ('garcom', 'admin'))
  with check (public.current_user_role() in ('garcom', 'admin'));

create policy pedidos_delete on pedidos
  for delete
  using (public.current_user_role() = 'admin');

-- ============================================================
-- pagamentos (domínio garçom) — operador_poker SEM acesso.
-- O webhook do Mercado Pago usa a service_role key (bypassa RLS) para
-- confirmar pagamento; estas policies cobrem o app cliente/admin.
-- ============================================================
alter table pagamentos enable row level security;

create policy pagamentos_select on pagamentos
  for select
  using (public.current_user_role() in ('garcom', 'admin'));

create policy pagamentos_insert on pagamentos
  for insert
  with check (public.current_user_role() in ('garcom', 'admin'));

create policy pagamentos_update on pagamentos
  for update
  using (public.current_user_role() in ('garcom', 'admin'))
  with check (public.current_user_role() in ('garcom', 'admin'));

create policy pagamentos_delete on pagamentos
  for delete
  using (public.current_user_role() = 'admin');
