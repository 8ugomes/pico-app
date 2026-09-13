begin;
-- Literal, case/accent-insensitive matching for Portuguese names. No wildcard SQL.
create function pico_private.search_text(value text) returns text
language sql immutable strict parallel safe set search_path='' as $$
 select translate(lower(normalize(value, NFC)),'áàâãäåéèêëíìîïóòôõöúùûüçñýÿ','aaaaaaeeeeiiiiooooouuuucnyy');
$$;
revoke all on function pico_private.search_text(text) from public,anon,authenticated;
grant execute on function pico_private.search_text(text) to authenticated;
-- Additional RPC preserves the old discovery signature for rolling deployment.
create function public.search_players(p_search text default '', p_offset integer default 0, p_sport_id uuid default null,
 p_arena_id uuid default null, p_level public.player_level default null)
returns table(id uuid, username text, display_name text, bio text, city text, neighborhood text, available boolean,
 is_demo boolean, sport_name text, sport_slug public.sport_slug, level public.player_level,
 connected boolean, arena_name text, arena_slug text, expires_at timestamptz)
language plpgsql stable security invoker set search_path='' as $$
declare needle text:=pico_private.search_text(btrim(p_search)); handle_only boolean:=left(btrim(p_search),1)='@';
begin
 if not pico_private.active_account() then raise insufficient_privilege; end if;
 if p_offset is null or p_offset<0 or p_offset>10000 or p_search is null or char_length(p_search)>100 then raise check_violation; end if;
 if handle_only then needle:=substring(needle from 2); end if;
 return query select p.id,p.username,p.display_name,p.bio,p.city,p.neighborhood,false,p.is_demo,
 game.name,game.slug,game.level,
 exists(select 1 from public.connections c where c.follower_id=auth.uid() and c.followed_id=p.id),
 null::text,null::text,null::timestamptz
 from public.profiles p
 join lateral(select s.name,s.slug,ps.level from public.player_sports ps join public.sports s on s.id=ps.sport_id
 where ps.player_id=p.id and (p_sport_id is null or ps.sport_id=p_sport_id) and (p_level is null or ps.level=p_level)
 order by ps.is_primary desc,s.name limit 1) game on true
 where p.id<>auth.uid() and p.onboarding_completed
 and (case when handle_only then needle<>'' and strpos(pico_private.search_text(p.username),needle)>0
 else needle='' or strpos(pico_private.search_text(p.display_name),needle)>0 or strpos(pico_private.search_text(p.username),needle)>0 end)
 and (p_arena_id is null or exists(
 select 1 from public.arena_members m join public.arenas a on a.id=m.arena_id
 where m.player_id=p.id and m.arena_id=p_arena_id and m.status='active'))
 order by (pico_private.search_text(p.username)=needle) desc,p.display_name,p.id limit 25 offset p_offset;
end;
$$;

revoke all on function public.search_players(text,integer,uuid,uuid,public.player_level) from public,anon,authenticated;
grant execute on function public.search_players(text,integer,uuid,uuid,public.player_level) to authenticated;
-- Preserve directory visibility, private descriptions, ordering and page size.
create or replace function public.community_directory(p_search text default '',p_mine boolean default false,p_offset integer default 0,p_arena uuid default null) returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
 if not pico_private.active_account() then raise insufficient_privilege; end if;
 if p_offset is null or p_offset<0 or p_offset>10000 or p_search is null or char_length(p_search)>100 then raise check_violation; end if;
 return coalesce((select jsonb_agg(row_to_json(q)) from(select c.id,c.slug,c.name,c.visibility,c.entry_mode,exists(select 1 from pico_private.pico_community where community_id=c.id) pico_official,
  (select status from public.community_members where community_id=c.id and player_id=auth.uid()) membership,
  (select a.name from public.community_arena_links l join public.arenas a on a.id=l.arena_id where l.community_id=c.id and l.status='approved') arena_name,
  (select l.is_official from public.community_arena_links l where l.community_id=c.id and l.status='approved') is_official,
  case when pico_private.can_read_community(c.id) then c.description else null end description
  from public.communities c where c.status='active' and (not p_mine or pico_private.community_rank(c.id)>=10)
  and (p_arena is null or exists(select 1 from public.community_arena_links l where l.community_id=c.id and l.arena_id=p_arena and l.status='approved'))
  and strpos(pico_private.search_text(c.name),pico_private.search_text(btrim(p_search)))>0 order by pico_official desc,c.name,c.id limit 21 offset p_offset)q),'[]'::jsonb);
end;
$$;

commit;
