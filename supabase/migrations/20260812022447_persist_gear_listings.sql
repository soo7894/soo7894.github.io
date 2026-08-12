create table public.gear_listings (
  id bigint generated always as identity (start with 100000) primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 100),
  category text not null check (char_length(category) between 1 and 30),
  price integer not null check (price between 100 and 10000000),
  location text not null check (char_length(location) between 1 and 80),
  condition text not null check (condition in ('A급', '사용감 적음', 'B+급', '미사용급')),
  image_url text not null check (char_length(image_url) <= 2048),
  image_paths text[] not null default '{}',
  usage_count text not null check (usage_count in ('미사용', '1-3회', '5-10회', '10회 이상')),
  tags text[] not null default '{}',
  passport smallint not null default 96 check (passport between 0 and 100),
  seller_name text not null check (char_length(seller_name) between 1 and 100),
  description text not null check (char_length(description) between 1 and 2000),
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'SOLD', 'HIDDEN')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index gear_listings_user_id_idx on public.gear_listings (user_id);
create index gear_listings_active_created_idx
  on public.gear_listings (created_at desc)
  where status = 'ACTIVE';

alter table public.gear_listings enable row level security;

create policy "Anyone can view active gear listings"
on public.gear_listings
for select
to anon, authenticated
using (status = 'ACTIVE');

create policy "Users can create their own gear listings"
on public.gear_listings
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their own gear listings"
on public.gear_listings
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete their own gear listings"
on public.gear_listings
for delete
to authenticated
using ((select auth.uid()) = user_id);

grant select on table public.gear_listings to anon, authenticated;
grant insert, update, delete on table public.gear_listings to authenticated;
grant usage, select on sequence public.gear_listings_id_seq to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'gear-listings',
  'gear-listings',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Users can upload their own gear photos"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'gear-listings'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy "Users can delete their own gear photos"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'gear-listings'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
  and owner_id = (select auth.uid()::text)
);
