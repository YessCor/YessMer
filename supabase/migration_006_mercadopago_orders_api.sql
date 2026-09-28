-- =========================================================
-- Yessmer - Mercado Pago (migración de /v1/payments a /v1/orders)
-- El id de una "order" de Mercado Pago es alfanumérico (ej. "ORDOMG01..."),
-- no numérico, así que mp_payment_id pasa de bigint a text.
-- Ejecuta este archivo en: Supabase > SQL Editor > New query
-- =========================================================

alter table public.orders
  alter column mp_payment_id type text using mp_payment_id::text;
