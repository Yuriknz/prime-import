-- current_user_role() e handle_new_auth_user() são SECURITY DEFINER e não
-- devem ser chamáveis via RPC público (PostgREST só expõe o schema `public`
-- por padrão). Movê-las para `private` remove o endpoint RPC sem quebrar as
-- policies existentes (pg_policy referencia a função por OID, não por nome).

create schema if not exists private;

alter function public.current_user_role() set schema private;
alter function public.handle_new_auth_user() set schema private;

revoke execute on function private.current_user_role() from public;
grant execute on function private.current_user_role() to authenticated, anon;

revoke execute on function private.handle_new_auth_user() from public;
