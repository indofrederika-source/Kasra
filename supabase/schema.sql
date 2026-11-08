-- ========================================================
-- KASRA — Production Database Schema for Supabase
-- Run this script in your Supabase SQL Editor (1-Click Run)
-- ========================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. PROFILES (Store & Owner Details linked to Supabase Auth)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  email text,
  store_name text,
  business_category text,
  owner_name text,
  phone text,
  address text,
  bank_account text,
  monthly_target numeric default 0,
  logo_url text,
  avatar_url text,
  created_at timestamptz default timezone('utc'::text, now()),
  updated_at timestamptz default timezone('utc'::text, now())
);

-- 2. PRODUCTS (Inventory, Pricing & FEFO Expiry)
create table if not exists public.products (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  sku text,
  name text not null,
  category text default 'Produk Siap Jual',
  subcategory text,
  location text,
  image_url text default '',
  current_stock numeric default 0,
  min_stock_alert numeric default 5,
  unit text default 'pcs',
  purchase_date text,
  expiry_date text,
  batches jsonb default '[]'::jsonb,
  hpp_amount numeric default 0,
  hpp_method text default 'wholesale',
  hpp_breakdown jsonb default '[]'::jsonb,
  selling_price numeric default 0,
  last_sold_at text,
  created_at timestamptz default timezone('utc'::text, now()),
  updated_at timestamptz default timezone('utc'::text, now())
);

-- 3. TRANSACTIONS (Cash Ledger - Income & Expense)
create table if not exists public.transactions (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('income', 'expense')),
  amount numeric not null default 0,
  category text not null default 'Penjualan',
  description text not null default '',
  date text not null,
  input_method text default 'manual',
  account text,
  receipt_url text,
  related_product_id text,
  related_quantity numeric,
  related_movement_id text,
  created_at timestamptz default timezone('utc'::text, now())
);

-- 4. STOCK MOVEMENTS (Audit Trail of Stock In/Out)
create table if not exists public.stock_movements (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id text not null,
  product_name text not null,
  sku text,
  category text,
  location text,
  type text not null,
  quantity_delta numeric not null,
  unit text default 'pcs',
  stock_before numeric default 0,
  stock_after numeric default 0,
  batch_code text,
  batch_expiry text,
  financial_amount numeric default 0,
  related_transaction_id text,
  source text default 'Manual',
  notes text default '',
  created_at timestamptz default timezone('utc'::text, now())
);

-- 5. CATEGORY DEFINITIONS (Custom Main & Subcategories)
create table if not exists public.category_definitions (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  subcategories jsonb default '[]'::jsonb,
  created_at timestamptz default timezone('utc'::text, now())
);

-- ========================================================
-- ROW LEVEL SECURITY (RLS) - Each store user only sees their own data
-- ========================================================
alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.transactions enable row level security;
alter table public.stock_movements enable row level security;
alter table public.category_definitions enable row level security;

-- Profiles Policies
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

-- Products Policies
create policy "Users can read own products" on public.products for select using (auth.uid() = user_id);
create policy "Users can insert own products" on public.products for insert with check (auth.uid() = user_id);
create policy "Users can update own products" on public.products for update using (auth.uid() = user_id);
create policy "Users can delete own products" on public.products for delete using (auth.uid() = user_id);

-- Transactions Policies
create policy "Users can read own transactions" on public.transactions for select using (auth.uid() = user_id);
create policy "Users can insert own transactions" on public.transactions for insert with check (auth.uid() = user_id);
create policy "Users can update own transactions" on public.transactions for update using (auth.uid() = user_id);
create policy "Users can delete own transactions" on public.transactions for delete using (auth.uid() = user_id);

-- Stock Movements Policies
create policy "Users can read own stock movements" on public.stock_movements for select using (auth.uid() = user_id);
create policy "Users can insert own stock movements" on public.stock_movements for insert with check (auth.uid() = user_id);
create policy "Users can update own stock movements" on public.stock_movements for update using (auth.uid() = user_id);
create policy "Users can delete own stock movements" on public.stock_movements for delete using (auth.uid() = user_id);

-- Category Definitions Policies
create policy "Users can read own categories" on public.category_definitions for select using (auth.uid() = user_id);
create policy "Users can insert own categories" on public.category_definitions for insert with check (auth.uid() = user_id);
create policy "Users can update own categories" on public.category_definitions for update using (auth.uid() = user_id);
create policy "Users can delete own categories" on public.category_definitions for delete using (auth.uid() = user_id);

-- Trigger to automatically create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, name, store_name, business_category, owner_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', 'Pemilik Toko'),
    coalesce(new.raw_user_meta_data->>'storeName', 'Toko Saya'),
    coalesce(new.raw_user_meta_data->>'businessCategory', ''),
    coalesce(new.raw_user_meta_data->>'name', 'Pemilik Toko')
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
