create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

comment on table public.admin_users is
  'Server-managed allowlist for CampLoop administrator accounts.';

alter table public.admin_users enable row level security;

revoke all on table public.admin_users from anon;
revoke all on table public.admin_users from authenticated;
grant select on table public.admin_users to authenticated;

drop policy if exists "Administrators can verify their own access" on public.admin_users;

create policy "Administrators can verify their own access"
on public.admin_users
for select
to authenticated
using (
  (select auth.uid()) is not null
  and (select auth.uid()) = user_id
);
