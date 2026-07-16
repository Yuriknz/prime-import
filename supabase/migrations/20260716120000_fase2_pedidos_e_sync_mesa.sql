-- Fase 2: liga itens_comanda aos pedidos por setor, sincroniza mesas.status a
-- partir de comandas, e adiciona RPC atômica para o envio de pedido.

-- itens_comanda só passa a existir no banco no momento do envio do pedido
-- (o carrinho antes disso é só estado do client) — por isso pedido_id é obrigatório.
alter table itens_comanda
  add column pedido_id uuid not null references pedidos (id) on delete cascade;

create index idx_itens_comanda_pedido_id on itens_comanda (pedido_id);

-- Impede duas comandas abertas na mesma mesa ao mesmo tempo: o segundo insert
-- concorrente falha com 23505 em vez de precisar de lock/retry em aplicação.
create unique index uniq_comanda_mesa_aberta on comandas (mesa_id) where status <> 'fechada';

-- Mantém mesas.status em sincronia com o ciclo de vida da comanda vinculada a
-- ela (comandas de sessão de poker, sem mesa_id, não disparam a trigger).
create function public.sync_mesa_status_from_comanda()
returns trigger
language plpgsql
as $$
begin
  update mesas
  set status = case new.status
    when 'aberta' then 'ocupada'
    when 'aguardando_pagamento' then 'aguardando_pagamento'
    when 'fechada' then 'livre'
  end::mesa_status
  where id = new.mesa_id;
  return new;
end;
$$;

create trigger trg_sync_mesa_status_from_comanda
  after insert or update of status on comandas
  for each row
  when (new.mesa_id is not null)
  execute function public.sync_mesa_status_from_comanda();

-- Envia um pedido: agrupa os itens do carrinho por setor_destino (resolvido a
-- partir de produtos, nunca confiando em valor vindo do client) e cria 1 linha
-- em pedidos por setor + as linhas de itens_comanda correspondentes, tudo numa
-- única transação (execução de função PL/pgSQL é atômica). SECURITY INVOKER
-- (padrão, sem "security definer") para que as RLS policies de pedidos e
-- itens_comanda continuem valendo com o usuário real que está enviando.
create function public.enviar_pedido(p_comanda_id uuid, p_itens jsonb)
returns void
language plpgsql
as $$
declare
  v_setor produto_setor;
  v_pedido_id uuid;
begin
  for v_setor in
    select distinct produtos.setor_destino
    from jsonb_to_recordset(p_itens) as item(produto_id uuid, quantidade int)
    join produtos on produtos.id = item.produto_id
  loop
    insert into pedidos (comanda_id, setor_destino)
    values (p_comanda_id, v_setor)
    returning id into v_pedido_id;

    insert into itens_comanda (
      comanda_id, produto_id, quantidade, preco_unitario_no_momento, lancado_por, pedido_id
    )
    select
      p_comanda_id,
      produtos.id,
      item.quantidade,
      produtos.preco,
      auth.uid(),
      v_pedido_id
    from jsonb_to_recordset(p_itens) as item(produto_id uuid, quantidade int)
    join produtos on produtos.id = item.produto_id
    where produtos.setor_destino = v_setor;
  end loop;
end;
$$;
