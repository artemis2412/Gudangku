alter table public.stock_movements
  alter column document_id drop not null,
  alter column document_item_id drop not null;
alter table public.stock_movements
  add column stock_count_id uuid null references public.stock_counts(id) on delete restrict;
alter table public.stock_movements
  add constraint stock_movements_source_check
  check (
    (document_id is not null and document_item_id is not null and stock_count_id is null)
    or
    (document_id is null and document_item_id is null and stock_count_id is not null)
  );
create index stock_movements_stock_count_id_idx on public.stock_movements(stock_count_id) where stock_count_id is not null;

create or replace function private.complete_stock_count(p_stock_count_id uuid)
returns void language plpgsql security definer set search_path = pg_catalog, public
as $function$
declare
  v_user_id uuid := auth.uid();
  v_count public.stock_counts%rowtype;
  v_item public.stock_count_items%rowtype;
  v_role text;
  v_current numeric(18,3);
  v_delta numeric(18,3);
  v_unit_cost numeric(18,2);
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  select * into v_count from public.stock_counts where id = p_stock_count_id for update;
  if not found then raise exception 'Stock count not found'; end if;
  select m.role into v_role from public.organization_members m where m.organization_id = v_count.organization_id and m.user_id = v_user_id;
  if v_role is null or v_role not in ('owner','admin','manager') then raise exception 'Insufficient permission to complete stock count'; end if;
  if v_count.status <> 'DRAFT' then raise exception 'Only draft stock counts can be completed'; end if;
  if not exists (select 1 from public.stock_count_items i where i.organization_id = v_count.organization_id and i.stock_count_id = v_count.id) then raise exception 'Stock count must contain at least one item'; end if;
  for v_item in
    select * from public.stock_count_items where organization_id = v_count.organization_id and stock_count_id = v_count.id order by product_id for update
  loop
    v_current := 0;
    select b.quantity into v_current from public.stock_balances b
    where b.organization_id = v_count.organization_id and b.warehouse_id = v_count.warehouse_id and b.product_id = v_item.product_id for update;
    if not found then v_current := 0; end if;
    if v_current <> v_item.system_quantity then raise exception 'Stock changed during count for product %; refresh this count before completing', v_item.product_id; end if;
    v_delta := v_item.counted_quantity - v_current;
    if v_delta <> 0 then
      select coalesce(p.purchase_price, 0) into v_unit_cost from public.products p where p.organization_id = v_count.organization_id and p.id = v_item.product_id;
      insert into public.stock_balances(organization_id, warehouse_id, product_id, quantity, updated_at)
      values (v_count.organization_id, v_count.warehouse_id, v_item.product_id, v_item.counted_quantity, now())
      on conflict (organization_id, warehouse_id, product_id) do update set quantity = excluded.quantity, updated_at = now();
      insert into public.stock_movements(organization_id, document_id, document_item_id, stock_count_id, warehouse_id, product_id, movement_type, quantity_delta, unit_cost, occurred_at)
      values (v_count.organization_id, null, null, v_count.id, v_count.warehouse_id, v_item.product_id,
        case when v_delta > 0 then 'ADJUSTMENT_IN' else 'ADJUSTMENT_OUT' end, v_delta, v_unit_cost, v_count.counted_at);
    end if;
  end loop;
  update public.stock_counts set status = 'COMPLETED', completed_at = now(), completed_by = v_user_id where id = v_count.id and organization_id = v_count.organization_id;
  insert into public.audit_logs(organization_id, actor_user_id, action, entity_type, entity_id, details)
  values (v_count.organization_id, v_user_id, 'COMPLETE_STOCK_COUNT', 'stock_count', v_count.id, jsonb_build_object('count_number', v_count.count_number, 'warehouse_id', v_count.warehouse_id));
end;
$function$;

create or replace function public.complete_stock_count(p_stock_count_id uuid)
returns void language sql security invoker set search_path = ''
as $$ select private.complete_stock_count(p_stock_count_id); $$;
revoke all on function public.complete_stock_count(uuid) from public;
grant execute on function public.complete_stock_count(uuid) to authenticated;
