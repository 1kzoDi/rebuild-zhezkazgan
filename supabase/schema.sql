-- ReBuild PostgreSQL / Supabase Schema
-- Пилотный город: Жезказган, Казахстан

create extension if not exists "uuid-ossp";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  role text not null check (role in ('buyer', 'seller', 'admin')) default 'buyer',
  phone text,
  company text,
  city text not null default 'Жезказган',
  rating numeric(2,1) default 5.0,
  verified boolean default false,
  created_at timestamptz default now()
);

create table if not exists public.warehouses (
  id text primary key,
  name text not null,
  city text not null default 'Жезказган',
  address text not null,
  lat double precision not null,
  lng double precision not null,
  is_active boolean default true
);

create table if not exists public.warehouse_zones (
  id text primary key, -- A, B, C, D, E, F
  warehouse_id text not null references public.warehouses(id) on delete cascade,
  name text not null,
  description text,
  color text not null
);

create table if not exists public.warehouse_cells (
  id text primary key, -- e.g. A-04
  zone_id text not null references public.warehouse_zones(id) on delete cascade,
  rack int not null,
  row_num int not null,
  col_num int not null,
  capacity_units int not null default 100,
  status text not null check (status in ('free', 'partial', 'full', 'reserved')) default 'free'
);

create table if not exists public.materials (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text not null,
  category text not null,
  condition text not null,
  price_kzt int not null default 0,
  unit text not null,
  total_quantity int not null default 0,
  available_quantity int not null default 0,
  reserved_quantity int not null default 0,
  weight_per_unit_kg numeric(10,2) not null default 1.0,
  location text not null,
  cell_id text references public.warehouse_cells(id) on delete set null,
  seller_id uuid references public.profiles(id) on delete cascade,
  dimensions text,
  created_at timestamptz default now()
);

create table if not exists public.material_photos (
  id uuid primary key default uuid_generate_v4(),
  material_id uuid not null references public.materials(id) on delete cascade,
  url text not null,
  sort_order int default 0
);

create table if not exists public.reservations (
  id uuid primary key default uuid_generate_v4(),
  material_id uuid not null references public.materials(id) on delete cascade,
  cell_id text references public.warehouse_cells(id) on delete set null,
  buyer_id uuid not null references public.profiles(id) on delete cascade,
  seller_id uuid references public.profiles(id) on delete set null,
  quantity int not null check (quantity > 0),
  total_price_kzt int not null default 0,
  status text not null check (status in ('pending', 'confirmed', 'completed', 'cancelled')) default 'pending',
  comment text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.stock_movements (
  id uuid primary key default uuid_generate_v4(),
  movement_type text not null check (movement_type in ('intake', 'reserve', 'release', 'move', 'adjust', 'issue')),
  material_id uuid not null references public.materials(id) on delete cascade,
  from_cell_id text references public.warehouse_cells(id),
  to_cell_id text references public.warehouse_cells(id),
  quantity_delta int not null,
  actor_id uuid references public.profiles(id),
  note text,
  created_at timestamptz default now()
);

-- Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.materials enable row level security;
alter table public.reservations enable row level security;
alter table public.warehouse_cells enable row level security;
alter table public.stock_movements enable row level security;

-- Public read access for catalog & warehouse map
create policy "Public read materials" on public.materials for select using (true);
create policy "Public read cells" on public.warehouse_cells for select using (true);

-- Sellers can only insert/update their own materials; admins can manage all
create policy "Sellers manage own materials" on public.materials
  for all using (
    auth.uid() = seller_id or
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Only warehouse admins can modify warehouse cells & stock movements
create policy "Admins manage cells" on public.warehouse_cells
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "Admins manage movements" on public.stock_movements
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Buyers can create and view their own reservations; sellers & admins can view relevant ones
create policy "Users view own reservations" on public.reservations
  for select using (
    auth.uid() = buyer_id or
    auth.uid() = seller_id or
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "Buyers create reservations" on public.reservations
  for insert with check (auth.uid() = buyer_id);

