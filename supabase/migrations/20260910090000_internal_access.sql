begin;
create table pico_private.environment_identity (
 singleton boolean primary key default true check(singleton),
 purpose text not null check(purpose in ('development','beta','production')),
 project_ref text not null unique
);
revoke all on pico_private.environment_identity from public,anon,authenticated;
create table pico_private.platform_grants (
 player_id uuid primary key references public.profiles(id) on delete cascade,
 role text not null check(role in ('admin','moderator')), created_at timestamptz not null default now()
);
create table pico_private.beta_admissions (
 player_id uuid primary key references public.profiles(id) on delete cascade,
 status text not null check(status in ('approved','revoked','suspended')),
 updated_at timestamptz not null default now()
);
create table pico_private.invitations (
 id uuid primary key default gen_random_uuid(), kind text not null check(kind in ('beta','arena','community')),
 scope_id uuid, email text not null check(email=lower(btrim(email)) and char_length(email) between 3 and 254),
 role text, token_hash text not null unique, created_by uuid references public.profiles(id) on delete set null,
 expires_at timestamptz not null, revoked_at timestamptz, accepted_at timestamptz,
 accepted_by uuid references public.profiles(id) on delete set null, created_at timestamptz not null default now(),
 check((kind='beta' and scope_id is null and role is null) or (kind<>'beta' and scope_id is not null and role is not null))
);
create index invitations_recipient on pico_private.invitations(email,kind,expires_at);
create table pico_private.audit_events (
 id bigint generated always as identity primary key, actor_id uuid references public.profiles(id) on delete set null,
 action text not null, scope_id uuid, target_id uuid, created_at timestamptz not null default now()
);
revoke all on pico_private.platform_grants,pico_private.beta_admissions,pico_private.invitations,pico_private.audit_events from public,anon,authenticated;
create or replace function pico_private.active_account() returns boolean
language sql stable security definer set search_path='' as $$
 select auth.uid() is not null
 and exists(select 1 from public.profiles where id=auth.uid())
 and exists(select 1 from pico_private.beta_admissions where player_id=auth.uid() and status='approved')
 and not exists(select 1 from public.account_deletions where player_id=auth.uid());
$$;
create function pico_private.platform_role() returns text language sql stable security definer set search_path='' as $$
 select role from pico_private.platform_grants where player_id=auth.uid() and pico_private.active_account();
$$;
revoke all on function pico_private.platform_role() from public,anon,authenticated;
grant execute on function pico_private.platform_role() to authenticated;
create function public.beta_status() returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object('uid',auth.uid(),'admitted',pico_private.active_account(),'role',pico_private.platform_role());
$$;
create function public.environment_identity() returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object('purpose',purpose,'projectRef',project_ref) from pico_private.environment_identity where singleton;
$$;
create function public.beta_before_user_created(event jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if not exists(select 1 from pico_private.invitations where kind='beta'
   and email=lower(btrim(event->'user'->>'email')) and expires_at>now() and revoked_at is null and accepted_at is null)
 then return jsonb_build_object('error',jsonb_build_object('http_code',403,'message','Cadastro disponível somente com convite individual vigente.')); end if;
 return '{}'::jsonb;
end;
$$;
create function public.accept_beta_invite(p_token text) returns jsonb language plpgsql security definer set search_path='' as $$
declare invite pico_private.invitations; recipient text;
begin
 if auth.uid() is null or char_length(p_token)<>64 then raise insufficient_privilege; end if;
 select lower(email) into recipient from auth.users where id=auth.uid() and email_confirmed_at is not null;
 select * into invite from pico_private.invitations where token_hash=encode(sha256(convert_to(p_token,'UTF8')),'hex') and kind='beta' for update;
 if invite.id is null or invite.email is distinct from recipient or invite.expires_at<=now() or invite.revoked_at is not null or invite.accepted_at is not null then raise insufficient_privilege; end if;
 update pico_private.invitations set accepted_at=now(),accepted_by=auth.uid() where id=invite.id;
 insert into pico_private.beta_admissions(player_id,status) values(auth.uid(),'approved') on conflict(player_id) do update set status='approved',updated_at=now();
 insert into pico_private.audit_events(actor_id,action,target_id) values(auth.uid(),'beta.accept',invite.id);
 return jsonb_build_object('accepted',true);
end;
$$;
create function public.bootstrap_operator(p_uid uuid) returns void language plpgsql security definer set search_path='' as $$
begin
 perform pg_advisory_xact_lock(918273645);
 if not exists(select 1 from auth.users where id=p_uid and email_confirmed_at is not null) then raise insufficient_privilege; end if;
 if exists(select 1 from pico_private.platform_grants where role='admin' and player_id<>p_uid) then raise insufficient_privilege; end if;
 insert into pico_private.beta_admissions(player_id,status) values(p_uid,'approved') on conflict(player_id) do update set status='approved',updated_at=now();
 insert into pico_private.platform_grants(player_id,role) values(p_uid,'admin') on conflict(player_id) do nothing;
 insert into pico_private.audit_events(actor_id,action,target_id) values(null,'operator.bootstrap',p_uid);
end;
$$;
revoke all on function public.beta_status(),public.environment_identity(),public.beta_before_user_created(jsonb),public.accept_beta_invite(text),public.bootstrap_operator(uuid) from public,anon,authenticated;
grant execute on function public.beta_status(),public.accept_beta_invite(text) to authenticated;
grant execute on function public.environment_identity() to anon,authenticated;
grant execute on function public.bootstrap_operator(uuid) to service_role;
-- supabase_auth_admin is the official role used by Postgres Auth hooks.
grant usage on schema public to supabase_auth_admin;
grant execute on function public.beta_before_user_created(jsonb) to supabase_auth_admin;
do $$ declare t text; begin
 foreach t in array array['sports','arenas','arena_sports','media_assets'] loop
 execute format('create policy internal_admission on public.%I as restrictive for all to anon,authenticated using ((select pico_private.active_account())) with check ((select pico_private.active_account()))',t);
 end loop;
end $$;
-- Anonymous execution must return false, not grant data access.
grant usage on schema pico_private to anon;
grant execute on function pico_private.active_account() to anon;
commit;
