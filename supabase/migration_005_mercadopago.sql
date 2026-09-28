-- =========================================================
-- Yessmer - Mercado Pago (PSE)
-- Ejecuta este archivo en: Supabase > SQL Editor > New query
-- =========================================================

alter table public.orders
  add column if not exists payment_method text not null default 'manual'
    check (payment_method in ('manual', 'mercadopago_pse')),
  add column if not exists mp_payment_id bigint,
  add column if not exists mp_status text,
  add column if not exists mp_status_detail text;

create index if not exists orders_mp_payment_id_idx on public.orders (mp_payment_id);

-- Las Edge Functions (mp-create-payment / mp-webhook) usan la service_role key,
-- que ignora RLS, así que no se necesitan políticas nuevas para actualizar estas columnas.
