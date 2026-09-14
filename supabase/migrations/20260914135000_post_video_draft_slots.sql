begin;

-- A bounded draft quota must not count videos already published. Those assets
-- cannot be removed independently and must never exhaust publishing forever.
create or replace function public.reserve_post_video() returns text
language plpgsql security definer set search_path='' as $$
declare result text;
begin
 if not pico_private.active_account() then raise insufficient_privilege; end if;
 perform pico_private.consume_write('media',20,3600);
 if (select count(*) from public.post_video_assets a
     where a.player_id=auth.uid()
       and not exists(select 1 from public.posts p where p.video_path=a.path))>=8 then
  raise sqlstate 'P0429' using message='Remove an unused video before uploading another';
 end if;
 result:=auth.uid()::text||'/'||gen_random_uuid()::text||'.mp4';
 insert into public.post_video_assets(path,player_id) values(result,auth.uid());
 return result;
end;$$;

-- The account page must list every removable draft even after the owner has
-- published many videos; the reservation limit bounds this result to eight.
create function public.read_unused_post_videos() returns jsonb
language sql stable security definer set search_path='' as $$
 select coalesce(jsonb_agg(jsonb_build_object('path',a.path,'ready',a.ready) order by a.created_at desc),'[]'::jsonb)
 from public.post_video_assets a
 where a.player_id=auth.uid() and pico_private.active_account()
   and not exists(select 1 from public.posts p where p.video_path=a.path);
$$;
revoke all on function public.read_unused_post_videos() from public,anon,authenticated;
grant execute on function public.read_unused_post_videos() to authenticated;

commit;
