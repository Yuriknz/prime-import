-- Fase 4: guarda o rake final confirmado/informado no encerramento da sessão.
-- Torneio: derivável a qualquer momento via taxa_casa_percentual, mas o valor
-- final fica gravado aqui pra referência/relatório. Cash_game: o rake é
-- cobrado por pote na mesa (fora do app) — este é o único lugar onde ele
-- existe no banco, digitado manualmente pelo operador ao encerrar.
alter table sessoes_poker add column rake_total numeric(12, 2) check (rake_total >= 0);

alter table sessoes_poker add constraint chk_sessao_rake_ao_encerrar check (
  (status = 'encerrada' and rake_total is not null) or (status = 'aberta')
);
