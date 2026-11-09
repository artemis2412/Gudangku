alter table public.stock_returns add column settled_amount numeric(18,2) not null default 0 check(settled_amount>=0);
alter table public.stock_returns add column settlement_status text not null default 'UNSETTLED' check(settlement_status in('UNSETTLED','PARTIAL','SETTLED'));
create table public.stock_return_settlements(
 id uuid primary key default gen_random_uuid(),organization_id uuid not null references public.organizations(id) on delete cascade,
 stock_return_id uuid not null,amount numeric(18,2) not null check(amount>0),
 payment_method text not null check(payment_method in('CASH','BANK_TRANSFER','QRIS','CREDIT_NOTE')),
 reference_number text null,notes text null,recorded_by uuid not null references auth.users(id),recorded_at timestamptz not null default now(),
 constraint stock_return_settlements_return_fk foreign key(organization_id,stock_return_id) references public.stock_returns(organization_id,id) on delete restrict
);
create index stock_return_settlements_return_org_idx on public.stock_return_settlements(organization_id,stock_return_id);
create index stock_return_settlements_recorded_by_idx on public.stock_return_settlements(recorded_by);
alter table public.stock_return_settlements enable row level security;
grant select on public.stock_return_settlements to authenticated;
create policy "Members can view return settlements" on public.stock_return_settlements for select to authenticated
using(exists(select 1 from public.stock_returns r join public.organization_members m on m.organization_id=r.organization_id where r.id=stock_return_settlements.stock_return_id and r.organization_id=stock_return_settlements.organization_id and m.user_id=(select auth.uid())));
create or replace function private.record_stock_return_settlement(p_return_id uuid,p_amount numeric,p_payment_method text,p_reference_number text default null,p_notes text default null)
returns uuid language plpgsql security definer set search_path=''
as $function$
declare v_user uuid:=auth.uid();v_return public.stock_returns%rowtype;v_role text;v_id uuid;
begin
 if v_user is null then raise exception 'Authentication required';end if;
 if p_amount is null or p_amount<=0 then raise exception 'Settlement amount must be positive';end if;
 if p_payment_method not in('CASH','BANK_TRANSFER','QRIS','CREDIT_NOTE') then raise exception 'Invalid settlement method';end if;
 select * into v_return from public.stock_returns where id=p_return_id for update;
 if not found then raise exception 'Return document not found';end if;
 select m.role into v_role from public.organization_members m where m.organization_id=v_return.organization_id and m.user_id=v_user;
 if v_role is null or v_role not in('owner','admin','manager') then raise exception 'Insufficient permission to settle return';end if;
 if v_return.status<>'POSTED' then raise exception 'Only posted returns can be settled';end if;
 if v_return.return_type='SALES' and p_payment_method='CREDIT_NOTE' then raise exception 'Customer refunds must use cash, bank transfer, or QRIS';end if;
 if p_amount>greatest(0,v_return.total_amount-v_return.settled_amount) then raise exception 'Settlement exceeds outstanding return value';end if;
 insert into public.stock_return_settlements(organization_id,stock_return_id,amount,payment_method,reference_number,notes,recorded_by)
 values(v_return.organization_id,v_return.id,p_amount,p_payment_method,nullif(left(trim(coalesce(p_reference_number,'')),100),''),nullif(left(trim(coalesce(p_notes,'')),500),''),v_user) returning id into v_id;
 update public.stock_returns set settled_amount=settled_amount+p_amount,settlement_status=case when settled_amount+p_amount>=total_amount then 'SETTLED' else 'PARTIAL' end where id=v_return.id and organization_id=v_return.organization_id;
 return v_id;
end;$function$;
revoke all on function private.record_stock_return_settlement(uuid,numeric,text,text,text) from public,anon;
grant execute on function private.record_stock_return_settlement(uuid,numeric,text,text,text) to authenticated;
create or replace function public.record_stock_return_settlement(p_return_id uuid,p_amount numeric,p_payment_method text,p_reference_number text default null,p_notes text default null)
returns uuid language sql security invoker set search_path=''
as $$select private.record_stock_return_settlement(p_return_id,p_amount,p_payment_method,p_reference_number,p_notes);$$;
revoke all on function public.record_stock_return_settlement(uuid,numeric,text,text,text) from public,anon;
grant execute on function public.record_stock_return_settlement(uuid,numeric,text,text,text) to authenticated;
