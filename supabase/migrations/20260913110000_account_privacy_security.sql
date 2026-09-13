-- Account rights remain available without social admission. Only the verified
-- Next server can call these routines; browser roles cannot select a subject.
create function public.export_account_data(p_user uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare result jsonb; total integer; cutoff timestamptz;
begin
 if p_user is null or not exists(select 1 from auth.users where id=p_user) then raise insufficient_privilege; end if;
 cutoff := to_timestamp(floor(extract(epoch from clock_timestamp())/3600)*3600);
 insert into pico_private.write_limits as l(player_id,action,window_start,used)
 values(p_user,'account_export',cutoff,1)
 on conflict(player_id,action) do update set window_start=excluded.window_start,
 used=case when l.window_start=excluded.window_start then l.used+1 else 1 end returning used into total;
 if total>3 then raise sqlstate 'P0429' using message='Try again later'; end if;
 select jsonb_build_object(
'profile',(select coalesce(jsonb_agg(q),'[]'::jsonb) from (select id,username,display_name,bio,city,neighborhood,avatar_path,available,onboarding_completed,created_at from public.profiles where id=p_user order by id limit 5001) q),
'sports',(select coalesce(jsonb_agg(q),'[]'::jsonb) from (select sport_id,level,is_primary from public.player_sports where player_id=p_user order by sport_id limit 5001) q),
'arenas',(select coalesce(jsonb_agg(q),'[]'::jsonb) from (select arena_id,status,created_at from public.arena_members where player_id=p_user order by arena_id limit 5001) q),
'arena_roles',(select coalesce(jsonb_agg(q),'[]'::jsonb) from (select arena_id,role from public.arena_staff where player_id=p_user order by arena_id limit 5001) q),
'communities',(select coalesce(jsonb_agg(q),'[]'::jsonb) from (select community_id,role,status,created_at from public.community_members where player_id=p_user order by community_id limit 5001) q),
'posts',(select coalesce(jsonb_agg(q),'[]'::jsonb) from (select id,arena_id,sport_id,body,image_path,created_at,audience,private_community_id,moderated_at from public.posts where author_id=p_user order by id limit 5001) q),
'comments',(select coalesce(jsonb_agg(q),'[]'::jsonb) from (select id,post_id,body,created_at,moderated_at from public.comments where author_id=p_user order by id limit 5001) q),
'likes',(select coalesce(jsonb_agg(q),'[]'::jsonb) from (select post_id,created_at from public.post_likes where player_id=p_user order by post_id limit 5001) q),
'reposts',(select coalesce(jsonb_agg(q),'[]'::jsonb) from (select post_id,created_at from public.post_reposts where player_id=p_user order by post_id limit 5001) q),
'following',(select coalesce(jsonb_agg(q),'[]'::jsonb) from (select followed_id,created_at from public.connections where follower_id=p_user order by followed_id limit 5001) q),
'blocks',(select coalesce(jsonb_agg(q),'[]'::jsonb) from (select blocked_id,created_at from public.blocks where blocker_id=p_user order by blocked_id limit 5001) q),
'reports',(select coalesce(jsonb_agg(q),'[]'::jsonb) from (select id,player_id,post_id,comment_id,reason,details,status,created_at,reviewed_at from public.reports where reporter_id=p_user order by id limit 5001) q),
'games',(select coalesce(jsonb_agg(q),'[]'::jsonb) from (select id,arena_id,sport_id,played_on,created_at,updated_at,version from public.played_games where player_id=p_user order by id limit 5001) q),
'legacy_records',(select coalesce(jsonb_agg(q),'[]'::jsonb) from (select id,arena_id,sport_id,started_at,expires_at,ended_at from public.checkins where player_id=p_user order by id limit 5001) q),
'photos',(select coalesce(jsonb_agg(q),'[]'::jsonb) from (select path,bucket,ready,created_at from public.media_assets where player_id=p_user order by path limit 5001) q),
'resource_photos_uploaded',(select coalesce(jsonb_agg(q),'[]'::jsonb) from (select path,arena_id,community_id,slot,ready,created_at from public.entity_media_assets where uploaded_by=p_user order by path limit 5001) q),
'arena_requests',(select coalesce(jsonb_agg(q),'[]'::jsonb) from (select id,arena_id,kind,name,city,neighborhood,details,status,created_at,reviewed_at from public.arena_requests where requester_id=p_user order by id limit 5001) q),
'post_destinations',(select coalesce(jsonb_agg(q),'[]'::jsonb) from (select d.post_id,d.arena_id,d.community_id,d.created_at from public.post_destinations d join public.posts p on p.id=d.post_id where p.author_id=p_user order by d.id limit 5001) q),
'post_game_dates',(select coalesce(jsonb_agg(q),'[]'::jsonb) from (select g.post_id,g.played_on from public.post_game_context g join public.posts p on p.id=g.post_id where p.author_id=p_user order by g.post_id limit 5001) q),
'welcome',(select coalesce(jsonb_agg(q),'[]'::jsonb) from (select community_id,joined_at,acknowledged_at from pico_private.pico_welcomes where player_id=p_user) q)) into result;
 -- Refuse an oversized archive, never label silently truncated data complete.
 if exists(select 1 from jsonb_each(result) where jsonb_array_length(value)>5000)
   or octet_length(result::text)>8388608 then raise sqlstate 'P0413' using message='Account export too large'; end if;
 return result;
end; $$;
revoke all on function public.export_account_data(uuid) from public,anon,authenticated;
grant execute on function public.export_account_data(uuid) to service_role;

create function public.erase_account_private_data(p_user uuid) returns void
language plpgsql security definer set search_path='' as $$
begin
 if not exists(select 1 from public.account_deletions where player_id=p_user) then raise insufficient_privilege; end if;
 delete from pico_private.invitations where lower(email)=(select lower(email) from auth.users where id=p_user);
 update pico_private.audit_events set target_id=null where target_id=p_user;
end; $$;
revoke all on function public.erase_account_private_data(uuid) from public,anon,authenticated;
grant execute on function public.erase_account_private_data(uuid) to service_role;

-- Match the existing operator lock so two deletion requests cannot remove the
-- last active operator. Reject before marking or removing any personal files.
create function pico_private.guard_admin_account_deletion() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 perform pg_advisory_xact_lock(918273645);
 if exists(select 1 from public.account_deletions where player_id=new.player_id) then return new; end if;
 if exists(select 1 from pico_private.platform_grants where player_id=new.player_id and role='admin')
 and not exists(select 1 from pico_private.platform_grants g
   join pico_private.beta_admissions a on a.player_id=g.player_id
   join auth.users u on u.id=g.player_id
   where g.role='admin' and a.status='approved' and u.email_confirmed_at is not null
   and g.player_id<>new.player_id and not exists(select 1 from public.account_deletions d where d.player_id=g.player_id))
 then raise sqlstate 'P0409' using message='Transfer platform administration before deletion'; end if;
 return new;
end; $$;
revoke all on function pico_private.guard_admin_account_deletion() from public,anon,authenticated;
create trigger preserve_admin_before_account_deletion before insert on public.account_deletions
for each row execute function pico_private.guard_admin_account_deletion();
