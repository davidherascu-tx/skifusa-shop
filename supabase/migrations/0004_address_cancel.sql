-- Saved shipping address on the customer profile + cancellation requests on orders.
alter table public.profiles add column if not exists address jsonb;

alter table public.orders add column if not exists cancel_requested_at timestamptz;
alter table public.orders add column if not exists cancel_reason text;
