-- 0009: sales tax charged on the order (included in total_cents)
alter table public.orders add column if not exists tax_cents int not null default 0;
