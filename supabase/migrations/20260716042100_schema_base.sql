-- Schema base do Texas Beer (bar + poker).
-- Timezone de toda a aplicação: America/Sao_Paulo (timestamptz armazenado em UTC,
-- convertido na camada de apresentação).

create extension if not exists "pgcrypto";

create type user_role as enum ('garcom', 'admin', 'operador_poker');
create type mesa_status as enum ('livre', 'ocupada', 'aguardando_pagamento');
create type sessao_tipo as enum ('torneio', 'cash_game');
create type sessao_status as enum ('aberta', 'encerrada');
create type participante_status as enum ('ativo', 'eliminado', 'cashout');
create type comanda_status as enum ('aberta', 'aguardando_pagamento', 'fechada');
create type produto_setor as enum ('bar', 'cozinha', 'churrasqueira');
create type pedido_status as enum ('enviado', 'em_preparo', 'pronto');
create type pagamento_metodo as enum ('pix', 'cartao', 'dinheiro');
create type pagamento_status as enum ('pendente', 'pago', 'expirado');

-- usuarios: perfil de aplicação ligado a auth.users (Supabase Auth cuida de
-- senha/sessão — não há coluna senha_hash aqui).
create table usuarios (
  id uuid primary key references auth.users (id) on delete cascade,
  nome text not null,
  email text not null,
  role user_role not null default 'garcom',
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);

-- cria a linha de perfil automaticamente quando um usuário é criado no Auth.
-- role/nome iniciais vêm de raw_user_meta_data (definidos pelo admin ao convidar o usuário).
create function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.usuarios (id, nome, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nome', new.email),
    new.email,
    coalesce((new.raw_user_meta_data ->> 'role')::user_role, 'garcom')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

create table mesas (
  id uuid primary key default gen_random_uuid(),
  numero integer not null unique,
  status mesa_status not null default 'livre',
  criado_em timestamptz not null default now()
);

create table sessoes_poker (
  id uuid primary key default gen_random_uuid(),
  tipo sessao_tipo not null,
  nome text not null,
  data_inicio timestamptz not null default now(),
  data_fim timestamptz,
  buy_in_valor numeric(12, 2) not null check (buy_in_valor > 0),
  taxa_casa_percentual numeric(5, 2) not null default 15 check (taxa_casa_percentual >= 0 and taxa_casa_percentual <= 100),
  taxa_casa_por_hora numeric(12, 2) check (taxa_casa_por_hora >= 0),
  status sessao_status not null default 'aberta',
  criado_em timestamptz not null default now(),
  constraint chk_sessao_data_fim check (data_fim is null or data_fim >= data_inicio),
  constraint chk_sessao_taxa_por_tipo check (
    (tipo = 'torneio' and taxa_casa_por_hora is null)
    or (tipo = 'cash_game')
  )
);

create table participantes_sessao (
  id uuid primary key default gen_random_uuid(),
  sessao_id uuid not null references sessoes_poker (id) on delete cascade,
  nome_jogador text not null,
  buy_in_inicial numeric(12, 2) not null check (buy_in_inicial > 0),
  status participante_status not null default 'ativo',
  valor_cashout numeric(12, 2) check (valor_cashout >= 0),
  criado_em timestamptz not null default now(),
  constraint chk_cashout_preenchido check (
    (status = 'cashout' and valor_cashout is not null)
    or (status <> 'cashout')
  )
);

create table rebuys (
  id uuid primary key default gen_random_uuid(),
  participante_sessao_id uuid not null references participantes_sessao (id) on delete cascade,
  valor numeric(12, 2) not null check (valor > 0),
  registrado_por uuid not null references usuarios (id),
  criado_em timestamptz not null default now()
);

create table comandas (
  id uuid primary key default gen_random_uuid(),
  mesa_id uuid references mesas (id),
  participante_sessao_id uuid references participantes_sessao (id),
  garcom_id uuid not null references usuarios (id),
  status comanda_status not null default 'aberta',
  aberta_em timestamptz not null default now(),
  fechada_em timestamptz,
  constraint chk_comanda_um_vinculo check (
    ((mesa_id is not null)::int + (participante_sessao_id is not null)::int) = 1
  ),
  constraint chk_comanda_fechada_em check (
    (status = 'fechada' and fechada_em is not null)
    or (status <> 'fechada')
  )
);

create table produtos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  preco numeric(12, 2) not null check (preco >= 0),
  categoria text not null,
  setor_destino produto_setor not null,
  disponivel boolean not null default true
);

create table itens_comanda (
  id uuid primary key default gen_random_uuid(),
  comanda_id uuid not null references comandas (id) on delete cascade,
  produto_id uuid not null references produtos (id),
  quantidade integer not null check (quantidade > 0),
  preco_unitario_no_momento numeric(12, 2) not null check (preco_unitario_no_momento >= 0),
  lancado_por uuid not null references usuarios (id),
  lancado_em timestamptz not null default now(),
  cancelado boolean not null default false,
  motivo_cancelamento text,
  constraint chk_cancelamento_com_motivo check (
    (cancelado = true and motivo_cancelamento is not null)
    or (cancelado = false)
  )
);

create table pedidos (
  id uuid primary key default gen_random_uuid(),
  comanda_id uuid not null references comandas (id) on delete cascade,
  setor_destino produto_setor not null,
  status pedido_status not null default 'enviado',
  enviado_em timestamptz not null default now()
);

create table pagamentos (
  id uuid primary key default gen_random_uuid(),
  comanda_id uuid not null references comandas (id) on delete cascade,
  valor numeric(12, 2) not null check (valor > 0),
  metodo pagamento_metodo not null,
  status pagamento_status not null default 'pendente',
  mp_payment_id text unique,
  qr_code_base64 text,
  criado_em timestamptz not null default now(),
  confirmado_em timestamptz,
  constraint chk_pagamento_confirmado_em check (
    (status = 'pago' and confirmado_em is not null)
    or (status <> 'pago')
  )
);

create index idx_participantes_sessao_sessao_id on participantes_sessao (sessao_id);
create index idx_rebuys_participante_sessao_id on rebuys (participante_sessao_id);
create index idx_comandas_mesa_id on comandas (mesa_id) where mesa_id is not null;
create index idx_comandas_participante_sessao_id on comandas (participante_sessao_id) where participante_sessao_id is not null;
create index idx_comandas_status on comandas (status);
create index idx_itens_comanda_comanda_id on itens_comanda (comanda_id);
create index idx_pedidos_comanda_id on pedidos (comanda_id);
create index idx_pedidos_status on pedidos (status);
create index idx_pagamentos_comanda_id on pagamentos (comanda_id);
create index idx_pagamentos_mp_payment_id on pagamentos (mp_payment_id) where mp_payment_id is not null;
