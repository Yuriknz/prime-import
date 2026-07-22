-- Emissão de NFC-e: dados fiscais por produto + registro de notas por comanda.
create type nota_fiscal_status as enum ('pendente', 'processando', 'autorizada', 'erro', 'cancelada');

-- 1:1 com produtos, em tabela separada para deixar o cadastro fiscal opcional
-- (produto pode existir sem dados fiscais ainda; o fechamento da comanda não
-- pode travar por isso — ver contingência na Server Action fecharComanda).
create table produtos_fiscais (
  produto_id uuid primary key references produtos (id) on delete cascade,
  ncm text not null,
  cfop text not null default '5102',
  unidade_comercial text not null default 'UN',
  cest text, -- obrigatório para bebidas alcoólicas em geral (regime de ICMS-ST)
  csosn text, -- Simples Nacional
  cst text, -- regime normal, alternativa ao csosn
  origem smallint not null default 0 check (origem between 0 and 8),
  atualizado_em timestamptz not null default now(),
  constraint chk_produtos_fiscais_csosn_ou_cst check (csosn is not null or cst is not null)
);

-- No máximo uma nota por comanda: reemissão atualiza a mesma linha via upsert
-- por comanda_id (unique), nunca cria uma segunda nota para a mesma comanda.
create table notas_fiscais (
  id uuid primary key default gen_random_uuid(),
  comanda_id uuid not null unique references comandas (id) on delete cascade,
  pagamento_id uuid references pagamentos (id),
  status nota_fiscal_status not null default 'pendente',
  provider text not null default 'focus_nfe',
  provider_ref text,
  chave_acesso text,
  valor_total numeric(12, 2) not null check (valor_total >= 0),
  payload_enviado jsonb,
  resposta_provider jsonb,
  erro_mensagem text,
  tentativas integer not null default 0,
  criada_em timestamptz not null default now(),
  atualizada_em timestamptz not null default now(),
  autorizada_em timestamptz
);

create index idx_notas_fiscais_status on notas_fiscais (status);
