-- Restrict inventory transaction RPCs to authenticated callers.
-- Internal SECURITY DEFINER functions retain their explicit auth.uid() and
-- organization-role checks; anonymous callers must not be able to invoke them.

revoke all on function private.complete_stock_count(uuid) from public, anon;
revoke all on function private.post_stock_document(uuid) from public, anon;
revoke all on function private.record_customer_payment(uuid,numeric,text,text,text) from public, anon;
revoke all on function private.record_supplier_payment(uuid,numeric,text,text,text) from public, anon;
revoke all on function private.post_stock_return(uuid) from public, anon;
revoke all on function private.record_stock_return_settlement(uuid,numeric,text,text,text) from public, anon;

grant execute on function private.complete_stock_count(uuid) to authenticated;
grant execute on function private.post_stock_document(uuid) to authenticated;
grant execute on function private.record_customer_payment(uuid,numeric,text,text,text) to authenticated;
grant execute on function private.record_supplier_payment(uuid,numeric,text,text,text) to authenticated;
grant execute on function private.post_stock_return(uuid) to authenticated;
grant execute on function private.record_stock_return_settlement(uuid,numeric,text,text,text) to authenticated;

revoke all on function public.complete_stock_count(uuid) from public, anon;
revoke all on function public.post_stock_document(uuid) from public, anon;
revoke all on function public.record_customer_payment(uuid,numeric,text,text,text) from public, anon;
revoke all on function public.record_supplier_payment(uuid,numeric,text,text,text) from public, anon;
revoke all on function public.post_stock_return(uuid) from public, anon;
revoke all on function public.record_stock_return_settlement(uuid,numeric,text,text,text) from public, anon;

grant execute on function public.complete_stock_count(uuid) to authenticated;
grant execute on function public.post_stock_document(uuid) to authenticated;
grant execute on function public.record_customer_payment(uuid,numeric,text,text,text) to authenticated;
grant execute on function public.record_supplier_payment(uuid,numeric,text,text,text) to authenticated;
grant execute on function public.post_stock_return(uuid) to authenticated;
grant execute on function public.record_stock_return_settlement(uuid,numeric,text,text,text) to authenticated;
