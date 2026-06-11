-- =============================================================================
--  Fantasy World Cup 2026 — Supabase schema
--  Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New query).
--  ⚠️  Click the green RUN button (Cmd/Ctrl+Enter) to execute the WHOLE script.
--      Do NOT use "Explain" — it only accepts a single statement and will fail
--      with "EXPLAIN only works on a single SQL statement", leaving tables uncreated.
--  Safe to re-run: uses "if not exists" / "drop ... if exists" where practical.
-- =============================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ── 1. Public Users Table ────────────────────────────────────────────────────
create table if not exists public.users (
    id uuid references auth.users on delete cascade primary key,
    username text unique not null,
    email text unique not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ── 2. Leagues Table ─────────────────────────────────────────────────────────
create table if not exists public.leagues (
    id uuid default gen_random_uuid() primary key,
    name text not null,
    invite_code varchar(7) unique,            -- 7-char alphanumeric code for private leagues
    creator_id uuid references public.users(id) on delete set null,
    is_global boolean default false not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ── 3. League Members Junction (contextual RBAC roles) ───────────────────────
create table if not exists public.league_members (
    league_id uuid references public.leagues(id) on delete cascade,
    user_id uuid references public.users(id) on delete cascade,
    role text default 'member' check (role in ('admin', 'member')),
    joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
    primary key (league_id, user_id)
);

-- ── 4. Players ────────────────────────────────────────────────────────────────
-- Live attributes (price, points, status) come from the FIFA Fantasy API at
-- runtime: https://play.fifa.com/json/fantasy/players.json + squads.json.
-- This table exists ONLY to enrich each FIFA player with their real-life `club`
-- (the FIFA feed has no club field), which powers the United-Clubs rule.
-- Keyed by the FIFA integer player id. Seed it with supabase/seed_players.sql.
create table if not exists public.players (
    id bigint primary key,                     -- FIFA player id
    name text,
    country text,
    position text,
    club text,                                 -- latest real-life club (nullable)
    updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- ── 5. User Squads (one config per matchday) ─────────────────────────────────
create table if not exists public.user_squads (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.users(id) on delete cascade,
    matchday int not null,
    formation text default '4-4-2',
    budget_spent numeric(4,1) default 0.0,
    total_points int default 0,                -- snapshot of FIFA points at save time
    roulette_activated boolean default false,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(user_id, matchday)
);

-- ── 6. Squad Players Junction (starting XI vs bench, captaincy) ───────────────
-- player_id = FIFA integer player id (no FK; the pool lives in the FIFA API).
create table if not exists public.squad_players (
    squad_id uuid references public.user_squads(id) on delete cascade,
    player_id bigint not null,
    is_starting boolean default true not null,
    is_captain boolean default false not null,
    is_vice_captain boolean default false not null,
    primary key (squad_id, player_id)
);

-- Idempotent column guards — `create table if not exists` above is skipped when
-- a table already exists, so ensure later-added columns are present on re-runs.
alter table public.user_squads add column if not exists total_points int default 0;
alter table public.user_squads add column if not exists formation text default '4-4-2';
alter table public.players     add column if not exists club text;

-- =============================================================================
--  STEP 2: AUTH TRIGGER — auto-create profile + enroll in Global League
-- =============================================================================

-- Ensure the Global League row exists (fixed id for testing consistency)
insert into public.leagues (id, name, is_global, invite_code)
values ('00000000-0000-0000-0000-000000000000', 'Global League', true, null)
on conflict (id) do nothing;

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, username, email)
  values (
    new.id,
    -- keep usernames unique even if two emails share a local-part
    split_part(new.email, '@', 1) || '_' || substr(new.id::text, 1, 4),
    new.email
  )
  on conflict (id) do nothing;

  -- Auto-enroll into the Global League
  insert into public.league_members (league_id, user_id, role)
  values ('00000000-0000-0000-0000-000000000000', new.id, 'member')
  on conflict (league_id, user_id) do nothing;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- =============================================================================
--  STEP 3: ROW LEVEL SECURITY
-- =============================================================================

-- Helper: is the current user a member of a league?
-- SECURITY DEFINER bypasses RLS on league_members so policies that reference
-- membership do NOT recurse infinitely.
create or replace function public.is_member_of(_league uuid)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.league_members
    where league_id = _league and user_id = auth.uid()
  );
$$;

alter table public.users          enable row level security;
alter table public.leagues        enable row level security;
alter table public.league_members enable row level security;
alter table public.players        enable row level security;
alter table public.user_squads    enable row level security;
alter table public.squad_players  enable row level security;

-- ── players: anyone can read (club lookup), nobody writes from the frontend ───
drop policy if exists "players readable" on public.players;
create policy "players readable"
  on public.players for select using (true);

-- ── users ────────────────────────────────────────────────────────────────────
drop policy if exists "users readable by authenticated" on public.users;
create policy "users readable by authenticated"
  on public.users for select to authenticated using (true);

drop policy if exists "users update self" on public.users;
create policy "users update self"
  on public.users for update to authenticated
  using (auth.uid() = id) with check (auth.uid() = id);

-- ── leagues ──────────────────────────────────────────────────────────────────
drop policy if exists "leagues select global or member" on public.leagues;
create policy "leagues select global or member"
  on public.leagues for select to authenticated
  using (is_global = true or public.is_member_of(id));

drop policy if exists "leagues insert by creator" on public.leagues;
create policy "leagues insert by creator"
  on public.leagues for insert to authenticated
  with check (auth.uid() = creator_id and is_global = false);

drop policy if exists "leagues update by creator" on public.leagues;
create policy "leagues update by creator"
  on public.leagues for update to authenticated
  using (auth.uid() = creator_id) with check (auth.uid() = creator_id);

drop policy if exists "leagues delete by creator" on public.leagues;
create policy "leagues delete by creator"
  on public.leagues for delete to authenticated
  using (auth.uid() = creator_id);

-- ── league_members ───────────────────────────────────────────────────────────
-- A user can see member rows of any league they belong to; can add/remove themselves.
drop policy if exists "members select own leagues" on public.league_members;
create policy "members select own leagues"
  on public.league_members for select to authenticated
  using (user_id = auth.uid() or public.is_member_of(league_id));

drop policy if exists "members join self" on public.league_members;
create policy "members join self"
  on public.league_members for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "members leave self" on public.league_members;
create policy "members leave self"
  on public.league_members for delete to authenticated
  using (user_id = auth.uid());

-- ── user_squads: owner-only ──────────────────────────────────────────────────
drop policy if exists "squads owner all" on public.user_squads;
create policy "squads owner all"
  on public.user_squads for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── squad_players: owner-only (via parent squad) ─────────────────────────────
drop policy if exists "squad_players owner all" on public.squad_players;
create policy "squad_players owner all"
  on public.squad_players for all to authenticated
  using (
    exists (
      select 1 from public.user_squads s
      where s.id = squad_players.squad_id and s.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.user_squads s
      where s.id = squad_players.squad_id and s.user_id = auth.uid()
    )
  );

-- =============================================================================
--  STEP 4: MINI-LEAGUE RPCs (SECURITY DEFINER)
--  Direct inserts into `leagues` from the client trip over RLS (the creator
--  isn't a member yet, and a league can't be looked up by code before joining).
--  These functions run as owner (bypass RLS), enforce auth.uid(), and do the
--  league + membership writes atomically. They also self-heal a missing profile
--  row (for users who signed up before the handle_new_user trigger existed).
-- =============================================================================

-- Ensure the caller has a public.users profile row (FK target for memberships).
create or replace function public.ensure_profile()
returns void language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_email text := coalesce(auth.jwt() ->> 'email', v_uid::text || '@local');
begin
  if v_uid is null then return; end if;
  insert into public.users (id, username, email)
  values (v_uid, split_part(v_email, '@', 1) || '_' || substr(v_uid::text, 1, 4), v_email)
  on conflict (id) do nothing;
end;
$$;

create or replace function public.create_league(p_name text)
returns public.leagues language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_code text;
  v_league public.leagues;
begin
  if v_uid is null then raise exception 'Not authenticated'; end if;
  if coalesce(btrim(p_name), '') = '' then raise exception 'League name required'; end if;
  perform public.ensure_profile();

  loop
    v_code := upper(substr(md5(random()::text), 1, 6));
    exit when not exists (select 1 from public.leagues where invite_code = v_code);
  end loop;

  insert into public.leagues (name, invite_code, creator_id, is_global)
  values (btrim(p_name), v_code, v_uid, false)
  returning * into v_league;

  insert into public.league_members (league_id, user_id, role)
  values (v_league.id, v_uid, 'admin')
  on conflict (league_id, user_id) do nothing;

  return v_league;
end;
$$;

create or replace function public.join_league(p_code text)
returns public.leagues language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_league public.leagues;
begin
  if v_uid is null then raise exception 'Not authenticated'; end if;
  select * into v_league from public.leagues where invite_code = upper(btrim(p_code));
  if v_league.id is null then raise exception 'No league found for that code'; end if;
  perform public.ensure_profile();

  insert into public.league_members (league_id, user_id, role)
  values (v_league.id, v_uid, 'member')
  on conflict (league_id, user_id) do nothing;

  return v_league;
end;
$$;

grant execute on function public.create_league(text) to authenticated;
grant execute on function public.join_league(text)   to authenticated;

-- =============================================================================
--  Leaderboard helper view — total points per user across their saved squads.
--  user_squads.total_points is a snapshot written by the client at save time
--  (sum of the FIFA points of the user's selected players).
-- =============================================================================
create or replace view public.leaderboard as
  select
    u.id as user_id,
    u.username,
    coalesce(sum(s.total_points), 0)::int as total_points
  from public.users u
  left join public.user_squads s on s.user_id = u.id
  group by u.id, u.username;

-- Refresh the PostgREST API schema cache so new tables/columns are visible to
-- the app immediately (prevents "Could not find the table … in the schema cache").
notify pgrst, 'reload schema';

-- =============================================================================
--  MIGRATION (only if you ran the earlier uuid-based schema):
--  uncomment and run once to switch squad_players to FIFA integer ids.
-- =============================================================================
-- drop view if exists public.leaderboard;
-- alter table public.user_squads add column if not exists total_points int default 0;
-- delete from public.squad_players;                 -- old uuid rows are incompatible
-- alter table public.squad_players drop constraint if exists squad_players_player_id_fkey;
-- alter table public.squad_players alter column player_id type bigint using null;
-- -- recreate the club-enrichment players table (FIFA-int keyed):
-- drop table if exists public.players cascade;
-- create table public.players (id bigint primary key, name text, country text,
--   position text, club text, updated_at timestamptz default now());
-- alter table public.players enable row level security;
-- create policy "players readable" on public.players for select using (true);
-- (then re-run the leaderboard view above and run supabase/seed_players.sql)
