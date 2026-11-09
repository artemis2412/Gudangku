alter table public.stock_returns add constraint stock_returns_settlement_amount_lte_total check(settled_amount<=total_amount);
create index if not exists stock_return_settlements_org_idx on public.stock_return_settlements(organization_id);
create index if not exists stock_return_settlements_return_org_idx on public.stock_return_settlements(organization_id,stock_return_id);
create index if not exists stock_return_settlements_recorded_by_idx on public.stock_return_settlements(recorded_by);
