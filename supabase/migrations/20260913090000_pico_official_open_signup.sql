begin;
-- Open registration is explicit product policy. Email verification and moderation
-- remain enforced in the database, including for old JWTs and direct REST calls.
create or replace function public.beta_before_user_created(event jsonb) returns jsonb
language sql security definer set search_path='' as $$ select '{}'::jsonb; $$;

create function pico_private.admit_new_profile() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 insert into pico_private.beta_admissions(player_id,status) values(new.id,'approved') on conflict do nothing;
 return new;
end; $$;
revoke all on function pico_private.admit_new_profile() from public,anon,authenticated;
create trigger admit_new_profile after insert on public.profiles for each row execute function pico_private.admit_new_profile();
insert into pico_private.beta_admissions(player_id,status) select id,'approved' from public.profiles on conflict do nothing;

create or replace function pico_private.active_account() returns boolean
language sql stable security definer set search_path='' as $$
 select auth.uid() is not null
 and exists(select 1 from auth.users where id=auth.uid() and email_confirmed_at is not null)
 and exists(select 1 from public.profiles where id=auth.uid())
 and exists(select 1 from pico_private.beta_admissions where player_id=auth.uid() and status='approved')
 and not exists(select 1 from public.account_deletions where player_id=auth.uid());
$$;

-- Institutional identity cannot be claimed by a user or confused with an arena's
-- official group. No fictitious Auth account or invented engagement is seeded.
create table pico_private.pico_community (
 singleton boolean primary key default true check(singleton),
 community_id uuid not null unique references public.communities(id) on delete restrict
);
create table pico_private.pico_welcomes (
 player_id uuid primary key references public.profiles(id) on delete cascade,
 community_id uuid not null references public.communities(id) on delete restrict,
 joined_at timestamptz not null default now(), acknowledged_at timestamptz
);
create table pico_private.pico_editorial (
 id text primary key, title text not null, body text not null,
 position integer not null unique, published_at timestamptz not null default now()
);
revoke all on pico_private.pico_community,pico_private.pico_welcomes,pico_private.pico_editorial from public,anon,authenticated;
with c as (
 insert into public.communities(slug,name,description,rules,entry_mode,visibility,status)
 values('pico-oficial','Pico — comunidade oficial',
 'O ponto de encontro da areia. Todas as modalidades, histórias e turmas do Pico em um só lugar.',
 'Respeite as pessoas e os diferentes níveis de jogo. Compartilhe apenas o que você quer tornar visível no Pico. Não publique dados pessoais de outras pessoas. Você pode sair quando quiser.',
 'open','beta','active') returning id
) insert into pico_private.pico_community(community_id) select id from c;
insert into public.community_sports(community_id,sport_id) select c.community_id,s.id from pico_private.pico_community c cross join public.sports s;
insert into pico_private.pico_editorial(id,title,body,position) values
 ('boas-vindas','A areia aproxima. O Pico conecta.','Este é o espaço oficial de quem joga futevôlei, beach tennis e vôlei de praia. Aqui você encontra pessoas, acompanha sua turma e descobre o que acontece nas arenas. Me acha no Pico.',1),
 ('apresentacao','Qual é a sua praia?','Conte no mural qual esporte você joga e em quais arenas costuma jogar. Abra a lista de participantes para conhecer outras pessoas. Uma apresentação simples já pode começar uma conversa.',2),
 ('primeiros-passos','Encontre seus lugares e sua turma','Em Arenas, acompanhe os lugares onde você joga. Em Pessoas, filtre por arena e modalidade. Em Meus jogos, registre uma partida que já aconteceu: esse registro é privado e só vira publicação se você decidir compartilhar.',3);

create function pico_private.protect_pico_community() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 if exists(select 1 from pico_private.pico_community where community_id=old.id)
 and (new.owner_id is not null or new.status<>'active' or new.visibility<>'beta' or new.entry_mode<>'open' or new.slug<>old.slug or new.name<>old.name)
 then raise check_violation using message='Institutional community identity is protected'; end if;
 return new;
end; $$;
revoke all on function pico_private.protect_pico_community() from public,anon,authenticated;
create trigger protect_pico_community before update on public.communities for each row execute function pico_private.protect_pico_community();
create function pico_private.protect_pico_link() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 if exists(select 1 from pico_private.pico_community where community_id=new.community_id) then raise check_violation; end if;
 return new;
end; $$;
revoke all on function pico_private.protect_pico_link() from public,anon,authenticated;
create trigger protect_pico_link before insert or update on public.community_arena_links for each row execute function pico_private.protect_pico_link();

-- Locks the caller profile: completion, concurrent login and repeated requests
-- cannot enroll twice. Existing membership (including removal/suspension) wins.
create function public.ensure_pico_membership() returns void
language plpgsql security definer set search_path='' as $$
declare caller uuid:=auth.uid(); c uuid;
begin
 if not pico_private.active_account() then raise insufficient_privilege; end if;
 perform 1 from public.profiles where id=caller and onboarding_completed for update;
 if not found or not exists(select 1 from public.player_sports where player_id=caller and is_primary) then return; end if;
 select community_id into c from pico_private.pico_community;
 if exists(select 1 from pico_private.pico_welcomes where player_id=caller) then return; end if;
 insert into public.community_members(community_id,player_id,status) values(c,caller,'active') on conflict do nothing;
 if found then
  insert into pico_private.pico_welcomes(player_id,community_id) values(caller,c);
  insert into pico_private.audit_events(actor_id,action,scope_id) values(caller,'pico.auto_join',c);
 end if;
end; $$;
create function public.pico_welcome(p_acknowledge boolean default false) returns jsonb
language plpgsql security definer set search_path='' as $$
begin
 if not pico_private.active_account() then raise insufficient_privilege; end if;
 if p_acknowledge then update pico_private.pico_welcomes set acknowledged_at=coalesce(acknowledged_at,now()) where player_id=auth.uid(); end if;
 return (select jsonb_build_object('id',c.id,'slug',c.slug,'name',c.name,'pending',w.acknowledged_at is null)
 from pico_private.pico_welcomes w join public.communities c on c.id=w.community_id
 join public.community_members m on m.community_id=c.id and m.player_id=w.player_id
 where w.player_id=auth.uid() and m.status='active');
end; $$;
revoke all on function public.ensure_pico_membership(),public.pico_welcome(boolean) from public,anon,authenticated;
grant execute on function public.ensure_pico_membership(),public.pico_welcome(boolean) to authenticated;
create or replace function pico_private.community_rank(p_id uuid) returns integer language sql stable security definer set search_path='' as $$
 select case when not pico_private.active_account() then 0 when exists(select 1 from public.communities where id=p_id and owner_id=auth.uid()) then 40 when exists(select 1 from pico_private.pico_community where community_id=p_id) and pico_private.platform_role()='admin' then 40 when exists(select 1 from pico_private.pico_community where community_id=p_id) and pico_private.platform_role()='moderator' then 20 else coalesce((select case role when 'admin' then 30 when 'moderator' then 20 else 10 end from public.community_members where community_id=p_id and player_id=auth.uid() and status='active'),0) end;
$$;
create or replace function public.community_directory(p_search text default '',p_mine boolean default false,p_offset integer default 0,p_arena uuid default null) returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
 if not pico_private.active_account() then raise insufficient_privilege; end if;
 if p_offset<0 or p_offset>10000 or char_length(p_search)>100 then raise check_violation; end if;
 return coalesce((select jsonb_agg(row_to_json(q)) from(select c.id,c.slug,c.name,c.visibility,c.entry_mode,exists(select 1 from pico_private.pico_community where community_id=c.id) pico_official,
  (select status from public.community_members where community_id=c.id and player_id=auth.uid()) membership,
  (select a.name from public.community_arena_links l join public.arenas a on a.id=l.arena_id where l.community_id=c.id and l.status='approved') arena_name,
  (select l.is_official from public.community_arena_links l where l.community_id=c.id and l.status='approved') is_official,
  case when pico_private.can_read_community(c.id) then c.description else null end description
  from public.communities c where c.status='active' and (not p_mine or pico_private.community_rank(c.id)>=10)
  and (p_arena is null or exists(select 1 from public.community_arena_links l where l.community_id=c.id and l.arena_id=p_arena and l.status='approved'))
  and c.name ilike '%'||p_search||'%' order by pico_official desc,c.name,c.id limit 21 offset p_offset)q),'[]'::jsonb);
end;
$$;
create or replace function public.community_page(p_slug text) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare c public.communities;readable boolean;membership text;
begin
 if not pico_private.active_account() then raise insufficient_privilege; end if;
 select * into c from public.communities where slug=p_slug;
 if c.id is null or (c.status='archived' and pico_private.community_rank(c.id)=0) then return null; end if;
 readable:=pico_private.can_read_community(c.id);select status into membership from public.community_members where community_id=c.id and player_id=auth.uid();
 return jsonb_build_object('id',c.id,'slug',c.slug,'name',c.name,'entry_mode',c.entry_mode,'visibility',c.visibility,'membership',membership,'rank',pico_private.community_rank(c.id),'readable',readable,'version',c.version,'pico_official',exists(select 1 from pico_private.pico_community where community_id=c.id),
 'editorial',case when readable and exists(select 1 from pico_private.pico_community where community_id=c.id) then (select jsonb_agg(row_to_json(q)) from(select id,title,body,published_at from pico_private.pico_editorial order by position)q) else '[]'::jsonb end,
 'description',case when readable then c.description end,'rules',case when readable then c.rules end,
 'avatar_path',case when readable then c.avatar_path end,'cover_path',case when readable then c.cover_path end,
 'sports',case when readable then coalesce((select jsonb_agg(jsonb_build_object('id',s.id,'name',s.name,'slug',s.slug)) from public.community_sports x join public.sports s on s.id=x.sport_id where x.community_id=c.id),'[]'::jsonb) else '[]'::jsonb end,
 'owner',case when readable and pico_private.can_see_player(c.owner_id) then (select jsonb_build_object('id',id,'name',display_name,'username',username) from public.profiles where id=c.owner_id) end,
 'members',case when readable then coalesce((select jsonb_agg(row_to_json(q)) from(select m.player_id id,p.display_name name,p.username,case when c.owner_id=m.player_id then 'owner' else m.role end role,m.status from public.community_members m join public.profiles p on p.id=m.player_id where m.community_id=c.id and pico_private.can_see_player(p.id) and (m.status='active' or pico_private.community_rank(c.id)>=20 or m.player_id=auth.uid()) order by m.created_at limit 100)q),'[]'::jsonb) else '[]'::jsonb end,
 'arena', (select jsonb_build_object('id',a.id,'name',a.name,'slug',a.slug,'official',l.is_official,'status',l.status) from public.community_arena_links l join public.arenas a on a.id=l.arena_id where l.community_id=c.id and (l.status='approved' or pico_private.community_rank(c.id)>=30)));
end;
$$;
create or replace function public.save_profile(p_name text, p_username text, p_bio text, p_city text,
  p_neighborhood text, p_sport_id uuid, p_level public.player_level, p_available boolean)
returns void language plpgsql security invoker set search_path = '' as $$
declare caller uuid := auth.uid();
begin
  if caller is null then raise insufficient_privilege using message = 'Authentication required'; end if;
  perform 1 from public.profiles where id = caller for update;
  if not found then raise foreign_key_violation using message = 'Profile missing'; end if;
  if p_sport_id is null or p_level is null or p_available is null then
    raise check_violation using message = 'Profile incomplete';
  end if;
  update public.profiles set display_name = btrim(p_name), username = lower(btrim(p_username)),
    bio = btrim(p_bio), city = btrim(p_city), neighborhood = btrim(p_neighborhood),
    available = p_available, onboarding_completed = true where id = caller;
  update public.player_sports set is_primary = false where player_id = caller and is_primary;
  insert into public.player_sports(player_id, sport_id, level, is_primary)
    values (caller, p_sport_id, p_level, true)
    on conflict (player_id, sport_id) do update set level = excluded.level, is_primary = true;
  perform public.ensure_pico_membership();
end;
$$;
create or replace function public.accept_beta_invite(p_token text) returns jsonb language plpgsql security definer set search_path='' as $$
declare invite pico_private.invitations; recipient text;
begin
 if auth.uid() is null or char_length(p_token)<>64 then raise insufficient_privilege; end if;
 perform 1 from pico_private.beta_admissions where player_id=auth.uid() and status in ('revoked','suspended');
 if found then raise insufficient_privilege; end if;
 select lower(email) into recipient from auth.users where id=auth.uid() and email_confirmed_at is not null;
 select * into invite from pico_private.invitations where token_hash=encode(sha256(convert_to(p_token,'UTF8')),'hex') and kind='beta' for update;
 if invite.id is null or invite.email is distinct from recipient or invite.expires_at<=now() or invite.revoked_at is not null or invite.accepted_at is not null then raise insufficient_privilege; end if;
 update pico_private.invitations set accepted_at=now(),accepted_by=auth.uid() where id=invite.id;
 insert into pico_private.beta_admissions(player_id,status) values(auth.uid(),'approved') on conflict(player_id) do nothing;
 insert into pico_private.audit_events(actor_id,action,target_id) values(auth.uid(),'beta.accept',invite.id);
 return jsonb_build_object('accepted',true);
end;
$$;
commit;
