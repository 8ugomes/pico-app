begin;
alter table public.arena_sports add column enabled boolean not null default true;
create table public.arena_requests(
 id uuid primary key default gen_random_uuid(), requester_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
 arena_id uuid references public.arenas(id) on delete set null, kind text not null check(kind in ('create','claim','correction')),
 name text not null check(char_length(btrim(name)) between 2 and 100), city text not null check(char_length(btrim(city)) between 1 and 80),
 neighborhood text not null check(char_length(btrim(neighborhood)) between 1 and 80), details text not null check(char_length(details)<=1000),
 status text not null default 'pending' check(status in ('pending','approved','rejected')),
 created_at timestamptz not null default now(), reviewed_at timestamptz
);
alter table public.arena_requests enable row level security;
revoke all on public.arena_requests from public,anon,authenticated;
grant select on public.arena_requests to authenticated;
create policy requests_read on public.arena_requests for select to authenticated using(pico_private.active_account() and (requester_id=auth.uid() or pico_private.platform_role()='admin'));
create function pico_private.guard_last_active_admin() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if old.status='approved' and new.status<>'approved' then
  perform pg_advisory_xact_lock(918273645);
  if exists(select 1 from pico_private.platform_grants where player_id=old.player_id and role='admin') and not exists(select 1 from pico_private.platform_grants g join pico_private.beta_admissions a on a.player_id=g.player_id where g.role='admin' and a.status='approved' and g.player_id<>old.player_id) then raise check_violation using message='Last active administrator'; end if;
 end if; return new;
end;
$$;
revoke all on function pico_private.guard_last_active_admin() from public,anon,authenticated;
create trigger preserve_last_active_admin before update on pico_private.beta_admissions for each row execute function pico_private.guard_last_active_admin();
create function public.arena_profile(p_slug text) returns jsonb language sql stable security invoker set search_path='' as $$
 select to_jsonb(a)||jsonb_build_object('rank',pico_private.arena_rank(a.id),'owner',(select jsonb_build_object('id',p.id,'name',p.display_name,'username',p.username) from public.profiles p where p.id=a.owner_id),'staff',coalesce((select jsonb_agg(jsonb_build_object('id',s.player_id,'name',p.display_name,'username',p.username,'role',s.role)) from public.arena_staff s join public.profiles p on p.id=s.player_id where s.arena_id=a.id),'[]'::jsonb),'sports',coalesce((select jsonb_agg(jsonb_build_object('id',s.id,'name',s.name,'slug',s.slug)) from public.arena_sports x join public.sports s on s.id=x.sport_id where x.arena_id=a.id and x.enabled),'[]'::jsonb),'membership',(select status from public.arena_members where arena_id=a.id and player_id=auth.uid())) from public.arenas a where a.slug=p_slug;
$$;
create function public.save_arena(p_id uuid,p_version integer,p_data jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare current_arena public.arenas; sport text;
begin
 perform pico_private.consume_write('arena_edit',30,3600);
 select * into current_arena from public.arenas where id=p_id for update;
 if current_arena.id is null or pico_private.arena_rank(p_id)<30 then raise insufficient_privilege; end if;
 if current_arena.version<>p_version then raise sqlstate 'P0409' using message='Arena changed'; end if;
 if jsonb_typeof(p_data)<>'object' or exists(select 1 from jsonb_object_keys(p_data) k where k not in ('name','description','city','neighborhood','public_info','sports')) or coalesce(jsonb_typeof(p_data->'sports')<>'array',true) or jsonb_array_length(p_data->'sports')>3 then raise check_violation; end if;
 update public.arenas set name=btrim(p_data->>'name'),description=coalesce(p_data->>'description',''),city=btrim(p_data->>'city'),neighborhood=btrim(p_data->>'neighborhood'),public_info=coalesce(p_data->>'public_info',''),version=version+1 where id=p_id;
 update public.arena_sports set enabled=false where arena_id=p_id;
 for sport in select jsonb_array_elements_text(p_data->'sports') loop
  insert into public.arena_sports(arena_id,sport_id,enabled) values(p_id,sport::uuid,true) on conflict(arena_id,sport_id) do update set enabled=true;
 end loop;
 insert into pico_private.audit_events(actor_id,action,scope_id) values(auth.uid(),'arena.edit',p_id);
 return jsonb_build_object('id',p_id,'version',p_version+1);
end;
$$;
create function public.request_arena(p_kind text,p_arena uuid default null,p_data jsonb default '{}') returns uuid language plpgsql security definer set search_path='' as $$
declare result uuid;
begin
 perform pico_private.consume_write('arena_request',3,86400);
 if p_kind not in ('create','claim','correction') or p_kind is null or (p_kind<>'create' and not exists(select 1 from public.arenas where id=p_arena and is_public)) then raise check_violation; end if;
 insert into public.arena_requests(requester_id,arena_id,kind,name,city,neighborhood,details) values(auth.uid(),p_arena,p_kind,btrim(p_data->>'name'),btrim(p_data->>'city'),btrim(p_data->>'neighborhood'),coalesce(p_data->>'details','')) returning id into result;
 return result;
end;
$$;
create function public.review_arena_request(p_request uuid,p_approve boolean) returns uuid language plpgsql security definer set search_path='' as $$
declare request public.arena_requests; result uuid;
begin
 perform pico_private.consume_write('management',60,3600);
 if pico_private.platform_role() is distinct from 'admin' then raise insufficient_privilege; end if;
 select * into request from public.arena_requests where id=p_request for update;
 if request.id is null then raise check_violation; end if;
 if request.status='approved' then return request.arena_id; end if;
 if request.status<>'pending' then raise check_violation; end if;
 if p_approve then
  if not exists(select 1 from pico_private.beta_admissions where player_id=request.requester_id and status='approved') then raise insufficient_privilege; end if;
  if request.kind='create' then
   if exists(select 1 from public.arenas where lower(name)=lower(request.name) and lower(city)=lower(request.city)) then raise sqlstate 'P0409' using message='Review duplicate arena'; end if;
   result:=gen_random_uuid();insert into public.arenas(id,slug,name,city,neighborhood,description,owner_id) values(result,'arena-'||left(result::text,8),request.name,request.city,request.neighborhood,request.details,request.requester_id);
  elsif request.kind='claim' then
   perform 1 from public.arenas where id=request.arena_id for update;
   if exists(select 1 from public.arenas where id=request.arena_id and owner_id is not null and owner_id<>request.requester_id) then raise check_violation using message='Existing owner requires transfer'; end if;
   result:=request.arena_id;update public.arenas set owner_id=request.requester_id,status='active',version=version+1 where id=result;
  else result:=request.arena_id; end if;
  if request.kind<>'correction' then insert into public.arena_members(arena_id,player_id) values(result,request.requester_id) on conflict do nothing; end if;
 end if;
 update public.arena_requests set status=case when p_approve then 'approved' else 'rejected' end,reviewed_at=now(),arena_id=coalesce(result,arena_id) where id=p_request;
 insert into pico_private.audit_events(actor_id,action,scope_id,target_id) values(auth.uid(),'arena.request.review',result,p_request);
 return result;
end;
$$;
create function public.invite_arena_manager(p_arena uuid,p_email text,p_role text) returns jsonb language plpgsql security definer set search_path='' as $$
declare rank integer; token text; result uuid;
begin
 perform pico_private.consume_write('invites',20,86400);perform 1 from public.arenas where id=p_arena for update;rank:=pico_private.arena_rank(p_arena);
 if rank<30 or p_role not in ('admin','moderator') or p_role is null or (p_role='admin' and rank<40) or p_email is null or p_email!~'^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then raise insufficient_privilege; end if;
 token:=replace(gen_random_uuid()::text,'-','')||replace(gen_random_uuid()::text,'-','');
 insert into pico_private.invitations(kind,scope_id,email,role,token_hash,created_by,expires_at) values('arena',p_arena,lower(btrim(p_email)),p_role,encode(sha256(convert_to(token,'UTF8')),'hex'),auth.uid(),now()+interval '7 days') returning id into result;
 insert into pico_private.audit_events(actor_id,action,scope_id,target_id) values(auth.uid(),'arena.invite',p_arena,result);
 return jsonb_build_object('id',result,'token',token);
end;
$$;
create function public.accept_arena_invite(p_token text) returns uuid language plpgsql security definer set search_path='' as $$
declare invite pico_private.invitations; recipient text; issuer_rank integer;
begin
 if not pico_private.active_account() or char_length(p_token)<>64 then raise insufficient_privilege; end if;
 select lower(email) into recipient from auth.users where id=auth.uid() and email_confirmed_at is not null;
 select * into invite from pico_private.invitations where kind='arena' and token_hash=encode(sha256(convert_to(p_token,'UTF8')),'hex') for update;
 if invite.id is null or invite.email is distinct from recipient or invite.expires_at<=now() or invite.revoked_at is not null or invite.accepted_at is not null then raise insufficient_privilege; end if;
 perform 1 from public.arenas where id=invite.scope_id and status='active' for update;
 if not found or not exists(select 1 from pico_private.beta_admissions where player_id=invite.created_by and status='approved') then raise insufficient_privilege; end if;
 select case when exists(select 1 from pico_private.platform_grants where player_id=invite.created_by and role='admin') then 50 when owner_id=invite.created_by then 40 else coalesce((select case role when 'admin' then 30 else 20 end from public.arena_staff where arena_id=invite.scope_id and player_id=invite.created_by),0) end into issuer_rank from public.arenas where id=invite.scope_id;
 if issuer_rank<30 or (invite.role='admin' and issuer_rank<40) or exists(select 1 from public.arena_members where arena_id=invite.scope_id and player_id=auth.uid() and status='suspended') then raise insufficient_privilege; end if;
 if exists(select 1 from public.arenas where id=invite.scope_id and owner_id=auth.uid()) then raise check_violation; end if;
 insert into public.arena_staff(arena_id,player_id,role) values(invite.scope_id,auth.uid(),invite.role) on conflict(arena_id,player_id) do update set role=case when arena_staff.role='admin' then 'admin' else excluded.role end;
 insert into public.arena_members(arena_id,player_id) values(invite.scope_id,auth.uid()) on conflict do nothing;
 update pico_private.invitations set accepted_at=now(),accepted_by=auth.uid() where id=invite.id;
 insert into pico_private.audit_events(actor_id,action,scope_id,target_id) values(auth.uid(),'arena.invite.accept',invite.scope_id,invite.id);
 return invite.scope_id;
end;
$$;
create function public.arena_invitations(p_arena uuid) returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
 if pico_private.arena_rank(p_arena)<30 then raise insufficient_privilege; end if;
 return coalesce((select jsonb_agg(jsonb_build_object('id',id,'email',email,'role',role,'expires_at',expires_at,'revoked_at',revoked_at,'accepted_at',accepted_at)) from pico_private.invitations where kind='arena' and scope_id=p_arena),'[]'::jsonb);
end;
$$;
create function public.revoke_arena_invite(p_id uuid) returns void language plpgsql security definer set search_path='' as $$
declare invite pico_private.invitations;
begin
 select * into invite from pico_private.invitations where id=p_id and kind='arena' for update;
 if invite.id is null or pico_private.arena_rank(invite.scope_id)<30 or (invite.role='admin' and pico_private.arena_rank(invite.scope_id)<40) then raise insufficient_privilege; end if;
 update pico_private.invitations set revoked_at=now() where id=p_id and accepted_at is null;
 insert into pico_private.audit_events(actor_id,action,scope_id,target_id) values(auth.uid(),'arena.invite.revoke',invite.scope_id,p_id);
end;
$$;
create function pico_private.check_available_arena() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is not null and (not exists(select 1 from public.arenas a join public.arena_sports s on s.arena_id=a.id where a.id=new.arena_id and s.sport_id=new.sport_id and s.enabled and a.status='active') or exists(select 1 from public.arena_members where arena_id=new.arena_id and player_id=auth.uid() and status='suspended')) then raise insufficient_privilege; end if;
 return new;
end;
$$;
revoke all on function pico_private.check_available_arena() from public,anon,authenticated;
create trigger checkin_available_arena before insert on public.checkins for each row execute function pico_private.check_available_arena();
do $$ declare f record; begin for f in select p.oid::regprocedure signature from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname in ('arena_profile','save_arena','request_arena','review_arena_request','invite_arena_manager','accept_arena_invite','arena_invitations','revoke_arena_invite') loop execute format('revoke all on function %s from public,anon,authenticated',f.signature);execute format('grant execute on function %s to authenticated',f.signature);end loop;end $$;
commit;
