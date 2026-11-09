do $$
begin
  if not exists (select 1 from pg_constraint where conname='stock_documents_supplier_org_fk' and conrelid='public.stock_documents'::regclass) then
    alter table public.stock_documents add constraint stock_documents_supplier_org_fk foreign key(supplier_id,organization_id) references public.suppliers(id,organization_id) on delete restrict;
  end if;
end $$;
create index if not exists stock_documents_supplier_id_idx on public.stock_documents(supplier_id) where supplier_id is not null;
create table public.supplier_payments (
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.organizations(id) on delete cascade,
 stock_document_id uuid not null,
 amount numeric(18,2) not null check(amount>0),
 payment_method text not null check(payment_method in('CASH','BANK_TRANSFER','QRIS')),
 reference_number text null,notes text null,
 paid_by uuid not null references auth.users(id) on delete restrict,
 paid_at timestamptz not null default now(),
 constraint supplier_payments_document_org_fk foreign key(stock_document_id,organization_id) references public.stock_documents(id,organization_id) on delete restrict
);
create index supplier_payments_org_paid_at_idx on public.supplier_payments(organization_id,paid_at desc);
create index supplier_payments_document_paid_at_idx on public.supplier_payments(stock_document_id,paid_at desc);
alter table public.supplier_payments enable row level security;
create policy "Organization members can view supplier payments" on public.supplier_payments for select to authenticated using(exists(select 1 from public.organization_members m where m.organization_id=supplier_payments.organization_id and m.user_id=(select auth.uid())));
revoke all on public.supplier_payments from anon,authenticated;
grant select on public.supplier_payments to authenticated;
create or replace function private.record_supplier_payment(p_document_id uuid,p_amount numeric,p_payment_method text,p_reference_number text default null,p_notes text default null)
returns uuid language plpgsql security definer set search_path=''
as $function$
declare v_user_id uuid:=auth.uid();v_doc public.stock_documents%rowtype;v_role text;v_payment_id uuid;
begin
 if v_user_id is null then raise exception 'Authentication required';end if;
 if p_amount is null or p_amount<=0 then raise exception 'Payment amount must be positive';end if;
 if p_payment_method not in('CASH','BANK_TRANSFER','QRIS') then raise exception 'Invalid payment method';end if;
 select * into v_doc from public.stock_documents where id=p_document_id and document_type='IN' for update;
 if not found then raise exception 'Purchase document not found';end if;
 select m.role into v_role from public.organization_members m where m.organization_id=v_doc.organization_id and m.user_id=v_user_id;
 if v_role is null or v_role not in('owner','admin','manager','staff') then raise exception 'Insufficient permission to record supplier payment';end if;
 if v_doc.status<>'POSTED' then raise exception 'Only posted purchases can be paid';end if;
 if v_doc.supplier_id is null then raise exception 'Purchase has no supplier';end if;
 if v_doc.payment_status='PAID' then raise exception 'Purchase is already fully paid';end if;
 if p_amount>greatest(0,v_doc.grand_total-v_doc.amount_received) then raise exception 'Payment exceeds outstanding payable';end if;
 insert into public.supplier_payments(organization_id,stock_document_id,amount,payment_method,reference_number,notes,paid_by)
 values(v_doc.organization_id,v_doc.id,p_amount,p_payment_method,nullif(left(trim(coalesce(p_reference_number,'')),100),''),nullif(left(trim(coalesce(p_notes,'')),500),''),v_user_id) returning id into v_payment_id;
 update public.stock_documents set amount_received=amount_received+p_amount,payment_status=case when amount_received+p_amount>=grand_total then 'PAID' else 'PARTIAL' end,change_amount=0 where id=v_doc.id and organization_id=v_doc.organization_id;
 return v_payment_id;
end;$function$;
create or replace function public.record_supplier_payment(p_document_id uuid,p_amount numeric,p_payment_method text,p_reference_number text default null,p_notes text default null)
returns uuid language sql security invoker set search_path='' as $$select private.record_supplier_payment(p_document_id,p_amount,p_payment_method,p_reference_number,p_notes);$$;
revoke all on function public.record_supplier_payment(uuid,numeric,text,text,text) from public,anon;
grant execute on function public.record_supplier_payment(uuid,numeric,text,text,text) to authenticated;
