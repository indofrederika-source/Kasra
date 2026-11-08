-- ========================================================
-- KASRA — Production Database Schema for Supabase
-- Idempotent 1-Click Run (Safe for fresh or existing DBs)
-- ========================================================

create extension if not exists "uuid-ossp";

-- 1. PROFILES (Private Store & Owner Account Details)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  email text,
  store_name text,
  handle text,
  bio text,
  business_category text,
  owner_name text,
  phone text,
  operating_hours text,
  province text,
  city text,
  address text,
  latitude numeric,
  longitude numeric,
  bank_account text,
  monthly_target numeric default 0,
  logo_url text,
  banner_url text,
  avatar_url text,
  show_public_catalog boolean default true,
  show_whatsapp_public boolean default true,
  show_map_public boolean default true,
  created_at timestamptz default timezone('utc'::text, now()),
  updated_at timestamptz default timezone('utc'::text, now())
);

alter table public.profiles add column if not exists handle text;
alter table public.profiles add column if not exists bio text;
alter table public.profiles add column if not exists banner_url text;
alter table public.profiles add column if not exists operating_hours text;
alter table public.profiles add column if not exists province text;
alter table public.profiles add column if not exists city text;
alter table public.profiles add column if not exists latitude numeric;
alter table public.profiles add column if not exists longitude numeric;
alter table public.profiles add column if not exists show_public_catalog boolean default true;
alter table public.profiles add column if not exists show_whatsapp_public boolean default true;
alter table public.profiles add column if not exists show_map_public boolean default true;

-- 2. PRODUCTS (Inventory, Pricing & FEFO Expiry - Strictly Private per Store)
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
  is_public_showcase boolean default false,
  public_description text,
  last_sold_at text,
  created_at timestamptz default timezone('utc'::text, now()),
  updated_at timestamptz default timezone('utc'::text, now())
);

alter table public.products add column if not exists is_public_showcase boolean default false;
alter table public.products add column if not exists public_description text;

-- 3. TRANSACTIONS (Cash Ledger - Strictly Private per Store)
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

-- 4. STOCK MOVEMENTS (Audit Trail - Strictly Private per Store)
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

-- 6. PUBLIC STOREFRONTS (Safe Public-Only Store Profile & Finished Goods Showcase)
-- Never stores HPP, warehouse stock, bank_account, or monthly_target!
create table if not exists public.public_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  store_name text not null default 'Toko UMKM',
  handle text not null default 'tokokasra',
  owner_name text default '',
  business_category text default '',
  bio text default '',
  logo_url text default '',
  banner_url text default '',
  operating_hours text default '',
  province text default '',
  city text default '',
  address text default '',
  latitude numeric,
  longitude numeric,
  phone text default '',
  show_public_catalog boolean default true,
  show_whatsapp_public boolean default true,
  show_map_public boolean default true,
  showcase_products jsonb default '[]'::jsonb,
  joined_at timestamptz default timezone('utc'::text, now()),
  updated_at timestamptz default timezone('utc'::text, now())
);

-- 7. COMMUNITY POSTS
create table if not exists public.community_posts (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  store_name text not null,
  store_handle text not null,
  store_logo_url text default '',
  business_category text default '',
  city text default '',
  province text default '',
  post_type text default 'general',
  caption text not null default '',
  image_urls jsonb default '[]'::jsonb,
  hashtags jsonb default '[]'::jsonb,
  tagged_products jsonb default '[]'::jsonb,
  liked_by_user_ids jsonb default '[]'::jsonb,
  comments jsonb default '[]'::jsonb,
  created_at timestamptz default timezone('utc'::text, now())
);

-- 8. COMMUNITY FOLLOWS
create table if not exists public.community_follows (
  follower_id uuid not null references auth.users(id) on delete cascade,
  following_id text not null,
  created_at timestamptz default timezone('utc'::text, now()),
  primary key (follower_id, following_id)
);

-- ========================================================
-- ROW LEVEL SECURITY (RLS)
-- ========================================================
alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.transactions enable row level security;
alter table public.stock_movements enable row level security;
alter table public.category_definitions enable row level security;
alter table public.public_profiles enable row level security;
alter table public.community_posts enable row level security;
alter table public.community_follows enable row level security;

-- Profiles Policies (Strictly Private)
drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

-- Products Policies (Strictly Private)
drop policy if exists "Users can read own products" on public.products;
drop policy if exists "Users can insert own products" on public.products;
drop policy if exists "Users can update own products" on public.products;
drop policy if exists "Users can delete own products" on public.products;
create policy "Users can read own products" on public.products for select using (auth.uid() = user_id);
create policy "Users can insert own products" on public.products for insert with check (auth.uid() = user_id);
create policy "Users can update own products" on public.products for update using (auth.uid() = user_id);
create policy "Users can delete own products" on public.products for delete using (auth.uid() = user_id);

-- Transactions Policies (Strictly Private)
drop policy if exists "Users can read own transactions" on public.transactions;
drop policy if exists "Users can insert own transactions" on public.transactions;
drop policy if exists "Users can update own transactions" on public.transactions;
drop policy if exists "Users can delete own transactions" on public.transactions;
create policy "Users can read own transactions" on public.transactions for select using (auth.uid() = user_id);
create policy "Users can insert own transactions" on public.transactions for insert with check (auth.uid() = user_id);
create policy "Users can update own transactions" on public.transactions for update using (auth.uid() = user_id);
create policy "Users can delete own transactions" on public.transactions for delete using (auth.uid() = user_id);

-- Stock Movements Policies (Strictly Private)
drop policy if exists "Users can read own stock movements" on public.stock_movements;
drop policy if exists "Users can insert own stock movements" on public.stock_movements;
drop policy if exists "Users can update own stock movements" on public.stock_movements;
drop policy if exists "Users can delete own stock movements" on public.stock_movements;
create policy "Users can read own stock movements" on public.stock_movements for select using (auth.uid() = user_id);
create policy "Users can insert own stock movements" on public.stock_movements for insert with check (auth.uid() = user_id);
create policy "Users can update own stock movements" on public.stock_movements for update using (auth.uid() = user_id);
create policy "Users can delete own stock movements" on public.stock_movements for delete using (auth.uid() = user_id);

-- Category Definitions Policies (Strictly Private)
drop policy if exists "Users can read own categories" on public.category_definitions;
drop policy if exists "Users can insert own categories" on public.category_definitions;
drop policy if exists "Users can update own categories" on public.category_definitions;
drop policy if exists "Users can delete own categories" on public.category_definitions;
create policy "Users can read own categories" on public.category_definitions for select using (auth.uid() = user_id);
create policy "Users can insert own categories" on public.category_definitions for insert with check (auth.uid() = user_id);
create policy "Users can update own categories" on public.category_definitions for update using (auth.uid() = user_id);
create policy "Users can delete own categories" on public.category_definitions for delete using (auth.uid() = user_id);

-- Public Storefront Policies (Readable by Community, Writable only by Owner)
drop policy if exists "Anyone can view public storefronts" on public.public_profiles;
drop policy if exists "Owners can insert own public storefront" on public.public_profiles;
drop policy if exists "Owners can update own public storefront" on public.public_profiles;
create policy "Anyone can view public storefronts" on public.public_profiles for select using (true);
create policy "Owners can insert own public storefront" on public.public_profiles for insert with check (auth.uid() = user_id);
create policy "Owners can update own public storefront" on public.public_profiles for update using (auth.uid() = user_id);

-- Community Posts Policies
drop policy if exists "Anyone can read community posts" on public.community_posts;
drop policy if exists "Authenticated users can insert own posts" on public.community_posts;
drop policy if exists "Authenticated users can update posts" on public.community_posts;
drop policy if exists "Owners can delete own posts" on public.community_posts;
create policy "Anyone can read community posts" on public.community_posts for select using (true);
create policy "Authenticated users can insert own posts" on public.community_posts for insert with check (auth.uid() = user_id);
create policy "Authenticated users can update posts" on public.community_posts for update using (auth.role() = 'authenticated');
create policy "Owners can delete own posts" on public.community_posts for delete using (auth.uid() = user_id);

-- Community Follows Policies
drop policy if exists "Anyone can read follows" on public.community_follows;
drop policy if exists "Users can follow" on public.community_follows;
drop policy if exists "Users can unfollow" on public.community_follows;
create policy "Anyone can read follows" on public.community_follows for select using (true);
create policy "Users can follow" on public.community_follows for insert with check (auth.uid() = follower_id);
create policy "Users can unfollow" on public.community_follows for delete using (auth.uid() = follower_id);

-- Trigger to automatically create profile & public storefront on signup
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
  )
  on conflict (id) do nothing;

  insert into public.public_profiles (user_id, store_name, handle, owner_name, business_category)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'storeName', 'Toko Saya'),
    lower(regexp_replace(coalesce(new.raw_user_meta_data->>'storeName', 'tokokasra'), '[^a-zA-Z0-9_]', '', 'g')),
    coalesce(new.raw_user_meta_data->>'name', 'Pemilik Toko'),
    coalesce(new.raw_user_meta_data->>'businessCategory', '')
  )
  on conflict (user_id) do nothing;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
