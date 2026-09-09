-- Cycle 1: reproducible social schema. Requires Supabase auth.users and auth.uid().
-- No accounts, credentials, storage buckets, or grants to anonymous social data.
begin;

create type public.sport_slug as enum ('futevolei', 'beach-tennis', 'volei-praia');
create type public.player_level as enum ('Iniciante', 'Intermediário', 'Avançado');

create table public.sports (
  id uuid primary key default gen_random_uuid(),
  slug public.sport_slug not null unique,
  name text not null check (char_length(btrim(name)) between 2 and 60)
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique check (username ~ '^[a-z0-9_]{3,40}$'),
  display_name text not null check (char_length(btrim(display_name)) between 2 and 60),
  bio text not null default '' check (char_length(bio) <= 160),
  city text not null default '' check (char_length(city) <= 80),
  neighborhood text not null default '' check (char_length(neighborhood) <= 80),
  avatar_path text check (char_length(avatar_path) <= 300),
  available boolean not null default false,
  onboarding_completed boolean not null default false,
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.arenas (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 80),
  name text not null check (char_length(btrim(name)) between 2 and 100),
  description text not null default '' check (char_length(description) <= 1000),
  neighborhood text not null check (char_length(btrim(neighborhood)) between 1 and 80),
  city text not null check (char_length(btrim(city)) between 1 and 80),
  image_path text check (char_length(image_path) <= 300),
  is_public boolean not null default true,
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.arena_sports (
  arena_id uuid not null references public.arenas(id) on delete cascade,
  sport_id uuid not null references public.sports(id) on delete restrict,
  primary key (arena_id, sport_id)
);

create table public.player_sports (
  player_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  sport_id uuid not null references public.sports(id) on delete restrict,
  level public.player_level not null default 'Iniciante',
  is_primary boolean not null default false,
  primary key (player_id, sport_id)
);
create unique index player_sports_one_primary on public.player_sports (player_id) where is_primary;
create index player_sports_discovery on public.player_sports (sport_id, level, player_id);

create table public.arena_members (
  arena_id uuid not null references public.arenas(id) on delete cascade,
  player_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (arena_id, player_id)
);
create index arena_members_player on public.arena_members (player_id, arena_id);

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  arena_id uuid not null,
  sport_id uuid not null,
  body text not null check (char_length(body) between 1 and 500 and body ~ '[^[:space:]]'),
  image_path text check (char_length(image_path) <= 300),
  created_at timestamptz not null default now(),
  foreign key (arena_id, sport_id) references public.arena_sports (arena_id, sport_id) on delete restrict
);
create index posts_feed on public.posts (created_at desc, id desc);
create index posts_arena_feed on public.posts (arena_id, created_at desc, id desc);
create index posts_author_feed on public.posts (author_id, created_at desc, id desc);

create table public.post_likes (
  post_id uuid not null references public.posts(id) on delete cascade,
  player_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, player_id)
);
create index post_likes_player on public.post_likes (player_id);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 280 and body ~ '[^[:space:]]'),
  created_at timestamptz not null default now()
);
create index comments_post on public.comments (post_id, created_at, id);
create index comments_author on public.comments (author_id);

create table public.checkins (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.profiles(id) on delete cascade,
  arena_id uuid not null,
  sport_id uuid not null,
  started_at timestamptz not null default now(),
  expires_at timestamptz not null,
  ended_at timestamptz,
  foreign key (arena_id, sport_id) references public.arena_sports (arena_id, sport_id) on delete restrict,
  check (expires_at > started_at and expires_at <= started_at + interval '2 hours'),
  check (ended_at is null or ended_at >= started_at)
);
create unique index checkins_one_open_per_player on public.checkins (player_id) where ended_at is null;
create index checkins_arena_presence on public.checkins (arena_id, expires_at) where ended_at is null;
create index checkins_player on public.checkins (player_id, started_at desc);

-- Enable RLS and undo possible Supabase default privileges before restoring minimum grants.
alter table public.profiles enable row level security;
alter table public.sports enable row level security;
alter table public.arenas enable row level security;
alter table public.arena_sports enable row level security;
alter table public.player_sports enable row level security;
alter table public.arena_members enable row level security;
alter table public.posts enable row level security;
alter table public.post_likes enable row level security;
alter table public.comments enable row level security;
alter table public.checkins enable row level security;

revoke all on public.profiles, public.sports, public.arenas, public.arena_sports,
  public.player_sports, public.arena_members, public.posts, public.post_likes,
  public.comments, public.checkins from public, anon, authenticated;
grant usage on schema public to anon, authenticated;
grant usage on type public.sport_slug, public.player_level to anon, authenticated;
grant select on public.sports, public.arenas, public.arena_sports to anon, authenticated;
grant select on public.profiles, public.player_sports, public.arena_members,
  public.posts, public.post_likes, public.comments, public.checkins to authenticated;
grant update (username, display_name, bio, city, neighborhood, avatar_path, available, onboarding_completed)
  on public.profiles to authenticated;
grant insert (player_id, sport_id, level, is_primary), update (level, is_primary), delete
  on public.player_sports to authenticated;
grant insert (arena_id, player_id), delete on public.arena_members to authenticated;
grant insert (author_id, arena_id, sport_id, body, image_path), update (body, image_path), delete
  on public.posts to authenticated;
grant insert (post_id, player_id), delete on public.post_likes to authenticated;
grant insert (post_id, author_id, body), update (body), delete on public.comments to authenticated;
-- No direct client writes to checkins, even to the client's own row. RPCs arrive in Cycle 4.

create policy sports_read on public.sports for select to anon, authenticated using (true);
create policy arenas_read on public.arenas for select to anon, authenticated using (is_public);
create policy arena_sports_read on public.arena_sports for select to anon, authenticated
  using (exists (select 1 from public.arenas a where a.id = arena_id and a.is_public));

create policy profiles_read on public.profiles for select to authenticated using (true);
create policy profiles_update_own on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy player_sports_read on public.player_sports for select to authenticated using (true);
create policy player_sports_insert_own on public.player_sports for insert to authenticated
  with check (player_id = (select auth.uid()));
create policy player_sports_update_own on public.player_sports for update to authenticated
  using (player_id = (select auth.uid())) with check (player_id = (select auth.uid()));
create policy player_sports_delete_own on public.player_sports for delete to authenticated
  using (player_id = (select auth.uid()));

create policy arena_members_read on public.arena_members for select to authenticated
  using (exists (select 1 from public.arenas a where a.id = arena_id and a.is_public));
create policy arena_members_insert_own on public.arena_members for insert to authenticated
  with check (player_id = (select auth.uid()) and exists (select 1 from public.arenas a where a.id = arena_id and a.is_public));
create policy arena_members_delete_own on public.arena_members for delete to authenticated
  using (player_id = (select auth.uid()));

create policy posts_read on public.posts for select to authenticated
  using (exists (select 1 from public.arenas a where a.id = arena_id and a.is_public));
create policy posts_insert_own on public.posts for insert to authenticated
  with check (author_id = (select auth.uid()) and exists (select 1 from public.arenas a where a.id = arena_id and a.is_public));
create policy posts_update_own on public.posts for update to authenticated
  using (author_id = (select auth.uid()))
  with check (author_id = (select auth.uid()) and exists (select 1 from public.arenas a where a.id = arena_id and a.is_public));
create policy posts_delete_own on public.posts for delete to authenticated using (author_id = (select auth.uid()));

create policy post_likes_read on public.post_likes for select to authenticated
  using (exists (select 1 from public.posts p where p.id = post_id));
create policy post_likes_insert_own on public.post_likes for insert to authenticated
  with check (player_id = (select auth.uid()) and exists (select 1 from public.posts p where p.id = post_id));
create policy post_likes_delete_own on public.post_likes for delete to authenticated using (player_id = (select auth.uid()));

create policy comments_read on public.comments for select to authenticated
  using (exists (select 1 from public.posts p where p.id = post_id));
create policy comments_insert_own on public.comments for insert to authenticated
  with check (author_id = (select auth.uid()) and exists (select 1 from public.posts p where p.id = post_id));
create policy comments_update_own on public.comments for update to authenticated
  using (author_id = (select auth.uid()))
  with check (author_id = (select auth.uid()) and exists (select 1 from public.posts p where p.id = post_id));
create policy comments_delete_own on public.comments for delete to authenticated using (author_id = (select auth.uid()));

create policy checkins_read_active on public.checkins for select to authenticated
  using (ended_at is null and expires_at > now()
    and exists (select 1 from public.arenas a where a.id = arena_id and a.is_public));

-- SECURITY DEFINER is restricted to this trigger; metadata never determines identity or roles.
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  safe_name text;
begin
  if jsonb_typeof(new.raw_user_meta_data -> 'display_name') = 'string' then
    safe_name := left(btrim(new.raw_user_meta_data ->> 'display_name'), 60);
  end if;
  if safe_name is null or char_length(safe_name) < 2 then
    safe_name := 'Novo jogador';
  end if;
  insert into public.profiles (id, username, display_name)
  values (new.id, 'pico_' || replace(new.id::text, '-', ''), safe_name);
  return new;
end;
$$;
revoke all on function public.handle_new_user() from public, anon, authenticated;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Support accounts that existed before the migration, without exposing their email.
insert into public.profiles (id, username, display_name)
select id, 'pico_' || replace(id::text, '-', ''), 'Novo jogador' from auth.users
on conflict (id) do nothing;

comment on table public.profiles is 'Public-to-authenticated social fields only; never store email, tokens or permissions here.';
comment on column public.arenas.is_demo is 'True for clearly fictional arenas. The application must display that label.';
comment on table public.checkins is 'Voluntary presence; direct client writes denied. Only reviewed RPCs may write.';
commit;
