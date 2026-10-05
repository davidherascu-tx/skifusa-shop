-- Member access requests: a customer asks, an admin approves in the Table Editor.
-- Approving (status = 'approved') automatically sets profiles.is_member = true.
create table public.member_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  member_number text not null,
  dojo text,
  note text,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);
-- one open request per customer
create unique index member_requests_one_pending on public.member_requests (user_id) where status = 'pending';

alter table public.member_requests enable row level security;

create policy "own requests read" on public.member_requests for select
  using (user_id = auth.uid() or public.is_admin());
create policy "own requests insert" on public.member_requests for insert
  with check (user_id = auth.uid() and status = 'pending');
create policy "admin requests update" on public.member_requests for update
  using (public.is_admin()) with check (public.is_admin());

create function public.apply_member_request() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.status = 'approved' then
    update public.profiles set is_member = true where id = new.user_id;
  elsif tg_op = 'UPDATE' and old.status = 'approved' then
    update public.profiles set is_member = false where id = new.user_id;
  end if;
  new.reviewed_at := case when new.status = 'pending' then null else coalesce(new.reviewed_at, now()) end;
  return new;
end $$;

create trigger member_request_review before insert or update on public.member_requests
  for each row execute function public.apply_member_request();
