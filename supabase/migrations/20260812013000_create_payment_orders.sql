create table if not exists public.payment_orders (
  id uuid primary key default gen_random_uuid(),
  order_id text not null unique,
  user_id uuid not null references auth.users(id) on delete cascade,
  gear_id integer not null,
  order_name text not null,
  amount integer not null check (amount > 0),
  currency text not null default 'KRW' check (currency = 'KRW'),
  status text not null default 'READY' check (status in ('READY', 'IN_PROGRESS', 'DONE', 'FAILED', 'CANCELED')),
  payment_key text unique,
  method text,
  approved_at timestamptz,
  failure_code text,
  failure_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint payment_orders_order_id_format check (
    char_length(order_id) between 6 and 64
    and order_id ~ '^[A-Za-z0-9_-]+$'
  )
);

alter table public.payment_orders enable row level security;

drop policy if exists "Users can read their own payment orders" on public.payment_orders;
create policy "Users can read their own payment orders"
  on public.payment_orders for select to authenticated
  using ((select auth.uid()) = user_id);

create index if not exists payment_orders_user_created_idx
  on public.payment_orders (user_id, created_at desc);
create index if not exists payment_orders_status_created_idx
  on public.payment_orders (status, created_at desc);
