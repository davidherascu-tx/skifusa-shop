-- Contact form messages. Written ONLY by the server (service role); admins can read and mark them handled.
create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  email text not null,
  topic text,
  order_number text,
  message text not null,
  user_id uuid references auth.users(id) on delete set null,
  ip_hash text,
  handled boolean not null default false
);

create index contact_messages_ip_time on public.contact_messages (ip_hash, created_at);
create index contact_messages_email_time on public.contact_messages (lower(email), created_at);
create index contact_messages_open on public.contact_messages (handled, created_at desc);

alter table public.contact_messages enable row level security;
-- No insert/select policy for the public: anonymous visitors cannot read or write this table directly.
create policy "admin reads messages" on public.contact_messages for select using (public.is_admin());
create policy "admin updates messages" on public.contact_messages for update using (public.is_admin()) with check (public.is_admin());
