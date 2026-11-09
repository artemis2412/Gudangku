create index if not exists stock_movements_stock_return_id_idx on public.stock_movements(stock_return_id) where stock_return_id is not null;
create or replace function private.post_stock_return(p_return_id uuid)
returns void language plpgsql security definer set search_path=''
as $function$
declare
 v_user uuid:=auth.uid(); v_return public.stock_returns%rowtype;
 v_original public.stock_documents%rowtype; v_item public.stock_return_items%rowtype;
 v_source public.stock_document_items%rowtype; v_role text; v_expected_warehouse uuid;
 v_returned numeric(18,3); v_balance numeric(18,3); v_delta numeric(18,3);
begin
 if v_user is null then raise exception 'Authentication required'; end if;
 select * into v_return from public.stock_returns where id=p_return_id for update;
 if not found then raise exception 'Return document not found'; end if;
 select m.role into v_role from public.organization_members m where m.organization_id=v_return.organization_id and m.user_id=v_user;
 if v_role is null or v_role not in('owner','admin','manager') then raise exception 'Insufficient permission to post return'; end if;
 if v_return.status<>'DRAFT' then raise exception 'Only draft returns can be posted'; end if;
 select * into v_original from public.stock_documents where id=v_return.original_document_id and organization_id=v_return.organization_id for update;
 if not found or v_original.status<>'POSTED' then raise exception 'Original transaction must be posted'; end if;
 if (v_return.return_type='SALES' and v_original.document_type<>'OUT') or (v_return.return_type='PURCHASE' and v_original.document_type<>'IN') then raise exception 'Return type does not match original transaction'; end if;
 v_expected_warehouse:=case when v_return.return_type='SALES' then v_original.source_warehouse_id else v_original.destination_warehouse_id end;
 if v_return.warehouse_id<>v_expected_warehouse then raise exception 'Return warehouse must match the original transaction warehouse'; end if;
 if v_return.return_type='SALES' and v_return.customer_id is distinct from v_original.customer_id then raise exception 'Customer does not match original transaction'; end if;
 if v_return.return_type='PURCHASE' and v_return.supplier_id is distinct from v_original.supplier_id then raise exception 'Supplier does not match original transaction'; end if;
 if not exists(select 1 from public.stock_return_items where stock_return_id=v_return.id and organization_id=v_return.organization_id) then raise exception 'Return must contain at least one item'; end if;
 for v_item in select * from public.stock_return_items where stock_return_id=v_return.id and organization_id=v_return.organization_id order by product_id for update loop
  select * into v_source from public.stock_document_items where id=v_item.original_document_item_id and document_id=v_original.id and organization_id=v_return.organization_id;
  if not found or v_source.product_id<>v_item.product_id then raise exception 'Return item does not belong to original transaction'; end if;
  select coalesce(sum(ri.quantity),0) into v_returned from public.stock_return_items ri join public.stock_returns r on r.id=ri.stock_return_id and r.organization_id=ri.organization_id where ri.original_document_item_id=v_source.id and r.status='POSTED';
  if v_returned+v_item.quantity>v_source.quantity then raise exception 'Return quantity exceeds remaining quantity for product %',v_item.product_id; end if;
  if v_return.return_type='SALES' then
   v_delta:=v_item.quantity;
   insert into public.stock_balances as b(organization_id,warehouse_id,product_id,quantity,updated_at) values(v_return.organization_id,v_return.warehouse_id,v_item.product_id,v_delta,now())
   on conflict(organization_id,warehouse_id,product_id) do update set quantity=b.quantity+excluded.quantity,updated_at=now();
   insert into public.stock_movements(organization_id,document_id,document_item_id,stock_count_id,stock_return_id,warehouse_id,product_id,movement_type,quantity_delta,unit_cost,occurred_at)
   values(v_return.organization_id,null,null,null,v_return.id,v_return.warehouse_id,v_item.product_id,'SALES_RETURN_IN',v_delta,v_item.unit_cost,v_return.occurred_at);
  else
   select b.quantity into v_balance from public.stock_balances b where b.organization_id=v_return.organization_id and b.warehouse_id=v_return.warehouse_id and b.product_id=v_item.product_id for update;
   if not found then v_balance:=0; end if;
   if v_balance<v_item.quantity then raise exception 'Insufficient stock to return product %',v_item.product_id; end if;
   update public.stock_balances set quantity=quantity-v_item.quantity,updated_at=now() where organization_id=v_return.organization_id and warehouse_id=v_return.warehouse_id and product_id=v_item.product_id;
   insert into public.stock_movements(organization_id,document_id,document_item_id,stock_count_id,stock_return_id,warehouse_id,product_id,movement_type,quantity_delta,unit_cost,occurred_at)
   values(v_return.organization_id,null,null,null,v_return.id,v_return.warehouse_id,v_item.product_id,'PURCHASE_RETURN_OUT',-v_item.quantity,v_item.unit_cost,v_return.occurred_at);
  end if;
 end loop;
 update public.stock_returns set status='POSTED',posted_by=v_user,posted_at=now() where id=v_return.id and organization_id=v_return.organization_id;
 insert into public.audit_logs(organization_id,actor_user_id,action,entity_type,entity_id,details)
 values(v_return.organization_id,v_user,'POST_STOCK_RETURN','stock_return',v_return.id,jsonb_build_object('return_number',v_return.return_number,'return_type',v_return.return_type,'original_document_id',v_return.original_document_id));
end;$function$;
revoke all on function private.post_stock_return(uuid) from public,anon;
grant execute on function private.post_stock_return(uuid) to authenticated;
create or replace function public.post_stock_return(p_return_id uuid)
returns void language sql security invoker set search_path='' as $$select private.post_stock_return(p_return_id);$$;
revoke all on function public.post_stock_return(uuid) from public,anon;
grant execute on function public.post_stock_return(uuid) to authenticated;
