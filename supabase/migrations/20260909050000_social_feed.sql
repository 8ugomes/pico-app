begin;
create function public.read_feed(p_offset integer default 0, p_arena_id uuid default null)
returns table(id uuid, body text, created_at timestamptz, author_id uuid, username text, display_name text,
  arena_id uuid, arena_name text, arena_slug text, arena_is_demo boolean, sport_id uuid, sport_name text, sport_slug public.sport_slug,
  like_count integer, comment_count integer, liked boolean)
language plpgsql stable security invoker set search_path = '' as $$
begin
  if auth.uid() is null then raise insufficient_privilege using message = 'Authentication required'; end if;
  if p_offset is null or p_offset < 0 or p_offset > 10000 then raise check_violation using message = 'Invalid page'; end if;
  return query select p.id, p.body, p.created_at, p.author_id, u.username, u.display_name,
    a.id, a.name, a.slug, a.is_demo, s.id, s.name, s.slug,
    (select count(*)::integer from public.post_likes l where l.post_id = p.id),
    (select count(*)::integer from public.comments c where c.post_id = p.id),
    exists(select 1 from public.post_likes l where l.post_id = p.id and l.player_id = auth.uid())
    from public.posts p join public.profiles u on u.id = p.author_id
    join public.arenas a on a.id = p.arena_id join public.sports s on s.id = p.sport_id
    where p_arena_id is null or p.arena_id = p_arena_id
    order by p.created_at desc, p.id desc limit 21 offset p_offset;
end;
$$;
revoke all on function public.read_feed(integer,uuid) from public, anon, authenticated;
grant execute on function public.read_feed(integer,uuid) to authenticated;
commit;
