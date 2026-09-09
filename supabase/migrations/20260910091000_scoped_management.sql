begin;
alter table public.arenas add column owner_id uuid references public.profiles(id) on delete set null,
 add column status text not null default 'active' check(status in ('active','custody','archived')),
 add column version integer not null default 1,
 add column public_info text not null default '' check(char_length(public_info)<=500),
 add column avatar_path text, add column cover_path text;
alter table public.arena_members add column status text not null default 'active' check(status in ('active','suspended'));
create table public.arena_staff (
 arena_id uuid not null references public.arenas(id) on delete cascade,
 player_id uuid not null references public.profiles(id) on delete cascade,
 role text not null check(role in ('admin','moderator')),
 primary key(arena_id,player_id)
);
alter table public.arena_staff enable row level security;
revoke all on public.arena_staff from public,anon,authenticated;
grant select on public.arena_staff to authenticated;
create policy staff_visible on public.arena_staff for select to authenticated using(pico_private.active_account() and pico_private.can_see_player(player_id) and exists(select 1 from public.arenas where id=arena_id));
create function pico_private.arena_rank(p_arena uuid) returns integer language sql stable security definer set search_path='' as $$
 select case when not pico_private.active_account() then 0
 when pico_private.platform_role()='admin' then 50
 when exists(select 1 from public.arenas where id=p_arena and owner_id=auth.uid()) then 40
 else coalesce((select case role when 'admin' then 30 else 20 end from public.arena_staff where arena_id=p_arena and player_id=auth.uid()),0) end;
$$;
revoke all on function pico_private.arena_rank(uuid) from public,anon,authenticated;
grant execute on function pico_private.arena_rank(uuid) to authenticated;
create policy arenas_managed_read on public.arenas for select to authenticated using(pico_private.arena_rank(id)>=20);
create policy arenas_active_visibility on public.arenas as restrictive for select to authenticated using(status<>'archived' or pico_private.arena_rank(id)>=20);
revoke insert,delete on public.arena_members from authenticated;
drop policy arena_members_insert_own on public.arena_members;
drop policy arena_members_delete_own on public.arena_members;
create policy members_active_visibility on public.arena_members as restrictive for select to authenticated using(status='active' or player_id=auth.uid() or pico_private.arena_rank(arena_id)>=20);
create function public.set_arena_membership(p_arena uuid,p_join boolean) returns void language plpgsql security definer set search_path='' as $$
begin
 perform pico_private.consume_write('membership',30,3600);
 perform 1 from public.arenas where id=p_arena and is_public and status='active' for update;
 if not found then raise insufficient_privilege; end if;
 if exists(select 1 from public.arena_members where arena_id=p_arena and player_id=auth.uid() and status='suspended') then raise insufficient_privilege; end if;
 if p_join then insert into public.arena_members(arena_id,player_id) values(p_arena,auth.uid()) on conflict do nothing;
 else delete from public.arena_members where arena_id=p_arena and player_id=auth.uid(); end if;
end;
$$;
create function public.management_context() returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object('platformRole',pico_private.platform_role(),'arenas',coalesce((select jsonb_agg(jsonb_build_object('id',id,'name',name,'slug',slug,'rank',pico_private.arena_rank(id))) from public.arenas where pico_private.arena_rank(id)>=20),'[]'::jsonb));
$$;
create function public.operator_read(p_context text,p_scope_id uuid default null) returns jsonb language plpgsql security definer set search_path='' as $$
declare result jsonb; rank integer;
begin
 if not pico_private.active_account() then raise insufficient_privilege; end if;
 if p_context='arena_team' then
  rank:=pico_private.arena_rank(p_scope_id); if rank<20 then raise insufficient_privilege; end if;
  select jsonb_build_object('arena',(select jsonb_build_object('id',id,'name',name,'ownerId',owner_id,'version',version) from public.arenas where id=p_scope_id),'staff',coalesce((select jsonb_agg(jsonb_build_object('id',s.player_id,'name',p.display_name,'role',s.role)) from public.arena_staff s join public.profiles p on p.id=s.player_id where s.arena_id=p_scope_id),'[]'::jsonb),'members',coalesce((select jsonb_agg(jsonb_build_object('id',m.player_id,'name',p.display_name,'status',m.status)) from public.arena_members m join public.profiles p on p.id=m.player_id where m.arena_id=p_scope_id),'[]'::jsonb)) into result;
 elsif p_context='users' then
  if pico_private.platform_role() is distinct from 'admin' then raise insufficient_privilege; end if;
  select coalesce(jsonb_agg(row_to_json(q)),'[]') into result from(select p.id,p.username,p.display_name,coalesce(a.status,'pending') status,g.role from public.profiles p left join pico_private.beta_admissions a on a.player_id=p.id left join pico_private.platform_grants g on g.player_id=p.id order by p.created_at desc limit 100)q;
 elsif p_context='beta_invites' then
  if pico_private.platform_role() is distinct from 'admin' then raise insufficient_privilege; end if;
  select coalesce(jsonb_agg(row_to_json(q)),'[]') into result from(select id,email,expires_at,revoked_at,accepted_at from pico_private.invitations where kind='beta' order by created_at desc limit 100)q;
 elsif p_context='reports' then
  if pico_private.platform_role() is null then raise insufficient_privilege; end if;
  select coalesce(jsonb_agg(row_to_json(q)),'[]') into result from(select id,reason,details,status,created_at,post_id,comment_id,player_id from public.reports order by created_at desc limit 100)q;
 elsif p_context='report_detail' then
  if pico_private.platform_role() is null then raise insufficient_privilege; end if;
  insert into pico_private.audit_events(actor_id,action,target_id) values(auth.uid(),'report.inspect',p_scope_id);
  select jsonb_build_object('id',r.id,'reason',r.reason,'details',r.details,'status',r.status,'post',p.body,'comment',c.body,'player',u.display_name) into result from public.reports r left join public.posts p on p.id=r.post_id left join public.comments c on c.id=r.comment_id left join public.profiles u on u.id=r.player_id where r.id=p_scope_id;
 elsif p_context='audit' then
  if pico_private.platform_role() is null then raise insufficient_privilege; end if;
  select coalesce(jsonb_agg(row_to_json(q)),'[]') into result from(select action,scope_id,target_id,created_at from pico_private.audit_events order by id desc limit 100)q;
 else raise check_violation; end if;
 return result;
end;
$$;
create function public.operator_action(p_action text,p_scope_id uuid default null,p_target_id uuid default null,p_value text default null) returns jsonb language plpgsql security definer set search_path='' as $$
declare rank integer; old_role text; target_rank integer; report public.reports; token text;
begin
 perform pico_private.consume_write('management',60,3600);
 if p_action in ('beta_status','platform_role','beta_invite','revoke_invite') then
  if pico_private.platform_role() is distinct from 'admin' then raise insufficient_privilege; end if;
  perform pg_advisory_xact_lock(918273645);
  if p_action='beta_status' then
   if p_value not in ('approved','revoked','suspended') or p_value is null then raise check_violation; end if;
   if exists(select 1 from pico_private.platform_grants where player_id=p_target_id and role='admin') and p_value<>'approved' and (select count(*) from pico_private.platform_grants where role='admin')<=1 then raise check_violation using message='Last administrator'; end if;
   if not exists(select 1 from auth.users where id=p_target_id and email_confirmed_at is not null) then raise insufficient_privilege; end if;
   insert into pico_private.beta_admissions(player_id,status) values(p_target_id,p_value) on conflict(player_id) do update set status=excluded.status,updated_at=now();
  elsif p_action='platform_role' then
   if p_value not in ('admin','moderator','member') or p_value is null or p_target_id=auth.uid() then raise insufficient_privilege; end if;
   if not exists(select 1 from pico_private.beta_admissions where player_id=p_target_id and status='approved') then raise insufficient_privilege; end if;
   select role into old_role from pico_private.platform_grants where player_id=p_target_id;
   if old_role='admin' and p_value<>'admin' and (select count(*) from pico_private.platform_grants where role='admin')<=1 then raise check_violation; end if;
   if p_value='member' then delete from pico_private.platform_grants where player_id=p_target_id;
   else insert into pico_private.platform_grants(player_id,role) values(p_target_id,p_value) on conflict(player_id) do update set role=excluded.role; end if;
  elsif p_action='beta_invite' then
   perform pico_private.consume_write('invites',20,86400);
   if p_value is null or p_value!~'^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' or char_length(p_value)>254 then raise check_violation; end if;
   token:=replace(gen_random_uuid()::text,'-','')||replace(gen_random_uuid()::text,'-','');
   insert into pico_private.invitations(kind,email,token_hash,created_by,expires_at) values('beta',lower(btrim(p_value)),encode(sha256(convert_to(token,'UTF8')),'hex'),auth.uid(),now()+interval '7 days') returning id into p_target_id;
  else update pico_private.invitations set revoked_at=now() where id=p_target_id and accepted_at is null; if not found then raise check_violation; end if;
  end if;
 elsif p_action in ('arena_role','arena_transfer','arena_member') then
  perform 1 from public.arenas where id=p_scope_id for update; if not found then raise insufficient_privilege; end if;
  rank:=pico_private.arena_rank(p_scope_id);
  if rank<20 or p_target_id=auth.uid() then raise insufficient_privilege; end if;
  if not exists(select 1 from pico_private.beta_admissions where player_id=p_target_id and status='approved') then raise insufficient_privilege; end if;
  select case when owner_id=p_target_id then 40 else coalesce((select case role when 'admin' then 30 else 20 end from public.arena_staff where arena_id=p_scope_id and player_id=p_target_id),0) end into target_rank from public.arenas where id=p_scope_id;
  if p_action='arena_transfer' then
   if not exists(select 1 from public.arenas where id=p_scope_id and owner_id=auth.uid()) or not exists(select 1 from public.arena_members where arena_id=p_scope_id and player_id=p_target_id and status='active') then raise insufficient_privilege; end if;
   update public.arenas set owner_id=p_target_id,version=version+1 where id=p_scope_id;
   delete from public.arena_staff where arena_id=p_scope_id and player_id=p_target_id;
   insert into public.arena_staff(arena_id,player_id,role) values(p_scope_id,auth.uid(),'admin') on conflict(arena_id,player_id) do update set role='admin';
  elsif p_action='arena_role' then
   if rank<30 or target_rank>=rank or p_value not in ('admin','moderator','member') or p_value is null or (p_value='admin' and rank<40) then raise insufficient_privilege; end if;
   if p_value='member' then delete from public.arena_staff where arena_id=p_scope_id and player_id=p_target_id;
   else insert into public.arena_staff(arena_id,player_id,role) values(p_scope_id,p_target_id,p_value) on conflict(arena_id,player_id) do update set role=excluded.role; end if;
  else
   if target_rank>=rank or p_value not in ('active','suspended','removed') or p_value is null then raise insufficient_privilege; end if;
   if p_value='removed' then delete from public.arena_members where arena_id=p_scope_id and player_id=p_target_id;
   else insert into public.arena_members(arena_id,player_id,status) values(p_scope_id,p_target_id,p_value) on conflict(arena_id,player_id) do update set status=excluded.status; end if;
  end if;
 elsif p_action='review_report' then
  if pico_private.platform_role() is null or p_value not in ('dismissed','action_taken') or p_value is null then raise insufficient_privilege; end if;
  select * into report from public.reports where id=p_target_id for update; if report.id is null then raise check_violation; end if;
  update public.reports set status=p_value,reviewed_at=now() where id=report.id;
 else raise check_violation; end if;
 insert into pico_private.audit_events(actor_id,action,scope_id,target_id) values(auth.uid(),p_action,p_scope_id,p_target_id);
 return jsonb_strip_nulls(jsonb_build_object('ok',true,'id',p_target_id,'token',token));
end;
$$;
create function pico_private.preserve_owned_arenas() returns trigger language plpgsql security definer set search_path='' as $$
begin update public.arenas set owner_id=null,status='custody',version=version+1 where owner_id=old.id; return old; end;
$$;
revoke all on function pico_private.preserve_owned_arenas() from public,anon,authenticated;
create trigger preserve_owned_arenas before delete on public.profiles for each row execute function pico_private.preserve_owned_arenas();
revoke all on function public.set_arena_membership(uuid,boolean),public.management_context(),public.operator_read(text,uuid),public.operator_action(text,uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.set_arena_membership(uuid,boolean),public.management_context(),public.operator_read(text,uuid),public.operator_action(text,uuid,uuid,text) to authenticated;
commit;
