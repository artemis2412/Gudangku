-- Store each warehouse's local reporting timezone as an IANA identifier.
-- Existing warehouses receive a safe WIB default and can be updated from device detection.
alter table public.warehouses
  add column if not exists time_zone text not null default 'Asia/Jakarta';

comment on column public.warehouses.time_zone is
  'IANA time zone identifier used for local transaction and reporting dates for this warehouse.';
