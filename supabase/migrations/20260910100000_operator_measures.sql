begin;
alter table public.comments add column moderated_at timestamptz;
create policy comments_not_moderated on public.comments as restrictive for select to authenticated using(moderated_at is null);
create function public.moderate_report(p_report uuid,p_action text) returns void language plpgsql security definer set search_path='' as $$
declare r public.reports;target uuid;operator_role text:=pico_private.platform_role();
begin
 perform pico_private.consume_write('moderation',60,3600);
 if operator_role is null or p_action is null or p_action not in ('dismiss','hide','suspend') then raise insufficient_privilege;end if;
 select * into r from public.reports where id=p_report for update;if r.id is null then raise check_violation;end if;
 if r.status<>'pending' then raise sqlstate 'P0409';end if;
 if p_action='hide' then
  if r.post_id is not null then update public.posts set moderated_at=now() where id=r.post_id;
  elsif r.comment_id is not null then update public.comments set moderated_at=now() where id=r.comment_id;
  else raise check_violation;end if;
 elsif p_action='suspend' then
  target:=coalesce(r.player_id,(select author_id from public.posts where id=r.post_id),(select author_id from public.comments where id=r.comment_id));
  if target is null or target=auth.uid() or (operator_role='moderator' and exists(select 1 from pico_private.platform_grants where player_id=target)) then raise insufficient_privilege;end if;
  update pico_private.beta_admissions set status='suspended',updated_at=now() where player_id=target;
 end if;
 update public.reports set status=case when p_action='dismiss' then 'dismissed' else 'action_taken' end,reviewed_at=now() where id=p_report;
 insert into pico_private.audit_events(actor_id,action,scope_id,target_id) values(auth.uid(),'report.'||p_action,p_report,target);
end;$$;
create function public.report_media(p_report uuid) returns text language plpgsql security definer set search_path='' as $$
declare result text;
begin
 if pico_private.platform_role() is null then raise insufficient_privilege;end if;
 select p.image_path into result from public.reports r join public.posts p on p.id=r.post_id join public.media_assets m on m.path=p.image_path where r.id=p_report and m.ready and not m.deleting;
 if result is not null then insert into pico_private.audit_events(actor_id,action,scope_id) values(auth.uid(),'report.inspect_media',p_report);end if;return result;
end;$$;
create function public.operator_catalog() returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
 if pico_private.platform_role() is distinct from 'admin' then raise insufficient_privilege;end if;
 return jsonb_build_object('arenas',coalesce((select jsonb_agg(row_to_json(q)) from(select id,name,slug,status,owner_id from public.arenas order by name limit 100)q),'[]'::jsonb),'communities',coalesce((select jsonb_agg(row_to_json(q)) from(select id,name,slug,status,owner_id,visibility from public.communities order by name limit 100)q),'[]'::jsonb));
end;$$;
create function public.operator_resource_action(p_kind text,p_id uuid,p_action text,p_target uuid default null) returns void language plpgsql security definer set search_path='' as $$
declare current_owner uuid;current_status text;
begin
 perform pico_private.consume_write('catalog',30,3600);
 if pico_private.platform_role() is distinct from 'admin' then raise insufficient_privilege;end if;
 if p_kind='arena' then select owner_id,status into current_owner,current_status from public.arenas where id=p_id for update;
 elsif p_kind='community' then select owner_id,status into current_owner,current_status from public.communities where id=p_id for update;
 else raise check_violation;end if;
 if current_status is null then raise check_violation;end if;
 if p_action='custody' then
  if current_owner is not null or current_status<>'custody' or not exists(select 1 from pico_private.beta_admissions where player_id=p_target and status='approved') then raise insufficient_privilege;end if;
  if p_kind='arena' then update public.arenas set owner_id=p_target,status='active',version=version+1 where id=p_id;insert into public.arena_members(arena_id,player_id,status) values(p_id,p_target,'active') on conflict(arena_id,player_id) do update set status='active';
  else update public.communities set owner_id=p_target,status='active',version=version+1 where id=p_id;insert into public.community_members(community_id,player_id,status) values(p_id,p_target,'active') on conflict(community_id,player_id) do update set status='active';end if;
 elsif p_action in ('archive','restore') then
  if p_kind='arena' then update public.arenas set status=case when p_action='archive' then 'archived' when owner_id is null then 'custody' else 'active' end,version=version+1 where id=p_id;
  else update public.communities set status=case when p_action='archive' then 'archived' when owner_id is null then 'custody' else 'active' end,version=version+1 where id=p_id;end if;
 else raise check_violation;end if;
 insert into pico_private.audit_events(actor_id,action,scope_id,target_id) values(auth.uid(),p_kind||'.'||p_action,p_id,p_target);
end;$$;
revoke all on function public.moderate_report(uuid,text),public.report_media(uuid),public.operator_catalog(),public.operator_resource_action(text,uuid,text,uuid) from public,anon,authenticated;
grant execute on function public.moderate_report(uuid,text),public.report_media(uuid),public.operator_catalog(),public.operator_resource_action(text,uuid,text,uuid) to authenticated;
create or replace function public.discover_common_players(p_offset integer default 0) returns jsonb language plpgsql stable security invoker set search_path='' as $$
begin
 if not pico_private.active_account() then raise insufficient_privilege;end if;
 if p_offset is null or p_offset<0 or p_offset>10000 then raise check_violation;end if;
 return coalesce((select jsonb_agg(row_to_json(q)) from(select * from(select p.id,p.username,p.display_name,
 exists(select 1 from public.arena_members mine join public.arena_members theirs on mine.arena_id=theirs.arena_id where mine.player_id=auth.uid() and theirs.player_id=p.id and mine.status='active' and theirs.status='active') arena_in_common,
 exists(select 1 from public.community_members mine join public.community_members theirs on mine.community_id=theirs.community_id join public.communities c on c.id=mine.community_id where mine.player_id=auth.uid() and theirs.player_id=p.id and mine.status='active' and theirs.status='active') community_in_common,
 exists(select 1 from public.player_sports mine join public.player_sports theirs on mine.sport_id=theirs.sport_id where mine.player_id=auth.uid() and theirs.player_id=p.id) sport_in_common
 from public.profiles p where p.id<>auth.uid() and p.onboarding_completed )q where q.arena_in_common or q.community_in_common or q.sport_in_common order by q.display_name,q.id limit 21 offset p_offset)q),'[]'::jsonb);
end;
$$;

commit;
