-- Corrige aviso do advisor de segurança (function_search_path_mutable),
-- mesmo padrão já usado nas funções da fase 1.
alter function public.sync_mesa_status_from_comanda() set search_path = public;
alter function public.enviar_pedido(uuid, jsonb) set search_path = public;
