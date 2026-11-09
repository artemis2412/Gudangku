create table public.customer_payments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  stock_document_id uuid not null references public.stock_documents(id) on delete restrict,
  amount numeric(18,2) not null check (amount > 0),
  payment_method text not null check (payment_method in ('CASH','BANK_TRANSFER','QRIS')),
  reference_number text,
  notes text,
  received_by uuid not null references auth.users(id),
  received_at timestamptz not null default now()
);
create index customer_payments_org_received_idx on public.customer_payments (organization_id, received_at desc);
create index customer_payments_document_idx on public.customer_payments (stock_document_id, received_at desc);
alter table public.customer_payments enable row level security;
grant select on public.customer_payments to authenticated;
create policy "Organization members can view customer payments"
on public.customer_payments for select to authenticated
using (exists (select 1 from public.organization_members m where m.organization_id = customer_payments.organization_id and m.user_id = (select auth.uid())));
create or replace function private.record_customer_payment(
  p_document_id uuid, p_amount numeric, p_payment_method text,
  p_reference_number text default null, p_notes text default null
) returns uuid language plpgsql security definer set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_doc public.stock_documents%rowtype;
  v_new_received numeric(18,2);
  v_payment_id uuid;
begin
  if v_user_id is null then raise exception 'AUTH_REQUIRED'; end if;
  if p_amount is null or p_amount <= 0 then raise exception 'INVALID_PAYMENT_AMOUNT'; end if;
  if p_payment_method not in ('CASH','BANK_TRANSFER','QRIS') then raise exception 'INVALID_PAYMENT_METHOD'; end if;
  select d.* into v_doc from public.stock_documents d where d.id = p_document_id for update;
  if not found then raise exception 'DOCUMENT_NOT_FOUND'; end if;
  if v_doc.document_type <> 'OUT' or v_doc.status <> 'POSTED' then raise exception 'DOCUMENT_NOT_PAYABLE'; end if;
  if not exists (select 1 from public.organization_members m where m.organization_id = v_doc.organization_id and m.user_id = v_user_id and m.role in ('owner','admin','manager','staff')) then raise exception 'ACCESS_DENIED'; end if;
  if v_doc.payment_status = 'PAID' then raise exception 'ALREADY_PAID'; end if;
  if p_amount > (v_doc.grand_total - v_doc.amount_received) then raise exception 'PAYMENT_EXCEEDS_OUTSTANDING'; end if;
  v_new_received := v_doc.amount_received + p_amount;
  insert into public.customer_payments (organization_id,stock_document_id,amount,payment_method,reference_number,notes,received_by)
  values (v_doc.organization_id,v_doc.id,p_amount,p_payment_method,nullif(left(btrim(coalesce(p_reference_number,'')),100),''),nullif(left(btrim(coalesce(p_notes,'')),500),''),v_user_id)
  returning id into v_payment_id;
  update public.stock_documents set amount_received=v_new_received,payment_status=case when v_new_received >= grand_total then 'PAID' else 'PARTIAL' end,updated_at=now()
  where id=v_doc.id;
  return v_payment_id;
end;
$$;
revoke all on function private.record_customer_payment(uuid,numeric,text,text,text) from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.record_customer_payment(uuid,numeric,text,text,text) to authenticated;
create or replace function public.record_customer_payment(
  p_document_id uuid,p_amount numeric,p_payment_method text,p_reference_number text default null,p_notes text default null
) returns uuid language sql security invoker set search_path = ''
as $$ select private.record_customer_payment(p_document_id,p_amount,p_payment_method,p_reference_number,p_notes); $$;
revoke all on function public.record_customer_payment(uuid,numeric,text,text,text) from public, anon;
grant execute on function public.record_customer_payment(uuid,numeric,text,text,text) to authenticated;
