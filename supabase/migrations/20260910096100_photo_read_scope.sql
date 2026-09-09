begin;
alter policy entity_media_read on public.entity_media_assets using(public.can_read_entity_media(path) or (pico_private.active_account() and ((arena_id is not null and pico_private.arena_rank(arena_id)>=30) or (community_id is not null and pico_private.community_rank(community_id)>=30))));
create or replace function public.can_read_media(p_bucket text,p_path text) returns boolean language sql stable security definer set search_path='' as $$
 select pico_private.active_account() and exists(select 1 from public.media_assets m where m.bucket=p_bucket and m.path=p_path and m.ready and not m.deleting) and (
 (p_bucket='post-media' and (exists(select 1 from public.posts p where p.image_path=p_path and pico_private.can_read_post(p.id)) or (exists(select 1 from public.media_assets m where m.path=p_path and m.player_id=auth.uid()) and not exists(select 1 from public.posts p where p.image_path=p_path))))
 or (p_bucket='avatars' and (exists(select 1 from public.profiles p where p.avatar_path=p_path and pico_private.can_see_player(p.id) and exists(select 1 from pico_private.beta_admissions a where a.player_id=p.id and a.status='approved')) or (exists(select 1 from public.media_assets m where m.path=p_path and m.player_id=auth.uid()) and not exists(select 1 from public.profiles p where p.avatar_path=p_path)))));
$$;

commit;
