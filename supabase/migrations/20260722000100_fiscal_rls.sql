-- RLS de produtos_fiscais e notas_fiscais, seguindo o mesmo padrão de
-- current_user_role() já usado no restante do schema. A função foi movida
-- para o schema `private` em 20260716042300_move_definer_functions_private.sql
-- (não é mais chamável via public.current_user_role()).

-- ============================================================
-- produtos_fiscais (mesmo domínio de `produtos`: leitura garcom+admin, gestão só admin)
-- ============================================================
alter table produtos_fiscais enable row level security;

create policy produtos_fiscais_select on produtos_fiscais
  for select
  using (private.current_user_role() in ('garcom', 'admin'));

create policy produtos_fiscais_insert on produtos_fiscais
  for insert
  with check (private.current_user_role() = 'admin');

create policy produtos_fiscais_update on produtos_fiscais
  for update
  using (private.current_user_role() = 'admin')
  with check (private.current_user_role() = 'admin');

create policy produtos_fiscais_delete on produtos_fiscais
  for delete
  using (private.current_user_role() = 'admin');

-- ============================================================
-- notas_fiscais (mesmo domínio de `pagamentos`: o fluxo roda dentro de
-- fecharComanda com o client autenticado do garçom; admin tem acesso total
-- para reprocessar manualmente)
-- ============================================================
alter table notas_fiscais enable row level security;

create policy notas_fiscais_select on notas_fiscais
  for select
  using (private.current_user_role() in ('garcom', 'admin'));

create policy notas_fiscais_insert on notas_fiscais
  for insert
  with check (private.current_user_role() in ('garcom', 'admin'));

create policy notas_fiscais_update on notas_fiscais
  for update
  using (private.current_user_role() in ('garcom', 'admin'))
  with check (private.current_user_role() in ('garcom', 'admin'));

create policy notas_fiscais_delete on notas_fiscais
  for delete
  using (private.current_user_role() = 'admin');
