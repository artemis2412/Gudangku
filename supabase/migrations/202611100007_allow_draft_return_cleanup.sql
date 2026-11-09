grant delete on public.stock_returns to authenticated;
create policy "Creators and managers can delete draft returns" on public.stock_returns for delete to authenticated
using(status='DRAFT' and (created_by=(select auth.uid()) or exists(select 1 from public.organization_members m where m.organization_id=stock_returns.organization_id and m.user_id=(select auth.uid()) and m.role in('owner','admin','manager'))));
