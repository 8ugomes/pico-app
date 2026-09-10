begin;
alter table public.profiles add column share_activity_summary boolean not null default false;
grant update(share_activity_summary) on public.profiles to authenticated;
create or replace function pico_private.can_see_player(target uuid) returns boolean language sql stable security definer set search_path='' as $$
 select target is null or (exists(select 1 from pico_private.beta_admissions where player_id=target and status='approved') and not exists(select 1 from public.account_deletions where player_id=target)
 and not exists(select 1 from public.blocks where (blocker_id=auth.uid() and blocked_id=target) or (blocked_id=auth.uid() and blocker_id=target)));
$$;
create function public.read_checkin_history(p_offset integer default 0) returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
 if not pico_private.active_account() then raise insufficient_privilege;end if;
 if p_offset is null or p_offset<0 or p_offset>10000 then raise check_violation;end if;
 return coalesce((select jsonb_agg(row_to_json(q)) from(select c.id,a.id arena_id,a.slug arena_slug,a.name arena_name,a.is_demo,s.name sport_name,c.started_at,c.expires_at,c.ended_at,
 case when c.ended_at is not null and c.ended_at<c.expires_at then 'ended' when c.expires_at<=now() then 'expired' else 'active' end state
 from public.checkins c join public.arenas a on a.id=c.arena_id join public.sports s on s.id=c.sport_id where c.player_id=auth.uid() order by c.started_at desc,c.id desc limit 21 offset p_offset)q),'[]'::jsonb);
end;
$$;
create function public.profile_places(p_player uuid default null) returns jsonb language plpgsql stable security invoker set search_path='' as $$
declare target uuid:=coalesce(p_player,auth.uid());sharing boolean;
begin
 if not pico_private.active_account() then raise insufficient_privilege;end if;
 select share_activity_summary into sharing from public.profiles where id=target;
 if sharing is null then return null;end if;
 return jsonb_build_object('own',target=auth.uid(),'share_activity_summary',sharing,
 'arenas',coalesce((select jsonb_agg(jsonb_build_object('id',a.id,'name',a.name,'slug',a.slug)) from public.arena_members m join public.arenas a on a.id=m.arena_id where m.player_id=target and m.status='active'),'[]'::jsonb),
 'communities',coalesce((select jsonb_agg(jsonb_build_object('id',c.id,'name',c.name,'slug',c.slug)) from public.community_members m join public.communities c on c.id=m.community_id where m.player_id=target and m.status='active'),'[]'::jsonb));
end;
$$;
create function public.activity_summary(p_player uuid) returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
 if not pico_private.active_account() or not pico_private.can_see_player(p_player) then return null;end if;
 if p_player<>auth.uid() and not exists(select 1 from public.profiles where id=p_player and share_activity_summary) then return null;end if;
 return jsonb_build_object('total',(select count(*) from public.checkins where player_id=p_player),
 'arenas',coalesce((select jsonb_agg(row_to_json(q)) from(select distinct a.id,a.name,a.slug from public.checkins c join public.arenas a on a.id=c.arena_id where c.player_id=p_player and a.is_public and a.status<>'archived' order by a.name limit 5)q),'[]'::jsonb));
end;
$$;
create function public.discover_common_players(p_offset integer default 0) returns jsonb language plpgsql stable security invoker set search_path='' as $$
begin
 if not pico_private.active_account() then raise insufficient_privilege;end if;
 if p_offset is null or p_offset<0 or p_offset>10000 then raise check_violation;end if;
 return coalesce((select jsonb_agg(row_to_json(q)) from(select p.id,p.username,p.display_name,
 exists(select 1 from public.arena_members mine join public.arena_members theirs on mine.arena_id=theirs.arena_id where mine.player_id=auth.uid() and theirs.player_id=p.id and mine.status='active' and theirs.status='active') arena_in_common,
 exists(select 1 from public.community_members mine join public.community_members theirs on mine.community_id=theirs.community_id join public.communities c on c.id=mine.community_id where mine.player_id=auth.uid() and theirs.player_id=p.id and mine.status='active' and theirs.status='active') community_in_common,
 exists(select 1 from public.player_sports mine join public.player_sports theirs on mine.sport_id=theirs.sport_id where mine.player_id=auth.uid() and theirs.player_id=p.id) sport_in_common
 from public.profiles p where p.id<>auth.uid() and p.onboarding_completed order by p.display_name,p.id limit 25 offset p_offset)q where q.arena_in_common or q.community_in_common or q.sport_in_common),'[]'::jsonb);
end;
$$;
revoke all on function public.read_checkin_history(integer),public.profile_places(uuid),public.activity_summary(uuid),public.discover_common_players(integer) from public,anon,authenticated;
grant execute on function public.read_checkin_history(integer),public.profile_places(uuid),public.activity_summary(uuid),public.discover_common_players(integer) to authenticated;
comment on function public.read_checkin_history(integer) is 'Own history only, 21-row lookahead. No target user parameter. Cascades on account deletion; no location tracking.';
commit;
