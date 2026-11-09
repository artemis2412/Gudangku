create index customers_created_by_idx on public.customers (created_by) where created_by is not null;
create index stock_documents_customer_organization_idx on public.stock_documents (customer_id, organization_id) where customer_id is not null;
