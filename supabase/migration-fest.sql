-- Migración: Mondongo Fest — inscripciones y rifa.
-- Córrela una sola vez en Supabase → SQL Editor → New query → pega → Run.
-- (Solo necesaria si usas Supabase. En modo local ya funciona sin esto.)

create table if not exists public.fest_participants (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  ganador    boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.fest_participants enable row level security;

-- Cualquiera puede ver la lista y apuntarse (evento abierto).
drop policy if exists "fest select" on public.fest_participants;
create policy "fest select" on public.fest_participants
  for select using (true);

drop policy if exists "fest insert" on public.fest_participants;
create policy "fest insert" on public.fest_participants
  for insert with check (true);

-- Solo un organizador puede marcar ganadores (girar la rifa) o eliminar.
drop policy if exists "fest admin update" on public.fest_participants;
create policy "fest admin update" on public.fest_participants
  for update using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

drop policy if exists "fest admin delete" on public.fest_participants;
create policy "fest admin delete" on public.fest_participants
  for delete using (public.is_admin(auth.uid()));

-- Refresca el caché de la API.
notify pgrst, 'reload schema';
