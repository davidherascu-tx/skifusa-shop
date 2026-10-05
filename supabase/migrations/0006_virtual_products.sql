-- Virtual products (live online seminars): date, length, private join details, and the first seminar.
alter table public.products add column if not exists kind text not null default 'physical' check (kind in ('physical','virtual'));
alter table public.products add column if not exists event_start timestamptz;
alter table public.products add column if not exists event_minutes int check (event_minutes is null or event_minutes > 0);

-- Zoom link / password. NOT readable by customers (products are public); the server reveals it only to paid attendees.
create table if not exists public.event_access (
  product_id uuid primary key references public.products(id) on delete cascade,
  join_url text,
  join_info text,
  details_emailed_at timestamptz
);
alter table public.event_access enable row level security;
create policy "admin manages event access" on public.event_access for all using (public.is_admin()) with check (public.is_admin());

insert into public.categories (slug, name, sort_order) values ('seminars', 'Virtual Training', 5) on conflict (slug) do nothing;

-- First seminar: Saturday Dec 5, 2026, 6:30 PM Eastern (23:30 UTC), 60 minutes, $25, members only. Edit seats/details in Admin > Events.
insert into public.products (slug, name, description, category_id, price_cents, image_url, stock, members_only, kind, event_start, event_minutes)
select
  'live-virtual-training-daizo-kanazawa-2026-12-05',
  'Live Virtual Training with Daizo Kanazawa Sensei',
  $desc$SKIF-USA LIVE VIRTUAL TRAINING WITH DAIZO KANAZAWA SENSEI FROM JAPAN HQ

The virtual training program with SKIF Japan Headquarters is back! We invite all SKIF-USA members to join a live online training session with Daizo Kanazawa, Sensei.

* 1-hour live training session
* Online via Zoom
* Limited spots, first come, first served. Register early to secure your place.
* Zoom access information will be emailed 6-12 hours before the event and shown in My account. Please do not share the meeting ID or password.
* Please warm up before the session and join 5 minutes early to allow time for setup and any technical issues.

Questions: skifusa@gmail.com | Ruben Fung: 832-513-0058 | skifusa.org

Train together. Learn together. Grow together.$desc$,
  c.id, 2500, '/seminar_live_training.webp', 50, true, 'virtual', '2026-12-05T23:30:00Z', 60
from public.categories c where c.slug = 'seminars'
on conflict (slug) do nothing;

insert into public.event_access (product_id)
select id from public.products where slug = 'live-virtual-training-daizo-kanazawa-2026-12-05'
on conflict do nothing;
