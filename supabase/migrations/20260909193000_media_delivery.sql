begin;
-- Hosted verification observed a previously authorized Storage download still
-- succeeding immediately after blocking. Never expose a reusable Storage read
-- authorization: the app checks current SQL visibility before serving bytes.
drop policy pico_media_read on storage.objects;
create function public.can_read_media(p_bucket text,p_path text) returns boolean
language sql stable security invoker set search_path='' as $$
  select auth.uid() is not null and (
    exists(select 1 from public.media_assets m where m.path=p_path and m.bucket=p_bucket and m.ready)
    or (p_bucket='avatars' and exists(select 1 from public.profiles p where p.avatar_path=p_path))
    or (p_bucket='post-media' and exists(select 1 from public.posts p where p.image_path=p_path))
  );
$$;
revoke all on function public.can_read_media(text,text) from public,anon,authenticated;
grant execute on function public.can_read_media(text,text) to authenticated;
commit;
