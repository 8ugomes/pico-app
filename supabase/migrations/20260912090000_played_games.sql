begin;
-- Preserve legacy rows and signatures, but close every client presence surface.
revoke all on public.checkins from public, anon, authenticated;
revoke all on function public.start_checkin(uuid,uuid), public.end_checkin(), public.read_checkin_history(integer), public.activity_summary(uuid) from public, anon, authenticated;
create policy checkins_retired on public.checkins as restrictive for all to authenticated using(false) with check(false);
comment on table public.checkins is 'Retired presence data. Preserved privately; no client access or conversion to games/posts.';

-- Keep the legacy RPC signature compatible; the active filter is explicitly retired.
create or replace function public.discover_players(p_offset integer default 0, p_sport_id uuid default null,
 p_arena_id uuid default null, p_level public.player_level default null, p_active boolean default false)
returns table(id uuid, username text, display_name text, bio text, city text, neighborhood text, available boolean,
 is_demo boolean, sport_name text, sport_slug public.sport_slug, level public.player_level,
 connected boolean, arena_name text, arena_slug text, expires_at timestamptz)
language plpgsql stable security invoker set search_path='' as $$
begin
 if not pico_private.active_account() then raise insufficient_privilege; end if;
 if p_offset is null or p_offset<0 or p_offset>10000 or p_active is distinct from false then raise check_violation; end if;
 return query select p.id,p.username,p.display_name,p.bio,p.city,p.neighborhood,false,p.is_demo,
 game.name,game.slug,game.level,
 exists(select 1 from public.connections c where c.follower_id=auth.uid() and c.followed_id=p.id),
 null::text,null::text,null::timestamptz
 from public.profiles p
 join lateral(select s.name,s.slug,ps.level from public.player_sports ps join public.sports s on s.id=ps.sport_id
 where ps.player_id=p.id and (p_sport_id is null or ps.sport_id=p_sport_id) and (p_level is null or ps.level=p_level)
 order by ps.is_primary desc,s.name limit 1) game on true
 where p.id<>auth.uid() and p.onboarding_completed and (p_arena_id is null or exists(
 select 1 from public.arena_members m join public.arenas a on a.id=m.arena_id
 where m.player_id=p.id and m.arena_id=p_arena_id and m.status='active'))
 order by p.display_name,p.id limit 25 offset p_offset;
end;
$$;

create table public.played_games (
 id uuid primary key,
 player_id uuid not null references public.profiles(id) on delete cascade,
 arena_id uuid not null,
 sport_id uuid not null,
 played_on date not null,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 version integer not null default 1 check(version>0),
 foreign key(arena_id,sport_id) references public.arena_sports(arena_id,sport_id)
);
create index played_games_owner_date on public.played_games(player_id,played_on desc,id desc);
alter table public.played_games enable row level security;
revoke all on public.played_games from public,anon,authenticated;
grant select on public.played_games to authenticated;
create policy played_games_own on public.played_games for select to authenticated
 using(player_id=(select auth.uid()) and (select pico_private.active_account()));
comment on table public.played_games is 'Private self-declared past games. No location verification, presence, distribution or notifications. played_on is not publication time.';

-- Keep only ownership + key after deletion, never arena/date/content. Prevent a
-- delayed create retry from resurrecting a deleted game. No client access.
create table pico_private.deleted_game_keys (
 id uuid primary key,
 player_id uuid not null references public.profiles(id) on delete cascade
);
alter table pico_private.deleted_game_keys enable row level security;
revoke all on pico_private.deleted_game_keys from public,anon,authenticated;

create function public.save_played_game(p_id uuid,p_arena uuid,p_sport uuid,p_played_on date,p_version integer default null)
returns uuid language plpgsql security definer set search_path='' as $$
declare existing public.played_games; who uuid:=auth.uid();
begin
 if not pico_private.active_account() then raise insufficient_privilege;end if;
 -- Serialize retries and edits per owner, as with existing social writes.
 perform 1 from public.profiles where id=who for update;
 if exists(select 1 from pico_private.deleted_game_keys where id=p_id) then raise sqlstate 'P0409';end if;
 if p_id is null or p_arena is null or p_sport is null or p_played_on is null or not isfinite(p_played_on)
 or p_played_on>(clock_timestamp() at time zone 'America/Sao_Paulo')::date or p_played_on<date '1900-01-01' then raise check_violation;end if;
 select * into existing from public.played_games where id=p_id;
 if found then
  if existing.player_id<>who then raise insufficient_privilege;end if;
  if existing.arena_id=p_arena and existing.sport_id=p_sport and existing.played_on=p_played_on then return p_id;end if;
  if p_version is null or existing.version<>p_version then raise sqlstate 'P0409';end if;
 elsif p_version is not null then raise sqlstate 'P0409';
 end if;
 if (existing.id is null or existing.arena_id<>p_arena or existing.sport_id<>p_sport) and not exists(select 1 from public.arenas a join public.arena_sports s on s.arena_id=a.id
 where a.id=p_arena and s.sport_id=p_sport and a.is_public and a.status<>'archived' and s.enabled) then raise check_violation;end if;
 perform pico_private.consume_write('played_games',60,3600);
 if existing.id is null then
  insert into public.played_games(id,player_id,arena_id,sport_id,played_on) values(p_id,who,p_arena,p_sport,p_played_on);
 else
  update public.played_games set arena_id=p_arena,sport_id=p_sport,played_on=p_played_on,updated_at=clock_timestamp(),version=version+1 where id=p_id;
 end if;
 return p_id;
end;
$$;
create function public.delete_played_game(p_id uuid) returns void language plpgsql security definer set search_path='' as $$
begin
 if not pico_private.active_account() then raise insufficient_privilege;end if;
 perform 1 from public.profiles where id=auth.uid() for update;
 insert into pico_private.deleted_game_keys(id,player_id)
 select id,player_id from public.played_games where id=p_id and player_id=auth.uid() on conflict do nothing;
 delete from public.played_games where id=p_id and player_id=auth.uid();
end;
$$;
create function public.read_played_games(p_offset integer default 0) returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
 if not pico_private.active_account() then raise insufficient_privilege;end if;
 if p_offset is null or p_offset<0 or p_offset>10000 then raise check_violation;end if;
 return coalesce((select jsonb_agg(row_to_json(q)) from(select g.id,g.arena_id,a.slug arena_slug,a.name arena_name,a.is_demo,g.sport_id,s.name sport_name,s.slug sport_slug,g.played_on,g.created_at,g.updated_at,g.version
 from public.played_games g join public.arenas a on a.id=g.arena_id join public.sports s on s.id=g.sport_id
 where g.player_id=auth.uid() order by g.played_on desc,g.id desc limit 21 offset p_offset)q),'[]'::jsonb);
end;
$$;
revoke all on function public.save_played_game(uuid,uuid,uuid,date,integer),public.delete_played_game(uuid),public.read_played_games(integer) from public,anon,authenticated;
grant execute on function public.save_played_game(uuid,uuid,uuid,date,integer),public.delete_played_game(uuid),public.read_played_games(integer) to authenticated;
commit;
