begin;
create table public.communities(
 id uuid primary key default gen_random_uuid(), slug text not null unique check(slug~'^[a-z0-9]+(-[a-z0-9]+)*$'),
 owner_id uuid references public.profiles(id) on delete set null,
 name text not null check(char_length(btrim(name)) between 2 and 100), description text not null default '' check(char_length(description)<=1000),
 rules text not null default '' check(char_length(rules)<=2000), entry_mode text not null check(entry_mode in ('open','approval','invite')),
 visibility text not null check(visibility in ('beta','private')), status text not null default 'active' check(status in ('active','custody','archived')),
 avatar_path text,cover_path text,version integer not null default 1,created_at timestamptz not null default now()
);
create table public.community_members(
 community_id uuid not null references public.communities(id) on delete cascade,player_id uuid not null references public.profiles(id) on delete cascade,
 role text not null default 'member' check(role in ('member','moderator','admin')),
 status text not null check(status in ('pending','active','removed','suspended','rejected')),
 created_at timestamptz not null default now(),primary key(community_id,player_id)
);
create index community_members_player on public.community_members(player_id,status,community_id);
create table public.community_sports(community_id uuid not null references public.communities(id) on delete cascade,sport_id uuid not null references public.sports(id) on delete restrict,primary key(community_id,sport_id));
create table public.community_arena_links(
 community_id uuid primary key references public.communities(id) on delete cascade,arena_id uuid not null references public.arenas(id) on delete restrict,
 status text not null default 'pending' check(status in ('pending','approved','rejected')),is_official boolean not null default false,
 requested_by uuid references public.profiles(id) on delete set null,check(not is_official or status='approved')
);
create unique index arena_one_official_community on public.community_arena_links(arena_id) where is_official and status='approved';
create function pico_private.community_rank(p_id uuid) returns integer language sql stable security definer set search_path='' as $$
 select case when not pico_private.active_account() then 0 when exists(select 1 from public.communities where id=p_id and owner_id=auth.uid()) then 40 else coalesce((select case role when 'admin' then 30 when 'moderator' then 20 else 10 end from public.community_members where community_id=p_id and player_id=auth.uid() and status='active'),0) end;
$$;
create function pico_private.can_read_community(p_id uuid) returns boolean language sql stable security definer set search_path='' as $$
 select pico_private.active_account() and exists(select 1 from public.communities c where c.id=p_id and (c.visibility='beta' or pico_private.community_rank(p_id)>=10) and (c.status<>'archived' or pico_private.community_rank(p_id)>=10)) and not exists(select 1 from public.community_members where community_id=p_id and player_id=auth.uid() and status='suspended');
$$;
revoke all on function pico_private.community_rank(uuid),pico_private.can_read_community(uuid) from public,anon,authenticated;
grant execute on function pico_private.community_rank(uuid),pico_private.can_read_community(uuid) to authenticated;
alter table public.communities enable row level security;alter table public.community_members enable row level security;alter table public.community_sports enable row level security;alter table public.community_arena_links enable row level security;
revoke all on public.communities,public.community_members,public.community_sports,public.community_arena_links from public,anon,authenticated;
grant select on public.communities,public.community_members,public.community_sports,public.community_arena_links to authenticated;
create policy community_read on public.communities for select to authenticated using(pico_private.can_read_community(id));
create policy community_members_read on public.community_members for select to authenticated using(pico_private.active_account() and pico_private.can_see_player(player_id) and (player_id=auth.uid() or (pico_private.can_read_community(community_id) and (status='active' or pico_private.community_rank(community_id)>=20))));
create policy community_sports_read on public.community_sports for select to authenticated using(pico_private.can_read_community(community_id));
create policy community_links_read on public.community_arena_links for select to authenticated using(pico_private.active_account() and ((status='approved' and pico_private.can_read_community(community_id)) or pico_private.community_rank(community_id)>=30 or pico_private.arena_rank(arena_id)>=30));
create function public.create_community(p_data jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare result uuid:=gen_random_uuid();sport text;
begin
 perform pico_private.consume_write('community_create',3,86400);
 if (select count(*) from public.communities where owner_id=auth.uid() and status<>'archived')>=5 then raise sqlstate 'P0429'; end if;
 if exists(select 1 from jsonb_object_keys(p_data) k where k not in ('name','description','rules','entry_mode','visibility','sports')) or coalesce(jsonb_typeof(p_data->'sports')<>'array',true) or jsonb_array_length(p_data->'sports')>3 then raise check_violation; end if;
 insert into public.communities(id,slug,owner_id,name,description,rules,entry_mode,visibility) values(result,'grupo-'||left(result::text,8),auth.uid(),btrim(p_data->>'name'),coalesce(p_data->>'description',''),coalesce(p_data->>'rules',''),p_data->>'entry_mode',p_data->>'visibility');
 insert into public.community_members(community_id,player_id,status) values(result,auth.uid(),'active');
 for sport in select jsonb_array_elements_text(p_data->'sports') loop insert into public.community_sports(community_id,sport_id) values(result,sport::uuid);end loop;
 insert into pico_private.audit_events(actor_id,action,scope_id) values(auth.uid(),'community.create',result);
 return jsonb_build_object('id',result,'slug','grupo-'||left(result::text,8));
end;
$$;
create function public.save_community(p_id uuid,p_version integer,p_data jsonb) returns void language plpgsql security definer set search_path='' as $$
declare c public.communities;sport text;
begin
 perform pico_private.consume_write('community_edit',30,3600);select * into c from public.communities where id=p_id for update;
 if c.id is null or pico_private.community_rank(p_id)<30 then raise insufficient_privilege; end if;
 if c.version<>p_version then raise sqlstate 'P0409'; end if;
 if exists(select 1 from jsonb_object_keys(p_data) k where k not in ('name','description','rules','entry_mode','visibility','sports')) or coalesce(jsonb_typeof(p_data->'sports')<>'array',true) or jsonb_array_length(p_data->'sports')>3 then raise check_violation; end if;
 -- Audience changes would reclassify existing content. This cycle keeps it immutable.
 if p_data->>'visibility' is distinct from c.visibility then raise check_violation using message='Create a separate group for another audience'; end if;
 update public.communities set name=btrim(p_data->>'name'),description=coalesce(p_data->>'description',''),rules=coalesce(p_data->>'rules',''),entry_mode=p_data->>'entry_mode',version=version+1 where id=p_id;
 delete from public.community_sports where community_id=p_id;
 for sport in select jsonb_array_elements_text(p_data->'sports') loop insert into public.community_sports(community_id,sport_id) values(p_id,sport::uuid);end loop;
 insert into pico_private.audit_events(actor_id,action,scope_id) values(auth.uid(),'community.edit',p_id);
end;
$$;
create function public.community_directory(p_search text default '',p_mine boolean default false,p_offset integer default 0,p_arena uuid default null) returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
 if not pico_private.active_account() then raise insufficient_privilege; end if;
 if p_offset<0 or p_offset>10000 or char_length(p_search)>100 then raise check_violation; end if;
 return coalesce((select jsonb_agg(row_to_json(q)) from(select c.id,c.slug,c.name,c.visibility,c.entry_mode,
  (select status from public.community_members where community_id=c.id and player_id=auth.uid()) membership,
  (select a.name from public.community_arena_links l join public.arenas a on a.id=l.arena_id where l.community_id=c.id and l.status='approved') arena_name,
  (select l.is_official from public.community_arena_links l where l.community_id=c.id and l.status='approved') is_official,
  case when pico_private.can_read_community(c.id) then c.description else null end description
  from public.communities c where c.status='active' and (not p_mine or pico_private.community_rank(c.id)>=10)
  and (p_arena is null or exists(select 1 from public.community_arena_links l where l.community_id=c.id and l.arena_id=p_arena and l.status='approved'))
  and c.name ilike '%'||p_search||'%' order by c.name,c.id limit 21 offset p_offset)q),'[]'::jsonb);
end;
$$;
create function public.community_page(p_slug text) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare c public.communities;readable boolean;membership text;
begin
 if not pico_private.active_account() then raise insufficient_privilege; end if;
 select * into c from public.communities where slug=p_slug;
 if c.id is null or (c.status='archived' and pico_private.community_rank(c.id)=0) then return null; end if;
 readable:=pico_private.can_read_community(c.id);select status into membership from public.community_members where community_id=c.id and player_id=auth.uid();
 return jsonb_build_object('id',c.id,'slug',c.slug,'name',c.name,'entry_mode',c.entry_mode,'visibility',c.visibility,'membership',membership,'rank',pico_private.community_rank(c.id),'readable',readable,'version',c.version,
 'description',case when readable then c.description end,'rules',case when readable then c.rules end,
 'avatar_path',case when readable then c.avatar_path end,'cover_path',case when readable then c.cover_path end,
 'sports',case when readable then coalesce((select jsonb_agg(jsonb_build_object('id',s.id,'name',s.name,'slug',s.slug)) from public.community_sports x join public.sports s on s.id=x.sport_id where x.community_id=c.id),'[]'::jsonb) else '[]'::jsonb end,
 'owner',case when readable and pico_private.can_see_player(c.owner_id) then (select jsonb_build_object('id',id,'name',display_name,'username',username) from public.profiles where id=c.owner_id) end,
 'members',case when readable then coalesce((select jsonb_agg(row_to_json(q)) from(select m.player_id id,p.display_name name,p.username,case when c.owner_id=m.player_id then 'owner' else m.role end role,m.status from public.community_members m join public.profiles p on p.id=m.player_id where m.community_id=c.id and pico_private.can_see_player(p.id) and (m.status='active' or pico_private.community_rank(c.id)>=20 or m.player_id=auth.uid()) order by m.created_at limit 100)q),'[]'::jsonb) else '[]'::jsonb end,
 'arena', (select jsonb_build_object('id',a.id,'name',a.name,'slug',a.slug,'official',l.is_official,'status',l.status) from public.community_arena_links l join public.arenas a on a.id=l.arena_id where l.community_id=c.id and (l.status='approved' or pico_private.community_rank(c.id)>=30)));
end;
$$;
create function public.community_membership(p_id uuid,p_action text,p_target uuid default null,p_role text default null) returns void language plpgsql security definer set search_path='' as $$
declare c public.communities;rank integer;target_rank integer;current_status text;
begin
 perform pico_private.consume_write('community_membership',40,3600);select * into c from public.communities where id=p_id for update;
 if c.id is null then raise insufficient_privilege; end if;
 rank:=pico_private.community_rank(p_id);
 if p_action in ('join','leave') then
  if p_target is not null and p_target<>auth.uid() then raise insufficient_privilege; end if;
  if c.owner_id=auth.uid() then raise check_violation using message='Transfer ownership before leaving'; end if;
  select status into current_status from public.community_members where community_id=p_id and player_id=auth.uid();
  if p_action='leave' then
   if current_status='suspended' then raise insufficient_privilege; end if;
   update public.community_members set status='removed',role='member' where community_id=p_id and player_id=auth.uid();
  else
   if c.status<>'active' or c.entry_mode='invite' or current_status in ('suspended','rejected') then raise insufficient_privilege; end if;
   if current_status='active' then return; end if;
   insert into public.community_members(community_id,player_id,status) values(p_id,auth.uid(),case when c.entry_mode='open' then 'active' else 'pending' end) on conflict(community_id,player_id) do update set status=excluded.status,role='member';
  end if;
 else
  if rank<20 or p_target is null or p_target=auth.uid() then raise insufficient_privilege; end if;
  select case when c.owner_id=p_target then 40 when status='active' then case role when 'admin' then 30 when 'moderator' then 20 else 10 end else 0 end into target_rank from public.community_members where community_id=p_id and player_id=p_target;
  if target_rank is null or target_rank>=rank then raise insufficient_privilege; end if;
  if p_action='transfer' then
   if c.owner_id<>auth.uid() or target_rank<10 or not exists(select 1 from pico_private.beta_admissions where player_id=p_target and status='approved') then raise insufficient_privilege; end if;
   update public.communities set owner_id=p_target,version=version+1 where id=p_id;update public.community_members set role='admin' where community_id=p_id and player_id=auth.uid();update public.community_members set role='member' where community_id=p_id and player_id=p_target;
  elsif p_action='role' then
   if rank<30 or p_role not in ('member','moderator','admin') or p_role is null or (p_role='admin' and rank<40) or target_rank<10 then raise insufficient_privilege; end if;
   update public.community_members set role=p_role where community_id=p_id and player_id=p_target;
  elsif p_action in ('approve','reject','remove','suspend','reactivate') then
   if p_action in ('approve','reactivate') and not exists(select 1 from pico_private.beta_admissions where player_id=p_target and status='approved') then raise insufficient_privilege; end if;
   update public.community_members set status=case p_action when 'approve' then 'active' when 'reactivate' then 'active' when 'reject' then 'rejected' when 'remove' then 'removed' else 'suspended' end,role=case when p_action in ('remove','reject','suspend') then 'member' else role end where community_id=p_id and player_id=p_target;
  else raise check_violation; end if;
 end if;
 insert into pico_private.audit_events(actor_id,action,scope_id,target_id) values(auth.uid(),'community.'||p_action,p_id,coalesce(p_target,auth.uid()));
end;
$$;
create function public.community_link(p_community uuid,p_arena uuid,p_action text,p_official boolean default false) returns void language plpgsql security definer set search_path='' as $$
begin
 perform pico_private.consume_write('community_link',10,3600);perform 1 from public.communities where id=p_community for update;
 if not found then raise insufficient_privilege; end if;
 if p_action='request' then
  if pico_private.community_rank(p_community)<30 or p_official then raise insufficient_privilege; end if;
  if not exists(select 1 from public.arenas where id=p_arena and is_public and status='active') then raise insufficient_privilege; end if;
  insert into public.community_arena_links(community_id,arena_id,status,requested_by) values(p_community,p_arena,'pending',auth.uid()) on conflict(community_id) do update set arena_id=excluded.arena_id,status='pending',is_official=false,requested_by=auth.uid();
 elsif p_action in ('approve','reject') then
  perform 1 from public.arenas where id=p_arena for update;
  if pico_private.arena_rank(p_arena)<30 then raise insufficient_privilege; end if;
  if p_official and not exists(select 1 from public.communities where id=p_community and visibility='beta') then raise check_violation using message='Official community must have beta visibility'; end if;
  update public.community_arena_links set status=case when p_action='approve' then 'approved' else 'rejected' end,is_official=p_action='approve' and p_official where community_id=p_community and arena_id=p_arena;
  if not found then raise check_violation; end if;
 else raise check_violation; end if;
 insert into pico_private.audit_events(actor_id,action,scope_id,target_id) values(auth.uid(),'community.link.'||p_action,p_arena,p_community);
end;
$$;
create function public.arena_link_requests(p_arena uuid) returns jsonb language plpgsql stable security definer set search_path='' as $$
begin if pico_private.arena_rank(p_arena)<30 then raise insufficient_privilege; end if;
 return coalesce((select jsonb_agg(jsonb_build_object('id',c.id,'name',c.name,'slug',c.slug,'status',l.status,'official',l.is_official)) from public.community_arena_links l join public.communities c on c.id=l.community_id where l.arena_id=p_arena),'[]'::jsonb);end;
$$;
create function public.create_official_community(p_arena uuid) returns uuid language plpgsql security definer set search_path='' as $$
declare a public.arenas; result uuid;
begin
 perform pico_private.consume_write('community_official',5,86400);select * into a from public.arenas where id=p_arena for update;
 if a.id is null or pico_private.arena_rank(p_arena)<40 or a.owner_id is null then raise insufficient_privilege; end if;
 select community_id into result from public.community_arena_links where arena_id=p_arena and is_official and status='approved';if result is not null then return result;end if;
 result:=gen_random_uuid();insert into public.communities(id,slug,owner_id,name,description,entry_mode,visibility) values(result,'grupo-'||left(result::text,8),a.owner_id,'Comunidade '||left(a.name,85),'O grupo desta arena.','open','beta');
 insert into public.community_members(community_id,player_id,status) values(result,a.owner_id,'active');
 insert into public.community_sports select result,sport_id from public.arena_sports where arena_id=p_arena and enabled;
 insert into public.community_arena_links(community_id,arena_id,status,is_official,requested_by) values(result,p_arena,'approved',true,auth.uid());
 insert into pico_private.audit_events(actor_id,action,scope_id,target_id) values(auth.uid(),'community.official',p_arena,result);return result;
end;
$$;
create function pico_private.preserve_owned_communities() returns trigger language plpgsql security definer set search_path='' as $$
begin update public.communities set owner_id=null,status='custody',version=version+1 where owner_id=old.id;return old;end;
$$;
revoke all on function pico_private.preserve_owned_communities() from public,anon,authenticated;
create trigger preserve_owned_communities before delete on public.profiles for each row execute function pico_private.preserve_owned_communities();
create or replace function public.management_context() returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object('platformRole',pico_private.platform_role(),'arenas',coalesce((select jsonb_agg(jsonb_build_object('id',id,'name',name,'slug',slug,'rank',pico_private.arena_rank(id))) from public.arenas where pico_private.arena_rank(id)>=20),'[]'::jsonb),'communities',coalesce((select jsonb_agg(jsonb_build_object('id',id,'name',name,'slug',slug,'rank',pico_private.community_rank(id))) from public.communities where pico_private.community_rank(id)>=20),'[]'::jsonb));
$$;
do $$ declare f record; begin for f in select p.oid::regprocedure signature from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname in ('create_community','save_community','community_directory','community_page','community_membership','community_link','arena_link_requests','create_official_community') loop execute format('revoke all on function %s from public,anon,authenticated',f.signature);execute format('grant execute on function %s to authenticated',f.signature);end loop;end $$;
create function public.review_arena_and_group(p_request uuid,p_approve boolean,p_official boolean default false) returns uuid language plpgsql security invoker set search_path='' as $$
declare result uuid;begin result:=public.review_arena_request(p_request,p_approve);if p_approve and p_official then perform public.create_official_community(result);end if;return result;end;
$$;
create function public.invite_community_member(p_id uuid,p_email text) returns jsonb language plpgsql security definer set search_path='' as $$
declare token text; result uuid;
begin
 perform pico_private.consume_write('invites',20,86400);
 perform 1 from public.communities where id=p_id and status='active' for update;
 if not found or pico_private.community_rank(p_id)<20 or p_email is null or p_email!~'^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then raise insufficient_privilege;end if;
 token:=replace(gen_random_uuid()::text,'-','')||replace(gen_random_uuid()::text,'-','');
 insert into pico_private.invitations(kind,scope_id,email,role,token_hash,created_by,expires_at) values('community',p_id,lower(btrim(p_email)),'member',encode(sha256(convert_to(token,'UTF8')),'hex'),auth.uid(),now()+interval '7 days') returning id into result;
 insert into pico_private.audit_events(actor_id,action,scope_id,target_id) values(auth.uid(),'community.invite',p_id,result);return jsonb_build_object('id',result,'token',token);
end;
$$;
create function public.accept_community_invite(p_token text) returns uuid language plpgsql security definer set search_path='' as $$
declare invite pico_private.invitations;recipient text;issuer_rank integer;
begin
 if not pico_private.active_account() or char_length(p_token)<>64 then raise insufficient_privilege;end if;
 select lower(email) into recipient from auth.users where id=auth.uid() and email_confirmed_at is not null;
 select * into invite from pico_private.invitations where kind='community' and token_hash=encode(sha256(convert_to(p_token,'UTF8')),'hex') for update;
 if invite.id is null or invite.email is distinct from recipient or invite.expires_at<=now() or invite.revoked_at is not null or invite.accepted_at is not null then raise insufficient_privilege;end if;
 perform 1 from public.communities where id=invite.scope_id and status='active' for update;if not found then raise insufficient_privilege;end if;
 select case when owner_id=invite.created_by then 40 else coalesce((select case role when 'admin' then 30 when 'moderator' then 20 else 10 end from public.community_members where community_id=invite.scope_id and player_id=invite.created_by and status='active'),0) end into issuer_rank from public.communities where id=invite.scope_id;
 if issuer_rank<20 or not exists(select 1 from pico_private.beta_admissions where player_id=invite.created_by and status='approved') or exists(select 1 from public.community_members where community_id=invite.scope_id and player_id=auth.uid() and status='suspended') then raise insufficient_privilege;end if;
 insert into public.community_members(community_id,player_id,status) values(invite.scope_id,auth.uid(),'active') on conflict(community_id,player_id) do update set status='active';
 update pico_private.invitations set accepted_at=now(),accepted_by=auth.uid() where id=invite.id;
 insert into pico_private.audit_events(actor_id,action,scope_id,target_id) values(auth.uid(),'community.invite.accept',invite.scope_id,invite.id);return invite.scope_id;
end;
$$;
create function public.community_invitations(p_id uuid,p_revoke uuid default null) returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if pico_private.community_rank(p_id)<20 then raise insufficient_privilege;end if;
 if p_revoke is not null then update pico_private.invitations set revoked_at=now() where id=p_revoke and scope_id=p_id and kind='community' and accepted_at is null;insert into pico_private.audit_events(actor_id,action,scope_id,target_id) values(auth.uid(),'community.invite.revoke',p_id,p_revoke);end if;
 return coalesce((select jsonb_agg(jsonb_build_object('id',id,'email',email,'expires_at',expires_at,'revoked_at',revoked_at,'accepted_at',accepted_at)) from pico_private.invitations where kind='community' and scope_id=p_id),'[]'::jsonb);
end;
$$;
revoke all on function public.review_arena_and_group(uuid,boolean,boolean),public.invite_community_member(uuid,text),public.accept_community_invite(text),public.community_invitations(uuid,uuid) from public,anon,authenticated;
grant execute on function public.review_arena_and_group(uuid,boolean,boolean),public.invite_community_member(uuid,text),public.accept_community_invite(text),public.community_invitations(uuid,uuid) to authenticated;
commit;
