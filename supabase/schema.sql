-- =========================================================
-- Yessmer - esquema de base de datos para Supabase (Postgres)
-- Ejecuta este archivo completo en: Supabase > SQL Editor > New query
-- =========================================================

create extension if not exists "pgcrypto";

-- ---------- PROFILES ----------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  role text not null default 'customer' check (role in ('customer','admin')),
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, new.raw_user_meta_data->>'full_name', 'customer');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------- CATEGORIES ----------
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  image_url text,
  created_at timestamptz not null default now()
);

-- ---------- PRODUCTS ----------
create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price numeric(12,2) not null check (price >= 0),
  stock integer not null default 0 check (stock >= 0),
  category_id uuid references public.categories(id) on delete set null,
  images text[] not null default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------- STORE SETTINGS (QR / llave Bre-B - Nequi) ----------
create table public.store_settings (
  id integer primary key default 1 check (id = 1),
  qr_image_url text,
  nequi_key text,
  payment_instructions text,
  updated_at timestamptz not null default now()
);
insert into public.store_settings (id) values (1);

-- ---------- ORDERS ----------
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pendiente_pago'
    check (status in ('pendiente_pago','pago_reportado','confirmado','enviado','rechazado','cancelado')),
  total numeric(12,2) not null default 0,
  payment_proof_url text,
  shipping_address text,
  shipping_phone text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- ORDER ITEMS ----------
create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  unit_price numeric(12,2) not null,
  quantity integer not null check (quantity > 0)
);

-- ---------- ROW LEVEL SECURITY ----------
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.store_settings enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

create or replace function public.is_admin()
returns boolean as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$ language sql security definer stable;

-- profiles
create policy "profiles: self or admin read" on public.profiles for select using (auth.uid() = id or public.is_admin());
-- OJO: esta política deja editar la propia fila (incluido role). Después de este esquema
-- corre migration_003 y migration_004, que impiden que un cliente se vuelva admin.
create policy "profiles: self update" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

-- categories (lectura publica, escritura solo admin)
create policy "categories: public read" on public.categories for select using (true);
create policy "categories: admin insert" on public.categories for insert with check (public.is_admin());
create policy "categories: admin update" on public.categories for update using (public.is_admin());
create policy "categories: admin delete" on public.categories for delete using (public.is_admin());

-- products (lectura publica, escritura solo admin)
create policy "products: public read" on public.products for select using (true);
create policy "products: admin insert" on public.products for insert with check (public.is_admin());
create policy "products: admin update" on public.products for update using (public.is_admin());
create policy "products: admin delete" on public.products for delete using (public.is_admin());

-- store_settings (lectura publica, escritura solo admin)
create policy "settings: public read" on public.store_settings for select using (true);
create policy "settings: admin update" on public.store_settings for update using (public.is_admin());

-- orders (dueno o admin)
create policy "orders: owner or admin read" on public.orders for select using (auth.uid() = user_id or public.is_admin());
create policy "orders: owner insert" on public.orders for insert with check (auth.uid() = user_id);
create policy "orders: owner or admin update" on public.orders for update using (auth.uid() = user_id or public.is_admin());

-- order_items (dueno o admin, via order)
create policy "order_items: owner or admin read" on public.order_items for select using (
  exists (select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid() or public.is_admin()))
);
create policy "order_items: owner insert" on public.order_items for insert with check (
  exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
);

-- =========================================================
-- STORAGE
-- Antes de correr lo de abajo, crea estos 3 buckets en
-- Supabase > Storage > New bucket (marca "Public" en los 3):
--   product-images
--   payment-proofs
--   settings
-- =========================================================

create policy "product-images public read" on storage.objects for select using (bucket_id = 'product-images');
create policy "product-images admin insert" on storage.objects for insert with check (bucket_id = 'product-images' and public.is_admin());
create policy "product-images admin update" on storage.objects for update using (bucket_id = 'product-images' and public.is_admin());
create policy "product-images admin delete" on storage.objects for delete using (bucket_id = 'product-images' and public.is_admin());

create policy "settings public read" on storage.objects for select using (bucket_id = 'settings');
create policy "settings admin insert" on storage.objects for insert with check (bucket_id = 'settings' and public.is_admin());
create policy "settings admin update" on storage.objects for update using (bucket_id = 'settings' and public.is_admin());

create policy "payment-proofs authenticated insert" on storage.objects for insert with check (bucket_id = 'payment-proofs' and auth.uid() is not null);
create policy "payment-proofs owner or admin read" on storage.objects for select using (bucket_id = 'payment-proofs' and (public.is_admin() or owner = auth.uid()));

-- =========================================================
-- Para convertirte en administrador (hazlo DESPUES de registrarte
-- en la app con tu correo), corre esto reemplazando el correo:
--
-- update public.profiles set role = 'admin'
-- where id = (select id from auth.users where email = 'tu-correo@ejemplo.com');
-- =========================================================
