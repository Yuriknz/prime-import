-- Fase 5: separa a taxa de serviço opcional (Fase 2) do restante do valor
-- pago, necessário pro relatório de comissão por garçom.
alter table pagamentos
  add column taxa_servico_valor numeric(12, 2) not null default 0 check (taxa_servico_valor >= 0);
