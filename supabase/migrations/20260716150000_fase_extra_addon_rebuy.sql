-- Diferencia rebuy de add-on (ambos entram como dinheiro na sessão, mas o
-- operador precisa poder registrar/relatar cada um separadamente).
create type rebuy_tipo as enum ('rebuy', 'addon');

alter table rebuys add column tipo rebuy_tipo not null default 'rebuy';
