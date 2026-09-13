begin;
-- Game dates are a deliberate publication snapshot, never a public game journal.
create table public.post_game_context (
 post_id uuid primary key references public.posts(id) on delete cascade,
 played_on date not null
);
alter table public.post_game_context enable row level security;
revoke all on public.post_game_context from public,anon,authenticated;
grant select on public.post_game_context to authenticated;
create policy post_game_context_read on public.post_game_context for select to authenticated
 using(pico_private.can_read_post(post_id));

-- Retain acknowledgment keys when a publication is deleted. A late retry must
-- neither publish again nor resurrect content. No game location/body is stored here.
create table pico_private.game_publications (
 player_id uuid not null references public.profiles(id) on delete cascade,
 request_key uuid not null,
 request_digest text not null,
 post_id uuid references public.posts(id) on delete set null,
 primary key(player_id,request_key)
);
revoke all on pico_private.game_publications from public,anon,authenticated;

create function public.share_played_game(p_id uuid,p_version integer,p_key uuid,p_body text default '',
 p_image_path text default null,p_audience text default 'beta',p_wall_arena uuid default null,p_groups uuid[] default '{}')
returns uuid language plpgsql security definer set search_path='' as $$
declare game public.played_games; previous pico_private.game_publications; result uuid; fingerprint text; groups uuid[]; publication_body text;
begin
 if not pico_private.active_account() then raise insufficient_privilege;end if;
 if p_id is null or p_version is null or p_key is null or p_groups is null or cardinality(p_groups)>5 or char_length(coalesce(p_body,''))>500 then raise check_violation;end if;
 perform 1 from public.profiles where id=auth.uid() for update;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text||p_key::text,0));
 select coalesce(array_agg(distinct x order by x),'{}'::uuid[]) into groups from unnest(p_groups)x;
 fingerprint:=encode(sha256(convert_to(jsonb_build_array(p_id,p_version,btrim(coalesce(p_body,'')),p_image_path,p_audience,p_wall_arena,groups)::text,'UTF8')),'hex');
 select * into previous from pico_private.game_publications where player_id=auth.uid() and request_key=p_key;
 if found then
  if previous.request_digest<>fingerprint or previous.post_id is null then raise sqlstate 'P0409';end if;
  if not pico_private.can_read_post(previous.post_id) then raise insufficient_privilege;end if;
  return previous.post_id;
 end if;
 if exists(select 1 from public.posts where author_id=auth.uid() and idempotency_key=p_key) then raise sqlstate 'P0409';end if;
 select * into game from public.played_games where id=p_id and player_id=auth.uid() for update;
 if not found then raise insufficient_privilege;end if;
 if game.version<>p_version then raise sqlstate 'P0409';end if;
 -- Reuse every existing check for admission, ownership, media and destinations.
 publication_body:=nullif(btrim(coalesce(p_body,'')),'');
 if publication_body is null then select 'Joguei em '||a.name||' em '||to_char(game.played_on,'DD/MM/YYYY')||'.' into publication_body from public.arenas a where a.id=game.arena_id;end if;
 result:=public.publish_post(p_key,publication_body,p_image_path,game.arena_id,game.sport_id,p_audience,p_wall_arena,groups);
 insert into public.post_game_context(post_id,played_on) values(result,game.played_on);
 insert into pico_private.game_publications(player_id,request_key,request_digest,post_id) values(auth.uid(),p_key,fingerprint,result);
 return result;
end;
$$;

-- The retired feature remains readable only by its original author, without
-- state, expiration, exact time, public summaries or conversion into played games.
create function public.read_retired_checkins(p_offset integer default 0) returns jsonb
language plpgsql stable security definer set search_path='' as $$
begin
 if not pico_private.active_account() then raise insufficient_privilege;end if;
 if p_offset is null or p_offset<0 or p_offset>10000 then raise check_violation;end if;
 return coalesce((select jsonb_agg(row_to_json(q)) from (
  select c.id,a.name arena_name,a.slug arena_slug,s.name sport_name,
   (c.started_at at time zone 'America/Sao_Paulo')::date recorded_on
  from public.checkins c join public.arenas a on a.id=c.arena_id join public.sports s on s.id=c.sport_id
  where c.player_id=auth.uid() order by c.started_at desc,c.id desc limit 21 offset p_offset
 )q),'[]'::jsonb);
end;
$$;
revoke all on function public.share_played_game(uuid,integer,uuid,text,text,text,uuid,uuid[]),public.read_retired_checkins(integer) from public,anon,authenticated;
grant execute on function public.share_played_game(uuid,integer,uuid,text,text,text,uuid,uuid[]),public.read_retired_checkins(integer) to authenticated;

-- Security invoker keeps metadata and context links subject to existing RLS.
create or replace function public.read_social_feed(p_offset integer default 0,p_arena uuid default null,p_community uuid default null,p_author uuid default null,p_post uuid default null) returns jsonb language plpgsql stable security invoker set search_path='' as $$
begin
 if not pico_private.active_account() then raise insufficient_privilege;end if;
 if p_offset is null or p_offset<0 or p_offset>10000 then raise check_violation;end if;
 return coalesce((select jsonb_agg(row_to_json(q)) from(select p.id,p.body,p.created_at,g.played_on game_played_on,p.author_id,p.image_path,p.audience,u.username,u.display_name,u.avatar_path,
 a.id arena_id,a.name arena_name,a.slug arena_slug,a.is_demo arena_is_demo,s.id sport_id,s.name sport_name,s.slug sport_slug,
 (select count(*) from public.post_likes l where l.post_id=p.id)::int like_count,(select count(*) from public.comments c where c.post_id=p.id)::int comment_count,
 exists(select 1 from public.post_likes l where l.post_id=p.id and l.player_id=auth.uid()) liked,
 coalesce((select jsonb_agg(jsonb_build_object('arena_id',d.arena_id,'community_id',d.community_id,'arena_name',da.name,'arena_slug',da.slug,'community_name',dc.name,'community_slug',dc.slug)) from public.post_destinations d left join public.arenas da on da.id=d.arena_id left join public.communities dc on dc.id=d.community_id where d.post_id=p.id),'[]'::jsonb) destinations
 from public.posts p left join public.post_game_context g on g.post_id=p.id join public.profiles u on u.id=p.author_id left join public.arenas a on a.id=p.arena_id left join public.sports s on s.id=p.sport_id
 where (p_arena is null or exists(select 1 from public.post_destinations d where d.post_id=p.id and d.arena_id=p_arena))
 and (p_community is null or exists(select 1 from public.post_destinations d where d.post_id=p.id and d.community_id=p_community)) and (p_author is null or p.author_id=p_author) and (p_post is null or p.id=p_post)
 order by p.created_at desc,p.id desc limit 21 offset p_offset)q),'[]'::jsonb);
end;
$$;

commit;
