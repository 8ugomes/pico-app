begin;

-- Keep the account archive complete as new private product data is introduced.
-- This service-only supplement contains references and inbox rows, never media
-- bytes or credentials. The caller still verifies the subject server-side.
create or replace function public.export_account_media_extra(p_user uuid) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare result jsonb;
begin
 if p_user is null or not exists(select 1 from auth.users where id=p_user) then raise insufficient_privilege; end if;
 select jsonb_build_object(
  'videos',coalesce((select jsonb_agg(row_to_json(q)) from
   (select v.path,v.byte_size,v.ready,v.created_at,p.id post_id from public.post_video_assets v
    left join public.posts p on p.video_path=v.path where v.player_id=p_user order by v.path limit 5001)q),'[]'::jsonb),
  'played_arena_marks',coalesce((select jsonb_agg(row_to_json(q)) from
   (select arena_id,created_at from public.arena_played_marks where player_id=p_user order by arena_id limit 5001)q),'[]'::jsonb),
  'notifications_received',coalesce((select jsonb_agg(row_to_json(q)) from
   (select id,actor_id,community_id,post_id,kind,created_at,read_at from public.notifications
    where recipient_id=p_user order by id limit 5001)q),'[]'::jsonb)
 ) into result;
 if exists(select 1 from jsonb_each(result) where jsonb_array_length(value)>5000)
   or octet_length(result::text)>8388608 then raise sqlstate 'P0413' using message='Account export too large'; end if;
 return result;
end;$$;

revoke all on function public.export_account_media_extra(uuid) from public,anon,authenticated;
grant execute on function public.export_account_media_extra(uuid) to service_role;

commit;
