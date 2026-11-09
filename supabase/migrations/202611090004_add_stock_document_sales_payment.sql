alter table public.stock_documents
  add column subtotal_amount numeric(18,2) not null default 0,
  add column discount_amount numeric(18,2) not null default 0,
  add column grand_total numeric(18,2) not null default 0,
  add column payment_method text not null default 'CASH',
  add column amount_received numeric(18,2) not null default 0,
  add column change_amount numeric(18,2) not null default 0,
  add column payment_status text not null default 'UNPAID';

alter table public.stock_documents
  add constraint stock_documents_subtotal_nonnegative check (subtotal_amount >= 0),
  add constraint stock_documents_discount_nonnegative check (discount_amount >= 0 and discount_amount <= subtotal_amount),
  add constraint stock_documents_grand_total_nonnegative check (grand_total >= 0 and grand_total = subtotal_amount - discount_amount),
  add constraint stock_documents_payment_method_check check (payment_method in ('CASH','BANK_TRANSFER','QRIS','CREDIT')),
  add constraint stock_documents_amount_received_nonnegative check (amount_received >= 0),
  add constraint stock_documents_change_nonnegative check (change_amount >= 0),
  add constraint stock_documents_payment_status_check check (payment_status in ('UNPAID','PARTIAL','PAID')),
  add constraint stock_documents_payment_consistency check (
    (payment_status = 'UNPAID' and amount_received = 0 and change_amount = 0)
    or (payment_status = 'PARTIAL' and amount_received > 0 and amount_received < grand_total and change_amount = 0)
    or (payment_status = 'PAID' and amount_received >= grand_total and change_amount = amount_received - grand_total)
  );
