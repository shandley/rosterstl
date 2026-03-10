-- ============================================================================
-- RosterSTL Initial Schema
-- ============================================================================

-- ============================================================================
-- 1. EXTENSIONS
-- ============================================================================
create extension if not exists "moddatetime" with schema "extensions";
create extension if not exists "pgcrypto" with schema "extensions";

-- ============================================================================
-- 2. PRIVATE SCHEMA
-- ============================================================================
create schema if not exists private;

-- ============================================================================
-- 3. TABLES
-- ============================================================================

-- profiles
create table public.profiles (
  id          uuid primary key references auth.users on delete cascade,
  email       text not null,
  full_name   text not null default '',
  avatar_url  text,
  phone       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
comment on table public.profiles is 'Public user profiles, synced from auth.users on signup.';

-- teams
create table public.teams (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  sport       text not null check (sport in (
                'soccer', 'baseball', 'softball', 'basketball',
                'volleyball', 'hockey', 'lacrosse'
              )),
  age_group   text not null,
  season      text not null,
  created_by  uuid not null references public.profiles on delete cascade,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- team_members
create table public.team_members (
  id        uuid primary key default gen_random_uuid(),
  team_id   uuid not null references public.teams on delete cascade,
  user_id   uuid not null references public.profiles on delete cascade,
  role      text not null check (role in ('parent', 'coach', 'team_manager')),
  joined_at timestamptz not null default now(),
  unique (team_id, user_id)
);

-- players (managed by parents, no auth account)
create table public.players (
  id            uuid primary key default gen_random_uuid(),
  team_id       uuid not null references public.teams on delete cascade,
  managed_by    uuid not null references public.profiles on delete cascade,
  full_name     text not null,
  jersey_number text,
  position      text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- venues (St. Louis pre-seeded)
create table public.venues (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  address       text not null,
  city          text not null,
  state         text not null default 'MO',
  zip           text not null,
  lat           double precision,
  lng           double precision,
  parking_notes text,
  field_count   integer,
  sport_types   text[],
  created_at    timestamptz not null default now()
);

-- events
create table public.events (
  id              uuid primary key default gen_random_uuid(),
  team_id         uuid not null references public.teams on delete cascade,
  venue_id        uuid references public.venues on delete set null,
  title           text not null,
  event_type      text not null check (event_type in ('game', 'practice', 'other')),
  start_time      timestamptz not null,
  end_time        timestamptz not null,
  notes           text,
  recurrence_rule text,
  is_home_game    boolean,
  opponent_name   text,
  created_by      uuid not null references public.profiles on delete cascade,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint valid_time_range check (end_time > start_time)
);

-- game_results
create table public.game_results (
  id             uuid primary key default gen_random_uuid(),
  event_id       uuid not null references public.events on delete cascade unique,
  team_score     integer not null check (team_score >= 0),
  opponent_score integer not null check (opponent_score >= 0),
  result         text not null check (result in ('win', 'loss', 'draw')),
  notes          text,
  recorded_by    uuid not null references public.profiles on delete cascade,
  created_at     timestamptz not null default now()
);

-- availability (RSVP per player per event)
create table public.availability (
  event_id     uuid not null references public.events on delete cascade,
  player_id    uuid not null references public.players on delete cascade,
  status       text not null check (status in ('yes', 'no', 'maybe')),
  responded_by uuid not null references public.profiles on delete cascade,
  updated_at   timestamptz not null default now(),
  primary key (event_id, player_id)
);

-- announcements
create table public.announcements (
  id         uuid primary key default gen_random_uuid(),
  team_id    uuid not null references public.teams on delete cascade,
  author_id  uuid not null references public.profiles on delete cascade,
  title      text,
  body       text not null,
  created_at timestamptz not null default now()
);

-- team_invites
create table public.team_invites (
  id          uuid primary key default gen_random_uuid(),
  team_id     uuid not null references public.teams on delete cascade,
  invite_code text not null unique default encode(extensions.gen_random_bytes(16), 'hex'),
  role        text not null check (role in ('parent', 'coach', 'team_manager')),
  expires_at  timestamptz not null,
  max_uses    integer,
  use_count   integer not null default 0,
  created_by  uuid not null references public.profiles on delete cascade,
  created_at  timestamptz not null default now()
);

-- notifications
create table public.notifications (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.profiles on delete cascade,
  notification_type text not null,
  title             text not null,
  body              text,
  metadata          jsonb,
  read              boolean not null default false,
  created_at        timestamptz not null default now()
);

-- ============================================================================
-- 4. FUNCTIONS (after tables exist)
-- ============================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
  );
  return new;
end;
$$;

create or replace function private.get_team_ids_for_user()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select team_id
  from public.team_members
  where user_id = (select auth.uid());
$$;

create or replace function private.has_team_role(_team_id uuid, _allowed_roles text[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.team_members
    where team_id = _team_id
      and user_id = (select auth.uid())
      and role = any(_allowed_roles)
  );
$$;

create or replace function private.get_managed_player_ids()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select id
  from public.players
  where managed_by = (select auth.uid());
$$;

-- ============================================================================
-- 5. INDEXES
-- ============================================================================
create index idx_team_members_user_id    on public.team_members (user_id);
create index idx_team_members_team_id    on public.team_members (team_id);
create index idx_players_team_id         on public.players (team_id);
create index idx_players_managed_by      on public.players (managed_by);
create index idx_events_team_start       on public.events (team_id, start_time);
create index idx_availability_event_id   on public.availability (event_id);
create index idx_notifications_user_read on public.notifications (user_id, read);

-- ============================================================================
-- 6. ENABLE ROW LEVEL SECURITY
-- ============================================================================
alter table public.profiles      enable row level security;
alter table public.teams         enable row level security;
alter table public.team_members  enable row level security;
alter table public.players       enable row level security;
alter table public.venues        enable row level security;
alter table public.events        enable row level security;
alter table public.game_results  enable row level security;
alter table public.availability  enable row level security;
alter table public.announcements enable row level security;
alter table public.team_invites  enable row level security;
alter table public.notifications enable row level security;

-- ============================================================================
-- 7. RLS POLICIES
-- ============================================================================

-- ---------- profiles ----------
create policy "profiles: select for authenticated"
  on public.profiles for select to authenticated
  using ( true );

create policy "profiles: update own"
  on public.profiles for update to authenticated
  using ( id = (select auth.uid()) )
  with check ( id = (select auth.uid()) );

-- ---------- teams ----------
create policy "teams: select for members"
  on public.teams for select to authenticated
  using ( id in (select private.get_team_ids_for_user()) );

create policy "teams: insert for authenticated"
  on public.teams for insert to authenticated
  with check ( created_by = (select auth.uid()) );

create policy "teams: update for creator"
  on public.teams for update to authenticated
  using ( created_by = (select auth.uid()) )
  with check ( created_by = (select auth.uid()) );

create policy "teams: delete for creator"
  on public.teams for delete to authenticated
  using ( created_by = (select auth.uid()) );

-- ---------- team_members ----------
create policy "team_members: select for team members"
  on public.team_members for select to authenticated
  using ( team_id in (select private.get_team_ids_for_user()) );

create policy "team_members: insert for coaches/managers"
  on public.team_members for insert to authenticated
  with check ( (select private.has_team_role(team_id, array['coach', 'team_manager'])) );

create policy "team_members: delete for coaches/managers"
  on public.team_members for delete to authenticated
  using ( (select private.has_team_role(team_id, array['coach', 'team_manager'])) );

-- ---------- players ----------
create policy "players: select for team members"
  on public.players for select to authenticated
  using ( team_id in (select private.get_team_ids_for_user()) );

create policy "players: insert for managing parent"
  on public.players for insert to authenticated
  with check (
    managed_by = (select auth.uid())
    and team_id in (select private.get_team_ids_for_user())
  );

create policy "players: update for managing parent"
  on public.players for update to authenticated
  using ( managed_by = (select auth.uid()) )
  with check ( managed_by = (select auth.uid()) );

create policy "players: delete for managing parent"
  on public.players for delete to authenticated
  using ( managed_by = (select auth.uid()) );

create policy "players: insert for coaches/managers"
  on public.players for insert to authenticated
  with check ( (select private.has_team_role(team_id, array['coach', 'team_manager'])) );

create policy "players: update for coaches/managers"
  on public.players for update to authenticated
  using ( (select private.has_team_role(team_id, array['coach', 'team_manager'])) );

create policy "players: delete for coaches/managers"
  on public.players for delete to authenticated
  using ( (select private.has_team_role(team_id, array['coach', 'team_manager'])) );

-- ---------- venues ----------
create policy "venues: select for everyone"
  on public.venues for select to authenticated, anon
  using ( true );

create policy "venues: insert for coaches/managers"
  on public.venues for insert to authenticated
  with check (
    exists (
      select 1 from public.team_members
      where user_id = (select auth.uid())
        and role in ('coach', 'team_manager')
    )
  );

create policy "venues: update for coaches/managers"
  on public.venues for update to authenticated
  using (
    exists (
      select 1 from public.team_members
      where user_id = (select auth.uid())
        and role in ('coach', 'team_manager')
    )
  );

-- ---------- events ----------
create policy "events: select for team members"
  on public.events for select to authenticated
  using ( team_id in (select private.get_team_ids_for_user()) );

create policy "events: insert for coaches/managers"
  on public.events for insert to authenticated
  with check (
    created_by = (select auth.uid())
    and (select private.has_team_role(team_id, array['coach', 'team_manager']))
  );

create policy "events: update for coaches/managers"
  on public.events for update to authenticated
  using ( (select private.has_team_role(team_id, array['coach', 'team_manager'])) );

create policy "events: delete for coaches/managers"
  on public.events for delete to authenticated
  using ( (select private.has_team_role(team_id, array['coach', 'team_manager'])) );

-- ---------- game_results ----------
create policy "game_results: select for team members"
  on public.game_results for select to authenticated
  using (
    event_id in (
      select e.id from public.events e
      where e.team_id in (select private.get_team_ids_for_user())
    )
  );

create policy "game_results: insert for coaches/managers"
  on public.game_results for insert to authenticated
  with check (
    recorded_by = (select auth.uid())
    and exists (
      select 1 from public.events e
      where e.id = event_id
        and (select private.has_team_role(e.team_id, array['coach', 'team_manager']))
    )
  );

create policy "game_results: update for coaches/managers"
  on public.game_results for update to authenticated
  using (
    exists (
      select 1 from public.events e
      where e.id = event_id
        and (select private.has_team_role(e.team_id, array['coach', 'team_manager']))
    )
  );

-- ---------- availability ----------
create policy "availability: select for team members"
  on public.availability for select to authenticated
  using (
    event_id in (
      select e.id from public.events e
      where e.team_id in (select private.get_team_ids_for_user())
    )
  );

create policy "availability: insert for managing parent"
  on public.availability for insert to authenticated
  with check (
    responded_by = (select auth.uid())
    and player_id in (select private.get_managed_player_ids())
  );

create policy "availability: update for managing parent"
  on public.availability for update to authenticated
  using (
    responded_by = (select auth.uid())
    and player_id in (select private.get_managed_player_ids())
  )
  with check (
    responded_by = (select auth.uid())
    and player_id in (select private.get_managed_player_ids())
  );

create policy "availability: insert for coaches/managers"
  on public.availability for insert to authenticated
  with check (
    exists (
      select 1 from public.events e
      where e.id = event_id
        and (select private.has_team_role(e.team_id, array['coach', 'team_manager']))
    )
  );

create policy "availability: update for coaches/managers"
  on public.availability for update to authenticated
  using (
    exists (
      select 1 from public.events e
      where e.id = event_id
        and (select private.has_team_role(e.team_id, array['coach', 'team_manager']))
    )
  );

-- ---------- announcements ----------
create policy "announcements: select for team members"
  on public.announcements for select to authenticated
  using ( team_id in (select private.get_team_ids_for_user()) );

create policy "announcements: insert for coaches/managers"
  on public.announcements for insert to authenticated
  with check (
    author_id = (select auth.uid())
    and (select private.has_team_role(team_id, array['coach', 'team_manager']))
  );

-- ---------- team_invites ----------
create policy "team_invites: select for coaches/managers"
  on public.team_invites for select to authenticated
  using ( (select private.has_team_role(team_id, array['coach', 'team_manager'])) );

create policy "team_invites: insert for coaches/managers"
  on public.team_invites for insert to authenticated
  with check (
    created_by = (select auth.uid())
    and (select private.has_team_role(team_id, array['coach', 'team_manager']))
  );

create policy "team_invites: delete for coaches/managers"
  on public.team_invites for delete to authenticated
  using ( (select private.has_team_role(team_id, array['coach', 'team_manager'])) );

-- ---------- notifications ----------
create policy "notifications: select own"
  on public.notifications for select to authenticated
  using ( user_id = (select auth.uid()) );

create policy "notifications: update own"
  on public.notifications for update to authenticated
  using ( user_id = (select auth.uid()) )
  with check ( user_id = (select auth.uid()) );

-- ============================================================================
-- 8. MODDATETIME TRIGGERS
-- ============================================================================
create trigger handle_updated_at before update on public.profiles
  for each row execute procedure extensions.moddatetime(updated_at);

create trigger handle_updated_at before update on public.teams
  for each row execute procedure extensions.moddatetime(updated_at);

create trigger handle_updated_at before update on public.players
  for each row execute procedure extensions.moddatetime(updated_at);

create trigger handle_updated_at before update on public.events
  for each row execute procedure extensions.moddatetime(updated_at);

create trigger handle_updated_at before update on public.availability
  for each row execute procedure extensions.moddatetime(updated_at);

-- ============================================================================
-- 9. PROFILE SYNC TRIGGER
-- ============================================================================
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================================
-- 10. INVITE REDEMPTION RPC
-- ============================================================================
create or replace function public.redeem_invite(_invite_code text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  _invite record;
  _user_id uuid;
begin
  _user_id := (select auth.uid());
  if _user_id is null then
    raise exception 'Not authenticated';
  end if;

  select * into _invite
  from public.team_invites
  where invite_code = _invite_code
    and expires_at > now()
    and (max_uses is null or use_count < max_uses)
  for update;

  if not found then
    raise exception 'Invalid or expired invite code';
  end if;

  if exists (
    select 1 from public.team_members
    where team_id = _invite.team_id
      and user_id = _user_id
  ) then
    raise exception 'Already a member of this team';
  end if;

  insert into public.team_members (team_id, user_id, role)
  values (_invite.team_id, _user_id, _invite.role);

  update public.team_invites
  set use_count = use_count + 1
  where id = _invite.id;

  return jsonb_build_object(
    'team_id', _invite.team_id,
    'role', _invite.role
  );
end;
$$;
