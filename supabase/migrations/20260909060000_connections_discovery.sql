begin;
create table public.connections (
  follower_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  followed_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, followed_id),
  constraint connections_no_self check (follower_id <> followed_id)
);
create index connections_followed on public.connections(followed_id);
alter table public.connections enable row level security;
revoke all on public.connections from public, anon, authenticated;
grant select, delete on public.connections to authenticated;
grant insert(follower_id, followed_id) on public.connections to authenticated;
create policy connections_read_own on public.connections for select to authenticated using(follower_id = (select auth.uid()));
create policy connections_insert_own on public.connections for insert to authenticated with check(follower_id = (select auth.uid()));
create policy connections_delete_own on public.connections for delete to authenticated using(follower_id = (select auth.uid()));

create function public.discover_players(p_offset integer default 0, p_sport_id uuid default null,
  p_arena_id uuid default null, p_level public.player_level default null, p_active boolean default false)
returns table(id uuid, username text, display_name text, bio text, city text, neighborhood text, available boolean,
  is_demo boolean, sport_name text, sport_slug public.sport_slug, level public.player_level,
  connected boolean, arena_name text, arena_slug text, expires_at timestamptz)
language plpgsql stable security invoker set search_path = '' as $$
begin
  if auth.uid() is null then raise insufficient_privilege using message = 'Authentication required'; end if;
  if p_offset is null or p_offset < 0 or p_offset > 10000 or p_active is null then raise check_violation using message = 'Invalid filter'; end if;
  return query select p.id, p.username, p.display_name, p.bio, p.city, p.neighborhood, p.available, p.is_demo,
    game.name, game.slug, game.level,
    exists(select 1 from public.connections c where c.follower_id = auth.uid() and c.followed_id = p.id),
    presence.name, presence.slug, presence.expires_at
    from public.profiles p
    join lateral (select s.name, s.slug, ps.level from public.player_sports ps join public.sports s on s.id = ps.sport_id
      where ps.player_id = p.id and (p_sport_id is null or ps.sport_id = p_sport_id) and (p_level is null or ps.level = p_level)
      order by ps.is_primary desc, s.name limit 1) game on true
    left join lateral (select a.name, a.slug, c.expires_at from public.checkins c join public.arenas a on a.id = c.arena_id
      where c.player_id = p.id and (p_arena_id is null or c.arena_id = p_arena_id)
      and (p_sport_id is null or c.sport_id = p_sport_id)
      order by c.started_at desc limit 1) presence on true
    where p.id <> auth.uid() and p.onboarding_completed
      and (not p_active or presence.expires_at is not null)
      and (p_arena_id is null or presence.expires_at is not null or exists(
        select 1 from public.arena_members m where m.player_id = p.id and m.arena_id = p_arena_id))
    order by p.available desc, p.display_name, p.id limit 25 offset p_offset;
end;
$$;
revoke all on function public.discover_players(integer,uuid,uuid,public.player_level,boolean) from public, anon, authenticated;
grant execute on function public.discover_players(integer,uuid,uuid,public.player_level,boolean) to authenticated;
commit;
