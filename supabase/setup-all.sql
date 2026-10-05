-- S.K.I.F.-USA shop schema
create extension if not exists pgcrypto;

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  sort_order int not null default 0
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text not null default '',
  category_id uuid references public.categories(id) on delete set null,
  price_cents int not null check (price_cents >= 0),
  sale_price_cents int check (sale_price_cents >= 0),
  image_url text,
  stock int not null default 0 check (stock >= 0),
  members_only boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create index on public.products (category_id);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  is_member boolean not null default false,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

create type public.order_status as enum ('pending','paid','shipped','cancelled','refunded');

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  email text,
  status public.order_status not null default 'pending',
  total_cents int not null default 0,
  payment_ref text unique,
  shipping jsonb,
  created_at timestamptz not null default now()
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  name text not null,
  unit_price_cents int not null,
  quantity int not null check (quantity > 0)
);

-- auto-create profile on signup
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false)
$$;

-- stop users from promoting themselves
create function public.protect_profile_flags() returns trigger
language plpgsql as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    new.is_admin := old.is_admin;
    new.is_member := old.is_member;
  end if;
  return new;
end $$;
create trigger profile_flags_guard before update on public.profiles
  for each row execute function public.protect_profile_flags();

-- Row level security
alter table public.categories  enable row level security;
alter table public.products    enable row level security;
alter table public.profiles    enable row level security;
alter table public.orders      enable row level security;
alter table public.order_items enable row level security;

create policy "categories readable" on public.categories for select using (true);
create policy "categories admin"    on public.categories for all using (public.is_admin()) with check (public.is_admin());

create policy "products readable" on public.products for select using (active or public.is_admin());
create policy "products admin"    on public.products for all using (public.is_admin()) with check (public.is_admin());

create policy "profile self read"   on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy "profile self update" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());

create policy "orders own read"    on public.orders for select using (user_id = auth.uid() or public.is_admin());
create policy "orders admin write" on public.orders for update using (public.is_admin());
create policy "order_items own read" on public.order_items for select using (
  exists (select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid() or public.is_admin()))
);
-- Orders are INSERTed only server-side with the service role key (bypasses RLS).

-- Public storage bucket for product images (upload via dashboard)
insert into storage.buckets (id, name, public) values ('products','products',true)
on conflict do nothing;
insert into public.categories (slug, name, sort_order) values
  ('dvds','DVDs',1), ('books','Books',2), ('accessories','Accessories',3), ('members','S.K.I.F. Members',4)
on conflict do nothing;

insert into public.products (slug, name, description, category_id, price_cents, sale_price_cents, stock, members_only)
select v.slug, v.name, v.descr, c.id, v.price, v.sale, 100, v.mem
from (values
  ('26-karate-kata-dvd','26 Karate Kata','Instructional DVD covering 26 Shotokan kata.','dvds',2995,null::int,false),
  ('dan-kata-dvd','Dan-Kata DVD','Kata for dan grades.','dvds',2995,500,false),
  ('kanazawa-fighting-techniques','Fighting Techniques (H. Kanazawa)','Kumite and fighting techniques.','books',3000,null,false),
  ('kanazawa-autobiography','Autobiography (H. Kanazawa)','The life of Hirokazu Kanazawa.','books',1800,null,false),
  ('skif-patch','S.K.I.F. Patch','Official embroidered patch.','accessories',800,null,false)
) as v(slug,name,descr,cat,price,sale,mem)
join public.categories c on c.slug = v.cat
on conflict do nothing;
