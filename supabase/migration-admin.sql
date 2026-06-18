-- Migración: gestión de organizadores y eliminación de participantes.
-- Córrela una sola vez en Supabase → SQL Editor → New query → pega → Run.
-- (Solo necesaria si usas Supabase. En modo local ya funciona sin esto.)

-- 1. ¿El usuario es organizador? SECURITY DEFINER evita recursión de RLS.
create or replace function public.is_admin(uid uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select coalesce((select is_admin from public.profiles where id = uid), false);
$$;

-- 2. Nombrar (o quitar) organizador. Solo un organizador puede hacerlo.
create or replace function public.set_admin(target uuid, value boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'Solo un organizador puede cambiar organizadores';
  end if;
  update public.profiles set is_admin = value where id = target;
end;
$$;

-- 3. Eliminar un participante (su perfil). Solo un organizador puede hacerlo.
create or replace function public.delete_player(target uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'Solo un organizador puede eliminar participantes';
  end if;
  if target = auth.uid() then
    raise exception 'No puedes eliminarte a ti mismo';
  end if;
  delete from public.profiles where id = target;
end;
$$;

-- 4. Permitir que los usuarios autenticados llamen a estas funciones.
grant execute on function public.is_admin(uuid)            to authenticated;
grant execute on function public.set_admin(uuid, boolean)  to authenticated;
grant execute on function public.delete_player(uuid)       to authenticated;

-- Nota: delete_player elimina el PERFIL (lo saca de la liga y la clasificación).
-- La cuenta de inicio de sesión (auth.users) queda; si quieres borrarla por
-- completo, hazlo en Authentication > Users en el panel de Supabase.
