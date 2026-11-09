create index if not exists stock_documents_supplier_org_idx on public.stock_documents(supplier_id,organization_id) where supplier_id is not null;
create index if not exists supplier_payments_document_org_idx on public.supplier_payments(stock_document_id,organization_id);
create index if not exists supplier_payments_paid_by_idx on public.supplier_payments(paid_by);
