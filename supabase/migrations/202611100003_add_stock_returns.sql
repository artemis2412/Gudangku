create table public.stock_returns (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
 return_number text not null, return_type text not null check(return_type in('SALES','PURCHASE')), original_document_id uuid not null,
 warehouse_id uuid not null, customer_id uuid null, supplier_id uuid null, status text not null default 'DRAFT' check(status in('DRAFT','POSTED','CANCELLED')),
 reason text null,total_amount numeric(18,2) not null default 0 check(total_amount>=0),created_by uuid not null references auth.users(id),
 posted_by uuid null references auth.users(id),occurred_at timestamptz not null default now(),posted_at timestamptz null,created_at timestamptz not null default now(),
 constraint stock_returns_org_number_unique unique(organization_id,return_number),constraint stock_returns_org_id_unique unique(organization_id,id),
 constraint stock_returns_original_fk foreign key(organization_id,original_document_id) references public.stock_documents(organization_id,id) on delete restrict,
 constraint stock_returns_warehouse_fk foreign key(organization_id,warehouse_id) references public.warehouses(organization_id,id),
 constraint stock_returns_customer_fk foreign key(customer_id,organization_id) references public.customers(id,organization_id),
 constraint stock_returns_supplier_fk foreign key(supplier_id,organization_id) references public.suppliers(id,organization_id),
 constraint stock_returns_party_check check((return_type='SALES' and supplier_id is null) or(return_type='PURCHASE' and customer_id is null))
);
create index stock_returns_org_date_idx on public.stock_returns(organization_id,occurred_at desc);
create index stock_returns_original_idx on public.stock_returns(original_document_id,status);
create table public.stock_return_items(
 id uuid primary key default gen_random_uuid(),organization_id uuid not null references public.organizations(id) on delete cascade,
 stock_return_id uuid not null,original_document_item_id uuid not null references public.stock_document_items(id) on delete restrict,
 product_id uuid not null,quantity numeric(18,3) not null check(quantity>0),unit_cost numeric(18,2) not null default 0 check(unit_cost>=0),
 unit_price numeric(18,2) not null default 0 check(unit_price>=0),line_total numeric(18,2) not null default 0 check(line_total>=0),
 created_at timestamptz not null default now(),
 constraint stock_return_items_return_org_fk foreign key(organization_id,stock_return_id) references public.stock_returns(organization_id,id) on delete cascade,
 constraint stock_return_items_product_org_fk foreign key(organization_id,product_id) references public.products(organization_id,id),
 constraint stock_return_items_unique_source unique(stock_return_id,original_document_item_id)
);
create index stock_return_items_original_idx on public.stock_return_items(original_document_item_id);
create index stock_return_items_return_org_idx on public.stock_return_items(stock_return_id,organization_id);
alter table public.stock_returns enable row level security;alter table public.stock_return_items enable row level security;
grant select,insert,update on public.stock_returns to authenticated;grant select,insert,update on public.stock_return_items to authenticated;
create policy "Members can view organization returns" on public.stock_returns for select to authenticated using(exists(select 1 from public.organization_members m where m.organization_id=stock_returns.organization_id and m.user_id=(select auth.uid())));
create policy "Staff can create draft returns" on public.stock_returns for insert to authenticated with check(status='DRAFT' and created_by=(select auth.uid()) and exists(select 1 from public.organization_members m where m.organization_id=stock_returns.organization_id and m.user_id=(select auth.uid()) and m.role in('owner','admin','manager','staff')));
create policy "Managers can update draft returns" on public.stock_returns for update to authenticated using(status='DRAFT' and exists(select 1 from public.organization_members m where m.organization_id=stock_returns.organization_id and m.user_id=(select auth.uid()) and m.role in('owner','admin','manager'))) with check(status='DRAFT' and created_by=(select auth.uid()));
create policy "Members can view return items" on public.stock_return_items for select to authenticated using(exists(select 1 from public.stock_returns r join public.organization_members m on m.organization_id=r.organization_id where r.id=stock_return_items.stock_return_id and r.organization_id=stock_return_items.organization_id and m.user_id=(select auth.uid())));
create policy "Staff can add items to draft returns" on public.stock_return_items for insert to authenticated with check(exists(select 1 from public.stock_returns r join public.organization_members m on m.organization_id=r.organization_id where r.id=stock_return_items.stock_return_id and r.organization_id=stock_return_items.organization_id and r.status='DRAFT' and r.created_by=(select auth.uid()) and m.user_id=(select auth.uid()) and m.role in('owner','admin','manager','staff')));
create policy "Managers can update draft return items" on public.stock_return_items for update to authenticated using(exists(select 1 from public.stock_returns r join public.organization_members m on m.organization_id=r.organization_id where r.id=stock_return_items.stock_return_id and r.organization_id=stock_return_items.organization_id and r.status='DRAFT' and m.user_id=(select auth.uid()) and m.role in('owner','admin','manager'))) with check(exists(select 1 from public.stock_returns r where r.id=stock_return_items.stock_return_id and r.organization_id=stock_return_items.organization_id and r.status='DRAFT'));
create policy "Managers can delete draft return items" on public.stock_return_items for delete to authenticated using(exists(select 1 from public.stock_returns r join public.organization_members m on m.organization_id=r.organization_id where r.id=stock_return_items.stock_return_id and r.organization_id=stock_return_items.organization_id and r.status='DRAFT' and m.user_id=(select auth.uid()) and m.role in('owner','admin','manager')));
alter table public.stock_movements add column stock_return_id uuid null references public.stock_returns(id) on delete restrict;
alter table public.stock_movements drop constraint stock_movements_movement_type_check;
alter table public.stock_movements add constraint stock_movements_movement_type_check check(movement_type in('IN','OUT','TRANSFER_IN','TRANSFER_OUT','ADJUSTMENT_IN','ADJUSTMENT_OUT','SALES_RETURN_IN','PURCHASE_RETURN_OUT'));
alter table public.stock_movements drop constraint stock_movements_source_check;
alter table public.stock_movements add constraint stock_movements_source_check check((document_id is not null and document_item_id is not null and stock_count_id is null and stock_return_id is null) or(document_id is null and document_item_id is null and stock_count_id is not null and stock_return_id is null) or(document_id is null and document_item_id is null and stock_count_id is null and stock_return_id is not null));
create index stock_movements_stock_return_idx on public.stock_movements(stock_return_id) where stock_return_id is not null;
-- The posting function is defined in the follow-up hardening migration.
