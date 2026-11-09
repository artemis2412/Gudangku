-- Public RPC wrapper for the private, role-checked atomic posting function.
create or replace function public.post_stock_document(p_document_id uuid)
returns void
language sql
security invoker
set search_path = ''
as $$
  select private.post_stock_document(p_document_id);
$$;

revoke all on function public.post_stock_document(uuid) from public;
grant execute on function public.post_stock_document(uuid) to authenticated;
