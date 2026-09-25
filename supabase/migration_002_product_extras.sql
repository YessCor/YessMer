-- Ejecuta en Supabase > SQL Editor (una sola vez).
-- Agrega precio anterior (para mostrar descuentos), destacados y SKU.
alter table public.products add column if not exists compare_at_price numeric(12,2) check (compare_at_price is null or compare_at_price >= 0);
alter table public.products add column if not exists is_featured boolean not null default false;
alter table public.products add column if not exists sku text;
