-- Migración: Rifa por rondas (ganadores agrupados por ronda + botón Nueva Ronda).
-- Córrela una sola vez en Supabase → SQL Editor → New query → pega → Run.
-- (Solo necesaria si usas Supabase. En modo local ya funciona sin esto.)

-- Ganadores registrados por ronda (una persona puede ganar en varias rondas).
create table if not exists public.fest_winners (
  id             uuid primary key default gen_random_uuid(),
  participant_id uuid references public.fest_participants(id) on delete cascade,
  name           text not null,
  round          int not null default 1,
  created_at     timestamptz not null default now()
);
alter table public.fest_winners enable row level security;

drop policy if exists "fest_winners select" on public.fest_winners;
create policy "fest_winners select" on public.fest_winners for select using (true);
drop policy if exists "fest_winners admin insert" on public.fest_winners;
create policy "fest_winners admin insert" on public.fest_winners
  for insert with check (public.is_admin(auth.uid()));
drop policy if exists "fest_winners admin delete" on public.fest_winners;
create policy "fest_winners admin delete" on public.fest_winners
  for delete using (public.is_admin(auth.uid()));

-- Estado de la rifa: en qué ronda vamos (una sola fila).
create table if not exists public.fest_state (
  id            text primary key default 'singleton',
  current_round int not null default 1
);
alter table public.fest_state enable row level security;

drop policy if exists "fest_state select" on public.fest_state;
create policy "fest_state select" on public.fest_state for select using (true);
drop policy if exists "fest_state admin write" on public.fest_state;
create policy "fest_state admin write" on public.fest_state
  for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

insert into public.fest_state (id, current_round) values ('singleton', 1)
  on conflict (id) do nothing;

notify pgrst, 'reload schema';
