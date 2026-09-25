-- Ejecuta en Supabase > SQL Editor. Es idempotente (puedes correrla varias veces).
-- Requiere haber corrido migration_003 (columnas address y avatar_url).
--
-- Problema: la política "profiles: self update" permite a cualquier usuario
-- actualizar su propia fila, incluida la columna role => un cliente podía hacerse admin.
-- Se protege con DOS capas independientes:

-- Capa 1: permisos por columna. Los usuarios autenticados solo pueden escribir
-- estas columnas; role, id y created_at quedan fuera de su alcance.
revoke update on public.profiles from anon, authenticated;
grant update (full_name, phone, address, avatar_url) on public.profiles to authenticated;

-- Capa 2: trigger que revierte cualquier cambio de role hecho por un no-admin.
create or replace function public.protect_profile_role()
returns trigger as $$
begin
  if new.role is distinct from old.role and auth.uid() is not null and not public.is_admin() then
    new.role := old.role;
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists protect_profile_role on public.profiles;
create trigger protect_profile_role
  before update on public.profiles
  for each row execute procedure public.protect_profile_role();

-- Además la política de update ahora exige que la fila resultante siga siendo del usuario.
drop policy if exists "profiles: self update" on public.profiles;
create policy "profiles: self update" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- Nadie puede insertar ni borrar perfiles desde la app (los crea el trigger handle_new_user).
revoke insert, delete on public.profiles from anon, authenticated;
