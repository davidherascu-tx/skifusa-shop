-- Replies sent from the admin Messages page.
alter table public.contact_messages add column if not exists reply text;
alter table public.contact_messages add column if not exists replied_at timestamptz;
