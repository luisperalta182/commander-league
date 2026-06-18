-- Migración: poder "Finalizar" una jornada (cerrar y bloquear edición).
-- Córrela una sola vez en Supabase → SQL Editor → New query → pega → Run.
-- (Solo necesaria si usas Supabase. En modo local ya funciona sin esto.)

alter table public.match_days
  add column if not exists finished boolean not null default false;

-- Refresca el caché de la API para que el nuevo campo se vea de inmediato.
notify pgrst, 'reload schema';
