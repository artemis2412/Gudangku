alter table public.products
  add column pieces_per_carton integer null,
  add column piece_selling_price numeric(18,2) null,
  add column carton_selling_price numeric(18,2) null;

alter table public.products
  add constraint products_pieces_per_carton_positive check (pieces_per_carton is null or pieces_per_carton > 0),
  add constraint products_piece_selling_price_nonnegative check (piece_selling_price is null or piece_selling_price >= 0),
  add constraint products_carton_selling_price_nonnegative check (carton_selling_price is null or carton_selling_price >= 0);

update public.products
set piece_selling_price = selling_price
where piece_selling_price is null and selling_price > 0;

alter table public.stock_document_items
  add column sales_unit text not null default 'BASE',
  add column sales_quantity numeric(18,3) not null default 0,
  add column unit_price numeric(18,2) not null default 0,
  add column line_total numeric(18,2) not null default 0;

alter table public.stock_document_items
  add constraint stock_document_items_sales_unit_check check (sales_unit in ('BASE','PCS','CARTON')),
  add constraint stock_document_items_sales_quantity_nonnegative check (sales_quantity >= 0),
  add constraint stock_document_items_unit_price_nonnegative check (unit_price >= 0),
  add constraint stock_document_items_line_total_nonnegative check (line_total >= 0);

update public.stock_document_items
set sales_unit='BASE', sales_quantity=quantity, unit_price=0, line_total=0
where sales_quantity=0;
