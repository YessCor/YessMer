-- Ejecuta en Supabase > SQL Editor (una sola vez).

-- Datos editables del perfil
alter table public.profiles add column if not exists address text;
alter table public.profiles add column if not exists avatar_url text;

-- SEGURIDAD: la política "profiles: self update" deja a cada usuario editar su propia fila,
-- lo que incluiría la columna role (cualquiera podría volverse admin). Este trigger
-- ignora cambios de role hechos por usuarios que no son admin.
-- (Desde el SQL Editor auth.uid() es null, así que ahí sí puedes cambiar roles.)
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
