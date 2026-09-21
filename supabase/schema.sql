create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  organization_id text not null default 'demo',
  branch_id text not null default 'main',
  name text not null,
  sku text,
  barcode text,
  category text,
  price numeric not null default 0,
  cost numeric not null default 0,
  stock numeric not null default 0,
  min_stock numeric not null default 0,
  unit_type text not null default 'peso',
  active boolean not null default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table if not exists public.sales (
  id uuid primary key default gen_random_uuid(),
  organization_id text not null default 'demo',
  branch_id text not null default 'main',
  customer_name text,
  total numeric not null default 0,
  payment_method text default 'Efectivo',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  organization_id text not null default 'demo',
  branch_id text not null default 'main',
  name text not null,
  phone text,
  email text,
  created_at timestamp with time zone default now()
);

create table if not exists public.cash_sessions (
  id uuid primary key default gen_random_uuid(),
  organization_id text not null default 'demo',
  branch_id text not null default 'main',
  status text not null default 'abierta',
  opening_amount numeric not null default 0,
  declared_amount numeric not null default 0,
  expected_amount numeric not null default 0,
  opened_at timestamp with time zone default now(),
  closed_at timestamp with time zone
);

alter table public.products enable row level security;
alter table public.sales enable row level security;
alter table public.customers enable row level security;
alter table public.cash_sessions enable row level security;

create policy if not exists "Allow anon read products" on public.products for select using (true);
create policy if not exists "Allow anon insert products" on public.products for insert with check (true);
create policy if not exists "Allow anon update products" on public.products for update using (true) with check (true);
create policy if not exists "Allow anon delete products" on public.products for delete using (true);

create policy if not exists "Allow anon read sales" on public.sales for select using (true);
create policy if not exists "Allow anon insert sales" on public.sales for insert with check (true);
create policy if not exists "Allow anon update sales" on public.sales for update using (true) with check (true);

create policy if not exists "Allow anon read customers" on public.customers for select using (true);
create policy if not exists "Allow anon insert customers" on public.customers for insert with check (true);

create policy if not exists "Allow anon read cash_sessions" on public.cash_sessions for select using (true);
create policy if not exists "Allow anon insert cash_sessions" on public.cash_sessions for insert with check (true);
create policy if not exists "Allow anon update cash_sessions" on public.cash_sessions for update using (true) with check (true);
