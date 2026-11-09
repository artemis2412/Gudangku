create table public.customers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  code text,
  name text not null check (length(btrim(name)) > 0),
  phone text,
  address text,
  notes text,
  is_active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint customers_id_organization_unique unique (id, organization_id),
  constraint customers_code_nonempty check (code is null or length(btrim(code)) > 0)
);
create index customers_organization_name_idx on public.customers (organization_id, name);
alter table public.customers enable row level security;
grant select, insert, update on public.customers to authenticated;
create policy "Organization members can view customers"
on public.customers for select to authenticated
using (exists (select 1 from public.organization_members m where m.organization_id = customers.organization_id and m.user_id = (select auth.uid())));
create policy "Staff can create customers in their organization"
on public.customers for insert to authenticated
with check (created_by = (select auth.uid()) and exists (select 1 from public.organization_members m where m.organization_id = customers.organization_id and m.user_id = (select auth.uid()) and m.role in ('owner','admin','manager','staff')));
create policy "Managers can update customers in their organization"
on public.customers for update to authenticated
using (exists (select 1 from public.organization_members m where m.organization_id = customers.organization_id and m.user_id = (select auth.uid()) and m.role in ('owner','admin','manager')))
with check (exists (select 1 from public.organization_members m where m.organization_id = customers.organization_id and m.user_id = (select auth.uid()) and m.role in ('owner','admin','manager')));
alter table public.stock_documents add column customer_id uuid;
alter table public.stock_documents add constraint stock_documents_customer_organization_fk
foreign key (customer_id, organization_id) references public.customers (id, organization_id) on delete set null (customer_id);
create index stock_documents_customer_idx on public.stock_documents (customer_id) where customer_id is not null;
