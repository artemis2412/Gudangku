create index if not exists stock_return_items_org_idx on public.stock_return_items(organization_id);
create index if not exists stock_return_items_org_product_idx on public.stock_return_items(organization_id,product_id);
create index if not exists stock_return_items_org_return_idx on public.stock_return_items(organization_id,stock_return_id);
create index if not exists stock_returns_created_by_idx on public.stock_returns(created_by);
create index if not exists stock_returns_posted_by_idx on public.stock_returns(posted_by) where posted_by is not null;
create index if not exists stock_returns_customer_org_idx on public.stock_returns(customer_id,organization_id) where customer_id is not null;
create index if not exists stock_returns_supplier_org_idx on public.stock_returns(supplier_id,organization_id) where supplier_id is not null;
create index if not exists stock_returns_original_org_idx on public.stock_returns(organization_id,original_document_id);
create index if not exists stock_returns_warehouse_org_idx on public.stock_returns(organization_id,warehouse_id);
