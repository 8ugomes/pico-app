begin;
-- INSERT ... RETURNING evaluates SELECT policies before the new row is visible
-- to a stable same-table lookup. Authorize the supplied row values instead.
create function pico_private.post_audience_visible(p_author uuid,p_arena uuid,p_audience text,p_group uuid,p_moderated timestamptz) returns boolean language sql stable security definer set search_path='' as $$
 select pico_private.active_account() and p_moderated is null and pico_private.can_see_player(p_author)
 and exists(select 1 from pico_private.beta_admissions where player_id=p_author and status='approved')
 and (p_arena is null or exists(select 1 from public.arenas where id=p_arena and is_public and (status<>'archived' or pico_private.arena_rank(id)>=20)))
 and (p_audience='beta' or (p_audience='private' and pico_private.community_rank(p_group)>=10 and pico_private.can_read_community(p_group)));
$$;
revoke all on function pico_private.post_audience_visible(uuid,uuid,text,uuid,timestamptz) from public,anon,authenticated;
grant execute on function pico_private.post_audience_visible(uuid,uuid,text,uuid,timestamptz) to authenticated;
create or replace function pico_private.can_read_post(p_id uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.posts p where p.id=p_id and pico_private.post_audience_visible(p.author_id,p.arena_id,p.audience,p.private_community_id,p.moderated_at));
$$;
drop policy posts_read on public.posts;
create policy posts_read on public.posts for select to authenticated using(pico_private.post_audience_visible(author_id,arena_id,audience,private_community_id,moderated_at));
commit;
