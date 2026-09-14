begin;
-- Search the authorized directory before pagination. This adds no visibility grants.
create function public.search_arenas(p_search text default '', p_offset integer default 0, p_sport_id uuid default null)
returns setof public.arenas language plpgsql stable security invoker set search_path='' as $$
declare needle text := pico_private.search_text(btrim(p_search));
begin
 if not pico_private.active_account() then raise insufficient_privilege; end if;
 if p_offset is null or p_offset<0 or p_offset>10000 or p_search is null or char_length(p_search)>100 then raise check_violation; end if;
 return query select a.* from public.arenas a
 where a.is_public and a.status='active'
 and (needle='' or strpos(pico_private.search_text(a.name || ' ' || a.neighborhood || ' ' || a.city || ' ' || a.public_info),needle)>0)
 and (p_sport_id is null or exists(select 1 from public.arena_sports s where s.arena_id=a.id and s.sport_id=p_sport_id and s.enabled))
 order by a.name,a.id limit 25 offset p_offset;
end;
$$;
revoke all on function public.search_arenas(text,integer,uuid) from public,anon,authenticated;
grant execute on function public.search_arenas(text,integer,uuid) to authenticated;
commit;
