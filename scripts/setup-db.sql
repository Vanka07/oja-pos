-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Shops table (each shop is a tenant)
create table if not exists shops (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  owner_name text,
  phone text,
  address text,
  currency text default 'NGN',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Auth: link Supabase auth users to shops
create table if not exists shop_members (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  shop_id uuid references shops(id) on delete cascade,
  role text check (role in ('owner', 'manager', 'cashier')) default 'owner',
  pin text,
  name text,
  phone text,
  active boolean default true,
  created_at timestamptz default now(),
  unique(user_id, shop_id)
);

-- Products (id is text because local IDs are random strings)
create table if not exists products (
  id text primary key,
  shop_id uuid references shops(id) on delete cascade not null,
  name text not null,
  category text,
  cost_price numeric default 0,
  selling_price numeric default 0,
  stock integer default 0,
  min_stock integer default 5,
  unit text default 'pcs',
  barcode text,
  image text,
  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Sales
create table if not exists sales (
  id text primary key,
  shop_id uuid references shops(id) on delete cascade not null,
  staff_id text,
  staff_name text,
  items jsonb not null default '[]',
  subtotal numeric default 0,
  discount numeric default 0,
  total numeric default 0,
  payment_method text check (payment_method in ('cash', 'transfer', 'pos', 'credit')),
  customer_id text,
  customer_name text,
  cash_received numeric,
  change_given numeric,
  note text,
  created_at timestamptz default now()
);

-- Customers
create table if not exists customers (
  id text primary key,
  shop_id uuid references shops(id) on delete cascade not null,
  name text not null,
  phone text,
  email text,
  credit_limit numeric default 0,
  current_credit numeric default 0,
  transactions jsonb default '[]',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Expenses
create table if not exists expenses (
  id text primary key,
  shop_id uuid references shops(id) on delete cascade not null,
  category text,
  description text,
  amount numeric default 0,
  payment_method text,
  staff_id text,
  staff_name text,
  created_at timestamptz default now()
);

-- Stock movements
create table if not exists stock_movements (
  id text primary key,
  shop_id uuid references shops(id) on delete cascade not null,
  product_id text,
  product_name text,
  type text check (type in ('purchase', 'sale', 'adjustment', 'return', 'damage')),
  quantity integer,
  previous_stock integer,
  new_stock integer,
  staff_id text,
  staff_name text,
  reason text,
  supplier_id text,
  cost_per_unit numeric,
  created_at timestamptz default now()
);

-- Enable RLS on all tables
alter table shops enable row level security;
alter table shop_members enable row level security;
alter table products enable row level security;
alter table sales enable row level security;
alter table customers enable row level security;
alter table expenses enable row level security;
alter table stock_movements enable row level security;

-- Drop existing policies if they exist (idempotent)
drop policy if exists "Users can view their shops" on shops;
drop policy if exists "Users can view their shop members" on shop_members;
drop policy if exists "Users can manage products" on products;
drop policy if exists "Users can manage sales" on sales;
drop policy if exists "Users can manage customers" on customers;
drop policy if exists "Users can manage expenses" on expenses;
drop policy if exists "Users can manage stock movements" on stock_movements;
drop policy if exists "Authenticated users can create shops" on shops;
drop policy if exists "Authenticated users can create shop members" on shop_members;

-- RLS Policies
create policy "Users can view their shops" on shops
  for all using (id in (select shop_id from shop_members where user_id = auth.uid()));

create policy "Authenticated users can create shops" on shops
  for insert with check (auth.uid() is not null);

create policy "Users can view their shop members" on shop_members
  for all using (shop_id in (select shop_id from shop_members where user_id = auth.uid()));

create policy "Authenticated users can create shop members" on shop_members
  for insert with check (auth.uid() = user_id);

create policy "Users can manage products" on products
  for all using (shop_id in (select shop_id from shop_members where user_id = auth.uid()));

create policy "Users can manage sales" on sales
  for all using (shop_id in (select shop_id from shop_members where user_id = auth.uid()));

create policy "Users can manage customers" on customers
  for all using (shop_id in (select shop_id from shop_members where user_id = auth.uid()));

create policy "Users can manage expenses" on expenses
  for all using (shop_id in (select shop_id from shop_members where user_id = auth.uid()));

create policy "Users can manage stock movements" on stock_movements
  for all using (shop_id in (select shop_id from shop_members where user_id = auth.uid()));

-- Indexes
create index if not exists idx_products_shop on products(shop_id);
create index if not exists idx_sales_shop on sales(shop_id);
create index if not exists idx_sales_created on sales(shop_id, created_at);
create index if not exists idx_customers_shop on customers(shop_id);
create index if not exists idx_expenses_shop on expenses(shop_id);
create index if not exists idx_stock_movements_shop on stock_movements(shop_id);
create index if not exists idx_shop_members_user on shop_members(user_id);
