-- Commander League — Supabase schema.
-- Run this in your Supabase project: SQL Editor > New query > paste > Run.
-- (Only needed if you want shared accounts + one shared leaderboard. The app
--  also runs fully offline in "local mode" with no Supabase at all.)

-- 1. Profiles: one row per registered player, linked to Supabase auth users.
create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  email        text,
  display_name text not null,
  commander    text default '',
  color        text default '#8b5cf6',
  bio          text default '',
  is_admin     boolean not null default false,
  created_at   timestamptz not null default now()
);

-- 2. Match days: each Sunday's schedule + results stored as JSON.
create table if not exists public.match_days (
  id         uuid primary key,
  date       date not null,
  rounds     jsonb not null default '[]',
  created_at timestamptz not null default now()
);

-- 3. Row Level Security.
alter table public.profiles   enable row level security;
alter table public.match_days enable row level security;

-- Everyone can read profiles and the calendar (public league pages).
create policy "profiles readable" on public.profiles
  for select using (true);
create policy "match_days readable" on public.match_days
  for select using (true);

-- A signed-in user can create their own profile row and edit only their own.
create policy "insert own profile" on public.profiles
  for insert with check (auth.uid() = id);
create policy "update own profile" on public.profiles
  for update using (auth.uid() = id);

-- Any signed-in user may manage match days. To restrict this to admins only,
-- replace `auth.role() = 'authenticated'` below with:
--   exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
create policy "members manage match_days" on public.match_days
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- Tip: the first person to register is made admin automatically by the app.
-- To promote someone manually:
--   update public.profiles set is_admin = true where email = 'you@example.com';

-- 4. Funciones de organizador (nombrar admin / eliminar participante).
--    SECURITY DEFINER evita recursión de RLS y centraliza el control de acceso.
create or replace function public.is_admin(uid uuid)
returns boolean language sql security definer set search_path = public as $$
  select coalesce((select is_admin from public.profiles where id = uid), false);
$$;

create or replace function public.set_admin(target uuid, value boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'Solo un organizador puede cambiar organizadores';
  end if;
  update public.profiles set is_admin = value where id = target;
end;
$$;

create or replace function public.delete_player(target uuid)
returns void language plpgsql security definer set search_path = public as $$
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

grant execute on function public.is_admin(uuid)           to authenticated;
grant execute on function public.set_admin(uuid, boolean) to authenticated;
grant execute on function public.delete_player(uuid)      to authenticated;
