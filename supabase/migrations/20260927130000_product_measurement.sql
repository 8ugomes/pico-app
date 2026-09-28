begin;

-- Bootstrap authority is the exact out-of-band UID supplied through the
-- environment-guarded service-role operation. With auto-confirm enabled,
-- email_confirmed_at is an Auth implementation timestamp, not identity proof.
create or replace function public.bootstrap_operator(p_uid uuid) returns void
language plpgsql security definer set search_path='' as $$
begin
  perform pg_advisory_xact_lock(918273645);
  if p_uid is null or not exists(select 1 from auth.users where id=p_uid) then raise insufficient_privilege; end if;
  if exists(select 1 from pico_private.platform_grants where role='admin' and player_id<>p_uid)
    then raise insufficient_privilege; end if;
  insert into pico_private.beta_admissions(player_id,status) values(p_uid,'approved')
    on conflict(player_id) do update set status='approved',updated_at=now();
  insert into pico_private.platform_grants(player_id,role) values(p_uid,'admin')
    on conflict(player_id) do update set role='admin';
  insert into pico_private.audit_events(actor_id,action,target_id) values(null,'operator.bootstrap',p_uid);
end;
$$;
revoke all on function public.bootstrap_operator(uuid) from public,anon,authenticated;
grant execute on function public.bootstrap_operator(uuid) to service_role;

-- Collection stays closed unless policy approval, retention maintenance and a
-- request-edge heartbeat from the expected deployed release are all healthy.
create table pico_private.product_measurement_settings (
  singleton boolean primary key default true check (singleton),
  enabled boolean not null default false,
  retention_days integer check (retention_days between 1 and 365),
  reporting_timezone text not null default 'America/Sao_Paulo' check (reporting_timezone = 'America/Sao_Paulo'),
  approved_at timestamptz,
  approved_by uuid,
  collection_started_at timestamptz,
  first_enabled_at timestamptz,
  expected_edge_release text check (expected_edge_release is null or (
    char_length(expected_edge_release) between 7 and 80
    and expected_edge_release ~ '^[A-Za-z0-9._-]+$'
    and expected_edge_release <> 'unknown'
  )),
  purge_verified_at timestamptz,
  purge_verified_by uuid,
  purge_max_age_hours integer not null default 26 check (purge_max_age_hours between 1 and 48),
  last_purged_at timestamptz,
  check (not enabled or (
    retention_days is not null and approved_at is not null and approved_by is not null
    and collection_started_at is not null and first_enabled_at is not null and expected_edge_release is not null
    and purge_verified_at is not null and purge_verified_by is not null and last_purged_at is not null
    and collection_started_at >= greatest(approved_at, purge_verified_at)
  ))
);
insert into pico_private.product_measurement_settings(singleton) values (true);

-- A short lease proves that the request-edge producer is alive and running the
-- same protocol as this schema. It is operational state only: no player,
-- request, device or network identifier is retained.
create table pico_private.product_measurement_edge_state (
  singleton boolean primary key default true check (singleton),
  configured_enabled boolean not null default false,
  protocol_version smallint,
  release text check (release is null or (
    char_length(release) between 7 and 80 and release ~ '^[A-Za-z0-9._-]+$' and release <> 'unknown'
  )),
  heartbeat_at timestamptz,
  lease_until timestamptz,
  check ((heartbeat_at is null) = (lease_until is null)),
  check (protocol_version is null or protocol_version = 1)
);
insert into pico_private.product_measurement_edge_state(singleton) values (true);

create table pico_private.product_measurement_gaps (
  id bigint generated always as identity primary key,
  started_at timestamptz not null,
  ended_at timestamptz,
  source text not null default 'database' check (source in ('database','request_edge')),
  reason text not null check (reason in (
    'disabled','retention_heartbeat','request_edge_disabled','request_edge_heartbeat','request_edge_failure'
  )),
  check (ended_at is null or ended_at >= started_at),
  check ((source='database' and reason in ('disabled','retention_heartbeat'))
    or (source='request_edge' and reason in ('request_edge_disabled','request_edge_heartbeat','request_edge_failure')))
);
create unique index product_measurement_one_open_gap
  on pico_private.product_measurement_gaps(source) where ended_at is null;

create function pico_private.guard_measurement_settings() returns trigger
language plpgsql security definer set search_path = '' as $$
declare now_at timestamptz:=clock_timestamp();
begin
  if tg_op='UPDATE' and old.collection_started_at is not null
    and (new.collection_started_at is distinct from old.collection_started_at
      or new.approved_at is distinct from old.approved_at
      or new.approved_by is distinct from old.approved_by
      or new.purge_verified_at is distinct from old.purge_verified_at
      or new.purge_verified_by is distinct from old.purge_verified_by
      or new.first_enabled_at is distinct from old.first_enabled_at
      or ((old.enabled or new.enabled) and old.expected_edge_release is not null
        and new.expected_edge_release is distinct from old.expected_edge_release)
      or new.reporting_timezone is distinct from old.reporting_timezone
      or new.retention_days is null
      or (old.retention_days is not null and new.retention_days > old.retention_days)
      or new.purge_max_age_hours > old.purge_max_age_hours) then
    raise check_violation using message = 'Measurement approval, start, timezone and retained history cannot be rewritten';
  end if;
  if new.enabled and (tg_op='INSERT' or not old.enabled) and not exists(
    select 1 from pico_private.product_measurement_edge_state
    where singleton and configured_enabled and protocol_version=1
      and release=new.expected_edge_release and lease_until>now_at
  ) then
    raise check_violation using message = 'Request-edge measurement heartbeat is not healthy';
  end if;
  if new.enabled and (tg_op='INSERT' or old.first_enabled_at is null) then
    if new.collection_started_at<now_at then
      insert into pico_private.product_measurement_gaps(started_at,ended_at,source,reason)
        values(new.collection_started_at,now_at,'database','disabled');
    end if;
    new.first_enabled_at:=now_at;
  end if;
  if tg_op='UPDATE' and old.enabled and not new.enabled then
    insert into pico_private.product_measurement_gaps(started_at,source,reason)
      values(clock_timestamp(),'database','disabled') on conflict do nothing;
  elsif tg_op='UPDATE' and not old.enabled and new.enabled and old.collection_started_at is not null then
    update pico_private.product_measurement_gaps set ended_at=clock_timestamp()
      where source='database' and ended_at is null;
  end if;
  return new;
end;
$$;
revoke all on function pico_private.guard_measurement_settings() from public, anon, authenticated;
create trigger guard_measurement_settings before insert or update on pico_private.product_measurement_settings
  for each row execute function pico_private.guard_measurement_settings();

create table pico_private.product_measurement_exclusions (
  player_id uuid primary key references public.profiles(id) on delete cascade,
  reason text not null check (reason in ('test', 'institutional', 'support')),
  created_at timestamptz not null default clock_timestamp()
);

-- Only invitation events retain a context UUID, protected by a real FK.
-- Discovery and sharing are categorical/day-level and cannot retain another
-- person's or deleted resource's identifier.
create table pico_private.product_events (
  id bigint generated always as identity primary key,
  actor_id uuid not null references public.profiles(id) on delete cascade,
  event_type text not null check (event_type in (
    'profile_completed', 'discovery_opened', 'return_active', 'share_prepared', 'invitation_opened', 'social_activated'
  )),
  context_type text check (context_type in ('profile', 'arena', 'community', 'post', 'invitation')),
  context_id uuid references pico_private.invitations(id) on delete cascade,
  event_key text not null check (char_length(event_key) between 1 and 120 and event_key ~ '^[a-z0-9:_-]+$'),
  occurred_at timestamptz not null default clock_timestamp(),
  unique (actor_id, event_type, event_key),
  check (
    (event_type = 'return_active' and context_type is null and context_id is null)
    or (event_type = 'profile_completed' and context_type is null and context_id is null)
    or (event_type = 'discovery_opened' and context_type = 'profile' and context_id is null)
    or (event_type = 'share_prepared' and context_type in ('profile','arena','community','post') and context_id is null)
    or (event_type = 'invitation_opened' and context_type = 'invitation' and context_id is not null)
    or (event_type = 'social_activated' and context_type is null and context_id is null)
  )
);
create index product_events_period on pico_private.product_events(event_type, occurred_at, actor_id);
create index product_events_context on pico_private.product_events(context_type, context_id, occurred_at);

revoke all on pico_private.product_measurement_settings,
  pico_private.product_measurement_edge_state,
  pico_private.product_measurement_gaps,
  pico_private.product_measurement_exclusions,
  pico_private.product_events from public, anon, authenticated;

create function pico_private.product_measurement_enabled() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce((select s.enabled
    and s.retention_days is not null
    and s.approved_at is not null and s.approved_at <= clock_timestamp()
    and s.approved_by is not null
    and s.collection_started_at is not null and s.collection_started_at <= clock_timestamp()
    and s.first_enabled_at is not null and s.expected_edge_release is not null
    and s.purge_verified_at is not null and s.purge_verified_at <= clock_timestamp()
    and s.purge_verified_by is not null
    and s.last_purged_at is not null and s.last_purged_at <= clock_timestamp()
    and s.last_purged_at >= clock_timestamp() - make_interval(hours => s.purge_max_age_hours)
    and e.configured_enabled and e.protocol_version=1 and e.release=s.expected_edge_release
    and e.lease_until>clock_timestamp()
    from pico_private.product_measurement_settings s
    cross join pico_private.product_measurement_edge_state e
    where s.singleton and e.singleton), false);
$$;

-- Writers take a shared lock on the singleton setting row before persisting an
-- event. Disabling collection or running retention maintenance needs an
-- exclusive row lock, so once either operation returns there cannot still be a
-- previously-approved event waiting to commit.
create function pico_private.product_measurement_write_allowed() returns boolean
language plpgsql volatile security definer set search_path = '' as $$
declare
  setting pico_private.product_measurement_settings;
  edge_state pico_private.product_measurement_edge_state;
begin
  select * into setting from pico_private.product_measurement_settings
    where singleton for share;
  select * into edge_state from pico_private.product_measurement_edge_state
    where singleton for share;
  return coalesce(setting.enabled
    and setting.retention_days is not null
    and setting.approved_at is not null and setting.approved_at <= clock_timestamp()
    and setting.approved_by is not null
    and setting.collection_started_at is not null and setting.collection_started_at <= clock_timestamp()
    and setting.first_enabled_at is not null and setting.expected_edge_release is not null
    and setting.purge_verified_at is not null and setting.purge_verified_at <= clock_timestamp()
    and setting.purge_verified_by is not null
    and setting.last_purged_at is not null and setting.last_purged_at <= clock_timestamp()
    and setting.last_purged_at >= clock_timestamp() - make_interval(hours => setting.purge_max_age_hours)
    and edge_state.configured_enabled and edge_state.protocol_version=1
    and edge_state.release=setting.expected_edge_release
    and edge_state.lease_until>clock_timestamp(), false);
end;
$$;

create function pico_private.product_person_eligible(p_player uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select p_player is not null
    and exists(select 1 from public.profiles p where p.id = p_player and not p.is_demo)
    and exists(select 1 from auth.users u where u.id = p_player)
    and exists(select 1 from pico_private.beta_admissions a where a.player_id = p_player and a.status = 'approved')
    and not exists(select 1 from public.account_deletions d where d.player_id = p_player)
    and not exists(select 1 from pico_private.product_measurement_exclusions x where x.player_id = p_player);
$$;

revoke all on function pico_private.product_measurement_enabled(),
  pico_private.product_measurement_write_allowed(),
  pico_private.product_person_eligible(uuid) from public, anon, authenticated;

create function public.heartbeat_product_measurement_edge(
  p_collecting boolean,
  p_protocol smallint,
  p_release text
) returns boolean
language plpgsql security definer set search_path = '' as $$
declare
  setting pico_private.product_measurement_settings;
  edge_state pico_private.product_measurement_edge_state;
  now_at timestamptz:=clock_timestamp();
begin
  if p_collecting is null or p_protocol is distinct from 1 or p_release is null
    or char_length(p_release) not between 7 and 80 or p_release !~ '^[A-Za-z0-9._-]+$'
    or p_release='unknown' then raise check_violation; end if;
  select * into setting from pico_private.product_measurement_settings
    where singleton for share;
  select * into edge_state from pico_private.product_measurement_edge_state
    where singleton for update;
  if setting.singleton is null or edge_state.singleton is null then raise check_violation; end if;
  -- Preserve a missed interval before any state transition overwrites the old
  -- lease, including a disabled heartbeat or an explicit failure marker.
  if setting.collection_started_at<=now_at
    and edge_state.configured_enabled and edge_state.lease_until is not null
    and edge_state.lease_until<now_at
    and not exists(select 1 from pico_private.product_measurement_gaps
      where source='request_edge' and ended_at is null) then
    insert into pico_private.product_measurement_gaps(started_at,ended_at,source,reason)
      values(greatest(setting.collection_started_at,edge_state.lease_until),now_at,
        'request_edge','request_edge_heartbeat');
  end if;

  if setting.expected_edge_release is not null and p_release<>setting.expected_edge_release then
    if setting.enabled and setting.collection_started_at<=now_at then
      insert into pico_private.product_measurement_gaps(started_at,source,reason)
        values(now_at,'request_edge','request_edge_failure') on conflict do nothing;
    end if;
    update pico_private.product_measurement_edge_state set
      configured_enabled=false,protocol_version=p_protocol,release=p_release,
      heartbeat_at=now_at,lease_until=now_at
      where singleton;
    return false;
  end if;

  if not p_collecting then
    if setting.enabled and setting.collection_started_at<=now_at then
      insert into pico_private.product_measurement_gaps(started_at,source,reason)
        values(now_at,'request_edge','request_edge_disabled') on conflict do nothing;
    end if;
    update pico_private.product_measurement_edge_state set
      configured_enabled=false,protocol_version=p_protocol,release=p_release,
      heartbeat_at=now_at,lease_until=now_at
      where singleton;
    return true;
  end if;
  update pico_private.product_measurement_gaps set ended_at=now_at
    where source='request_edge' and ended_at is null;
  update pico_private.product_measurement_edge_state set
    configured_enabled=true,protocol_version=p_protocol,release=p_release,heartbeat_at=now_at,
    lease_until=now_at+interval '15 minutes'
    where singleton;
  return true;
end;
$$;

create function public.mark_product_measurement_edge_failure() returns void
language plpgsql security definer set search_path = '' as $$
declare
  setting pico_private.product_measurement_settings;
  edge_state pico_private.product_measurement_edge_state;
  now_at timestamptz:=clock_timestamp();
begin
  select * into setting from pico_private.product_measurement_settings
    where singleton for share;
  select * into edge_state from pico_private.product_measurement_edge_state
    where singleton for update;
  if setting.singleton is null or edge_state.singleton is null then raise check_violation; end if;
  if setting.collection_started_at<=now_at
    and edge_state.configured_enabled and edge_state.lease_until is not null
    and edge_state.lease_until<now_at
    and not exists(select 1 from pico_private.product_measurement_gaps
      where source='request_edge' and ended_at is null) then
    insert into pico_private.product_measurement_gaps(started_at,ended_at,source,reason)
      values(greatest(setting.collection_started_at,edge_state.lease_until),now_at,
        'request_edge','request_edge_heartbeat');
  end if;
  if setting.enabled and setting.collection_started_at<=now_at then
    insert into pico_private.product_measurement_gaps(started_at,source,reason)
      values(now_at,'request_edge','request_edge_failure') on conflict do nothing;
  end if;
  update pico_private.product_measurement_edge_state
    set heartbeat_at=now_at,lease_until=now_at where singleton;
end;
$$;
revoke all on function public.heartbeat_product_measurement_edge(boolean,smallint,text),
  public.mark_product_measurement_edge_failure() from public, anon, authenticated;
grant execute on function public.heartbeat_product_measurement_edge(boolean,smallint,text),
  public.mark_product_measurement_edge_failure() to service_role;

-- Completion timing is private, retention-bound measurement. The public
-- profile remains mutable and gains no analytics-only column.
create function pico_private.record_profile_completion() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.onboarding_completed
    and (tg_op='INSERT' or old.onboarding_completed is distinct from true)
    and pico_private.product_measurement_write_allowed()
    and pico_private.product_person_eligible(new.id) then
    insert into pico_private.product_events(actor_id,event_type,event_key)
      values(new.id,'profile_completed','first')
      on conflict(actor_id,event_type,event_key) do nothing;
  end if;
  return new;
end;
$$;
revoke all on function pico_private.record_profile_completion() from public, anon, authenticated;
create trigger record_profile_completion after insert or update of onboarding_completed on public.profiles
  for each row execute function pico_private.record_profile_completion();

-- Social activation is the first mutual connection observed while collection
-- is approved. It is derived inside the database, stores no peer identifier and
-- is never backfilled from relationships that predate the collection window.
create function pico_private.record_social_activation() returns trigger
language plpgsql security definer set search_path = '' as $$
declare event_time timestamptz;
begin
  if not pico_private.product_measurement_enabled() then return new; end if;
  -- The transaction-level pair lock is acquired before checking the reverse
  -- row. Concurrent A→B/B→A inserts therefore serialize; the waiter checks
  -- again after the first transaction commits instead of losing both events.
  perform pg_advisory_xact_lock(hashtextextended(
    'pico.measurement.social:'||least(new.follower_id,new.followed_id)::text||':'||
      greatest(new.follower_id,new.followed_id)::text,0));
  if pico_private.product_measurement_write_allowed()
    and pico_private.product_person_eligible(new.follower_id)
    and pico_private.product_person_eligible(new.followed_id)
    and exists(select 1 from public.connections
      where follower_id=new.followed_id and followed_id=new.follower_id) then
    event_time:=clock_timestamp();
    insert into pico_private.product_events(actor_id,event_type,event_key,occurred_at)
      values
        (new.follower_id,'social_activated','first',event_time),
        (new.followed_id,'social_activated','first',event_time)
      on conflict(actor_id,event_type,event_key) do nothing;
  end if;
  return new;
end;
$$;
revoke all on function pico_private.record_social_activation() from public, anon, authenticated;
create trigger record_social_activation after insert on public.connections
  for each row execute function pico_private.record_social_activation();

-- Scope invitations bind to an already-existing Pico account. An auto-filled
-- Auth email timestamp is not treated as proof of mailbox ownership.
alter table pico_private.invitations
  alter column email drop not null,
  add column recipient_id uuid references public.profiles(id) on delete cascade;
alter table pico_private.invitations add constraint invitations_recipient_binding check (
  (kind='beta' and email is not null and recipient_id is null)
  or (kind in ('arena','community') and (email is not null or recipient_id is not null))
);
create index invitations_recipient_account on pico_private.invitations(recipient_id, kind, expires_at);
create index invitations_scope_listing on pico_private.invitations(kind, scope_id, created_at desc, id desc);

-- Scope invitations and bilateral blocks share one pair lock. The block
-- trigger rechecks first and the invitation paths recheck after acquiring it,
-- so a concurrent block either wins and prevents the invitation or follows it
-- and immediately makes the invitation unavailable.
create or replace function pico_private.lock_direct_relationship() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  perform pico_private.lock_direct_people(new.blocker_id, new.blocked_id);
  perform pg_advisory_xact_lock(hashtextextended(
    'pico.relationship:'||least(new.blocker_id,new.blocked_id)::text||':'||
      greatest(new.blocker_id,new.blocked_id)::text,0));
  perform follower_id from public.connections
    where (follower_id = new.blocker_id and followed_id = new.blocked_id)
      or (follower_id = new.blocked_id and followed_id = new.blocker_id)
    order by follower_id, followed_id for update;
  return new;
end;
$$;
revoke all on function pico_private.lock_direct_relationship() from public, anon, authenticated;

-- Centralize current-state revalidation so preview, acceptance and measurement
-- cannot disagree after a scope is archived, an issuer loses authority, a
-- recipient is suspended, or an invitation expires/revokes/is consumed.
create function pico_private.scope_invitation_available(p_invitation uuid, p_recipient uuid) returns boolean
language plpgsql stable security definer set search_path = '' as $$
declare invite pico_private.invitations; issuer_rank integer;
begin
  if p_invitation is null or p_recipient is null then return false; end if;
  select * into invite from pico_private.invitations where id=p_invitation
    and kind in ('arena','community') and recipient_id=p_recipient
    and created_by is not null and created_by<>p_recipient
    and expires_at>statement_timestamp() and revoked_at is null and accepted_at is null;
  if invite.id is null
    or not exists(select 1 from auth.users where id=p_recipient)
    or not exists(select 1 from public.profiles where id=p_recipient and not is_demo)
    or not exists(select 1 from pico_private.beta_admissions where player_id=p_recipient and status='approved')
    or exists(select 1 from public.account_deletions where player_id=p_recipient)
    or not exists(select 1 from auth.users where id=invite.created_by)
    or not exists(select 1 from pico_private.beta_admissions where player_id=invite.created_by and status='approved')
    or exists(select 1 from public.account_deletions where player_id=invite.created_by)
    or exists(select 1 from public.blocks where
      (blocker_id=p_recipient and blocked_id=invite.created_by)
      or (blocked_id=p_recipient and blocker_id=invite.created_by))
  then return false; end if;

  if invite.kind='arena' then
    select case
      when exists(select 1 from pico_private.platform_grants where player_id=invite.created_by and role='admin') then 50
      when owner_id=invite.created_by then 40
      else coalesce((select case role when 'admin' then 30 else 20 end
        from public.arena_staff where arena_id=invite.scope_id and player_id=invite.created_by),0)
      end into issuer_rank from public.arenas where id=invite.scope_id and status='active';
    return coalesce(coalesce(issuer_rank,0)>=30 and invite.role in ('admin','moderator')
      and (invite.role<>'admin' or issuer_rank>=40)
      and not exists(select 1 from public.arenas where id=invite.scope_id and owner_id=p_recipient)
      and not exists(select 1 from public.arena_members
        where arena_id=invite.scope_id and player_id in (p_recipient,invite.created_by) and status='suspended'),false);
  end if;

  select case
    when owner_id=invite.created_by then 40
    when exists(select 1 from pico_private.pico_community where community_id=invite.scope_id)
      and exists(select 1 from pico_private.platform_grants
        where player_id=invite.created_by and role='admin') then 40
    when exists(select 1 from pico_private.pico_community where community_id=invite.scope_id)
      and exists(select 1 from pico_private.platform_grants
        where player_id=invite.created_by and role='moderator') then 20
    else coalesce((select case role when 'admin' then 30 when 'moderator' then 20 else 10 end
      from public.community_members where community_id=invite.scope_id
        and player_id=invite.created_by and status='active'),0)
    end into issuer_rank from public.communities where id=invite.scope_id and status='active';
  return coalesce(coalesce(issuer_rank,0)>=20 and invite.role='member'
    and not exists(select 1 from public.community_members
      where community_id=invite.scope_id
        and (player_id=p_recipient and status in ('active','suspended')
          or player_id=invite.created_by and status='suspended')),false);
end;
$$;
revoke all on function pico_private.scope_invitation_available(uuid,uuid) from public, anon, authenticated;

-- The caller cannot provide an idempotency payload. Keys are derived entirely
-- from server time and validated categorical context.
create function public.record_product_event(
  p_actor uuid,
  p_event_type text,
  p_release text,
  p_context_type text default null,
  p_context_id uuid default null
) returns boolean
language plpgsql security definer set search_path = '' as $$
declare
  event_time timestamptz:=clock_timestamp();
  local_day text;
  derived_key text;
  setting pico_private.product_measurement_settings;
  edge_state pico_private.product_measurement_edge_state;
begin
  if p_release is null or char_length(p_release) not between 7 and 80
    or p_release !~ '^[A-Za-z0-9._-]+$' or p_release='unknown' then raise check_violation; end if;
  select * into setting from pico_private.product_measurement_settings where singleton for share;
  select * into edge_state from pico_private.product_measurement_edge_state where singleton for update;
  if setting.singleton is null or edge_state.singleton is null then raise check_violation; end if;
  if p_release is distinct from setting.expected_edge_release
    or p_release is distinct from edge_state.release then
    if setting.collection_started_at<=event_time
      and edge_state.configured_enabled and edge_state.lease_until is not null
      and edge_state.lease_until<event_time
      and not exists(select 1 from pico_private.product_measurement_gaps
        where source='request_edge' and ended_at is null) then
      insert into pico_private.product_measurement_gaps(started_at,ended_at,source,reason)
        values(greatest(setting.collection_started_at,edge_state.lease_until),event_time,
          'request_edge','request_edge_heartbeat');
    end if;
    if setting.enabled and setting.collection_started_at<=event_time then
      insert into pico_private.product_measurement_gaps(started_at,source,reason)
        values(event_time,'request_edge','request_edge_failure') on conflict do nothing;
    end if;
    update pico_private.product_measurement_edge_state set
      configured_enabled=false,heartbeat_at=event_time,lease_until=event_time where singleton;
    return false;
  end if;
  if not pico_private.product_measurement_write_allowed() then return false; end if;
  if not pico_private.product_person_eligible(p_actor) then return false; end if;
  select to_char(event_time at time zone reporting_timezone, 'YYYY-MM-DD') into local_day
    from pico_private.product_measurement_settings where singleton;

  if p_event_type = 'return_active' then
    if p_context_type is not null or p_context_id is not null then raise check_violation; end if;
    derived_key := local_day;
  elsif p_event_type = 'discovery_opened' then
    if p_context_type is distinct from 'profile' or p_context_id is not null then raise check_violation; end if;
    derived_key := local_day;
  elsif p_event_type = 'share_prepared' then
    if p_context_type is null or p_context_type not in ('profile','arena','community','post') or p_context_id is not null then raise check_violation; end if;
    derived_key := p_context_type || ':' || local_day;
  elsif p_event_type = 'invitation_opened' then
    if p_context_type is distinct from 'invitation' or p_context_id is null
      or pico_private.scope_invitation_available(p_context_id,p_actor) is distinct from true then raise check_violation; end if;
    derived_key := p_context_id::text;
  else
    raise check_violation;
  end if;

  insert into pico_private.product_events(actor_id,event_type,context_type,context_id,event_key,occurred_at)
    values(p_actor,p_event_type,p_context_type,p_context_id,derived_key,event_time)
    on conflict(actor_id,event_type,event_key) do nothing;
  return found;
end;
$$;

create function pico_private.available_scope_invitation(p_kind text, p_token text) returns uuid
language plpgsql stable security definer set search_path = '' as $$
declare invite_id uuid;
begin
  if p_kind not in ('arena','community') or p_token is null or char_length(p_token) <> 64
    or p_token !~ '^[a-f0-9]{64}$' or auth.uid() is null
    or not exists(select 1 from auth.users where id=auth.uid())
    or not exists(select 1 from public.profiles where id=auth.uid() and not is_demo)
    or not exists(select 1 from pico_private.beta_admissions where player_id=auth.uid() and status='approved')
    or exists(select 1 from public.account_deletions where player_id=auth.uid())
  then raise insufficient_privilege; end if;
  select id into invite_id from pico_private.invitations where kind = p_kind
    and token_hash = encode(sha256(convert_to(p_token,'UTF8')),'hex')
    and recipient_id = auth.uid();
  if pico_private.scope_invitation_available(invite_id,auth.uid()) is distinct from true then raise insufficient_privilege; end if;
  return invite_id;
end;
$$;
revoke all on function pico_private.available_scope_invitation(text,text) from public, anon, authenticated;

create function public.invite_arena_player(p_arena uuid,p_username text,p_role text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare rank integer; token text; result uuid; recipient uuid;
begin
  perform pico_private.consume_write('invites',20,86400);
  perform 1 from public.arenas where id=p_arena and status='active' for update;
  rank:=pico_private.arena_rank(p_arena);
  if not found or rank<30 or p_role not in ('admin','moderator') or p_role is null or (p_role='admin' and rank<40)
    or p_username is null or p_username !~ '^[a-z0-9_]{3,40}$' then raise insufficient_privilege; end if;
  select p.id into recipient from public.profiles p
    join pico_private.beta_admissions a on a.player_id=p.id and a.status='approved'
    where p.username=lower(p_username) and not p.is_demo
      and exists(select 1 from auth.users u where u.id=p.id)
      and not exists(select 1 from public.account_deletions d where d.player_id=p.id)
      and not exists(select 1 from public.blocks b where
        (b.blocker_id=auth.uid() and b.blocked_id=p.id)
        or (b.blocked_id=auth.uid() and b.blocker_id=p.id))
      and not exists(select 1 from public.arenas a where a.id=p_arena and a.owner_id=p.id)
      and not exists(select 1 from public.arena_members m
        where m.arena_id=p_arena and m.player_id=p.id and m.status='suspended');
  if recipient is null or recipient=auth.uid() then raise insufficient_privilege; end if;
  perform pico_private.lock_direct_people(auth.uid(),recipient);
  perform pg_advisory_xact_lock(hashtextextended(
    'pico.relationship:'||least(auth.uid(),recipient)::text||':'||greatest(auth.uid(),recipient)::text,0));
  perform pg_advisory_xact_lock(hashtextextended('pico.scope_invite.arena:'||p_arena::text||':'||recipient::text,0));
  rank:=pico_private.arena_rank(p_arena);
  if rank<30 or (p_role='admin' and rank<40)
    or exists(select 1 from public.blocks b where
      (b.blocker_id=auth.uid() and b.blocked_id=recipient)
      or (b.blocked_id=auth.uid() and b.blocker_id=recipient))
    or exists(select 1 from public.arenas where id=p_arena and owner_id=recipient)
    or exists(select 1 from public.arena_members
      where arena_id=p_arena and player_id in (recipient,auth.uid()) and status='suspended')
    or not exists(select 1 from auth.users where id=recipient)
    or not exists(select 1 from pico_private.beta_admissions where player_id=recipient and status='approved')
    or exists(select 1 from public.account_deletions where player_id=recipient)
    or (rank<40 and exists(select 1 from pico_private.invitations
      where kind='arena' and scope_id=p_arena and recipient_id=recipient and role='admin'
        and accepted_at is null and revoked_at is null and expires_at>now()))
  then raise insufficient_privilege; end if;
  with revoked as (
    update pico_private.invitations set revoked_at=now()
      where kind='arena' and scope_id=p_arena and recipient_id=recipient
        and accepted_at is null and revoked_at is null and expires_at>now()
      returning id
  )
  insert into pico_private.audit_events(actor_id,action,scope_id,target_id)
    select auth.uid(),'arena.invite.revoke',p_arena,id from revoked;
  token:=replace(gen_random_uuid()::text,'-','')||replace(gen_random_uuid()::text,'-','');
  insert into pico_private.invitations(kind,scope_id,email,role,token_hash,created_by,expires_at,recipient_id)
    values('arena',p_arena,null,p_role,encode(sha256(convert_to(token,'UTF8')),'hex'),auth.uid(),now()+interval '7 days',recipient)
    returning id into result;
  insert into pico_private.audit_events(actor_id,action,scope_id,target_id) values(auth.uid(),'arena.invite',p_arena,result);
  return jsonb_build_object('id',result,'token',token,'username',lower(p_username));
end;
$$;

create function public.accept_arena_player_invite(p_token text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare invite pico_private.invitations;
begin
  if p_token is null or char_length(p_token)<>64 or p_token!~'^[a-f0-9]{64}$' or auth.uid() is null
    then raise insufficient_privilege; end if;
  -- Match the scope-first lock order used by arena administration. The second
  -- lookup locks and re-reads the invitation after the scope is serialized.
  select * into invite from pico_private.invitations where kind='arena'
    and token_hash=encode(sha256(convert_to(p_token,'UTF8')),'hex')
    and recipient_id=auth.uid();
  if invite.id is null then raise insufficient_privilege; end if;
  perform 1 from public.arenas where id=invite.scope_id for update;
  select * into invite from pico_private.invitations where id=invite.id
    and kind='arena' and recipient_id=auth.uid() for update;
  if invite.id is null or invite.revoked_at is not null then raise insufficient_privilege; end if;
  if invite.accepted_at is not null then
    if invite.accepted_by=auth.uid() then return invite.scope_id; end if;
    raise insufficient_privilege;
  end if;
  perform pico_private.lock_direct_people(auth.uid(),invite.created_by);
  perform pg_advisory_xact_lock(hashtextextended(
    'pico.relationship:'||least(auth.uid(),invite.created_by)::text||':'||
      greatest(auth.uid(),invite.created_by)::text,0));
  perform 1 from pico_private.beta_admissions
    where player_id in (auth.uid(),invite.created_by) order by player_id for update;
  perform 1 from pico_private.platform_grants
    where player_id=invite.created_by for update;
  perform 1 from public.arena_staff
    where arena_id=invite.scope_id and player_id=invite.created_by for update;
  perform 1 from public.arena_members
    where arena_id=invite.scope_id and player_id=auth.uid() for update;
  if pico_private.scope_invitation_available(invite.id,auth.uid()) is distinct from true
    then raise insufficient_privilege; end if;
  if exists(select 1 from public.arenas where id=invite.scope_id and owner_id=auth.uid()) then raise check_violation; end if;
  insert into public.arena_staff(arena_id,player_id,role) values(invite.scope_id,auth.uid(),invite.role)
    on conflict(arena_id,player_id) do update set role=case when arena_staff.role='admin' then 'admin' else excluded.role end;
  insert into public.arena_members(arena_id,player_id) values(invite.scope_id,auth.uid()) on conflict do nothing;
  update pico_private.invitations set accepted_at=now(),accepted_by=auth.uid()
    where id=invite.id;
  insert into pico_private.audit_events(actor_id,action,scope_id,target_id) values(auth.uid(),'arena.invite.accept',invite.scope_id,invite.id);
  return invite.scope_id;
end;
$$;

create function public.invite_community_player(p_id uuid,p_username text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare token text; result uuid; recipient uuid;
begin
  perform pico_private.consume_write('invites',20,86400);
  perform 1 from public.communities where id=p_id and status='active' for update;
  if not found or pico_private.community_rank(p_id)<20 or p_username is null or p_username !~ '^[a-z0-9_]{3,40}$' then raise insufficient_privilege; end if;
  select p.id into recipient from public.profiles p
    join pico_private.beta_admissions a on a.player_id=p.id and a.status='approved'
    where p.username=lower(p_username) and not p.is_demo
      and exists(select 1 from auth.users u where u.id=p.id)
      and not exists(select 1 from public.account_deletions d where d.player_id=p.id)
      and not exists(select 1 from public.blocks b where
        (b.blocker_id=auth.uid() and b.blocked_id=p.id)
        or (b.blocked_id=auth.uid() and b.blocker_id=p.id))
      and not exists(select 1 from public.community_members m
        where m.community_id=p_id and m.player_id=p.id and m.status in ('active','suspended'));
  if recipient is null or recipient=auth.uid() then raise insufficient_privilege; end if;
  perform pico_private.lock_direct_people(auth.uid(),recipient);
  perform pg_advisory_xact_lock(hashtextextended(
    'pico.relationship:'||least(auth.uid(),recipient)::text||':'||greatest(auth.uid(),recipient)::text,0));
  perform pg_advisory_xact_lock(hashtextextended('pico.scope_invite.community:'||p_id::text||':'||recipient::text,0));
  if pico_private.community_rank(p_id)<20
    or exists(select 1 from public.blocks b where
      (b.blocker_id=auth.uid() and b.blocked_id=recipient)
      or (b.blocked_id=auth.uid() and b.blocker_id=recipient))
    or exists(select 1 from public.community_members
      where community_id=p_id
        and (player_id=recipient and status in ('active','suspended')
          or player_id=auth.uid() and status='suspended'))
    or not exists(select 1 from auth.users where id=recipient)
    or not exists(select 1 from pico_private.beta_admissions where player_id=recipient and status='approved')
    or exists(select 1 from public.account_deletions where player_id=recipient)
  then raise insufficient_privilege; end if;
  with revoked as (
    update pico_private.invitations set revoked_at=now()
      where kind='community' and scope_id=p_id and recipient_id=recipient
        and accepted_at is null and revoked_at is null and expires_at>now()
      returning id
  )
  insert into pico_private.audit_events(actor_id,action,scope_id,target_id)
    select auth.uid(),'community.invite.revoke',p_id,id from revoked;
  token:=replace(gen_random_uuid()::text,'-','')||replace(gen_random_uuid()::text,'-','');
  insert into pico_private.invitations(kind,scope_id,email,role,token_hash,created_by,expires_at,recipient_id)
    values('community',p_id,null,'member',encode(sha256(convert_to(token,'UTF8')),'hex'),auth.uid(),now()+interval '7 days',recipient)
    returning id into result;
  insert into pico_private.audit_events(actor_id,action,scope_id,target_id) values(auth.uid(),'community.invite',p_id,result);
  return jsonb_build_object('id',result,'token',token,'username',lower(p_username));
end;
$$;

create function public.accept_community_player_invite(p_token text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare invite pico_private.invitations;
begin
  if p_token is null or char_length(p_token)<>64 or p_token!~'^[a-f0-9]{64}$' or auth.uid() is null
    then raise insufficient_privilege; end if;
  select * into invite from pico_private.invitations where kind='community'
    and token_hash=encode(sha256(convert_to(p_token,'UTF8')),'hex')
    and recipient_id=auth.uid();
  if invite.id is null then raise insufficient_privilege; end if;
  perform 1 from public.communities where id=invite.scope_id for update;
  select * into invite from pico_private.invitations where id=invite.id
    and kind='community' and recipient_id=auth.uid() for update;
  if invite.id is null or invite.revoked_at is not null then raise insufficient_privilege; end if;
  if invite.accepted_at is not null then
    if invite.accepted_by=auth.uid() then return invite.scope_id; end if;
    raise insufficient_privilege;
  end if;
  perform pico_private.lock_direct_people(auth.uid(),invite.created_by);
  perform pg_advisory_xact_lock(hashtextextended(
    'pico.relationship:'||least(auth.uid(),invite.created_by)::text||':'||
      greatest(auth.uid(),invite.created_by)::text,0));
  perform 1 from pico_private.beta_admissions
    where player_id in (auth.uid(),invite.created_by) order by player_id for update;
  perform 1 from pico_private.platform_grants
    where player_id=invite.created_by for update;
  perform 1 from pico_private.pico_community
    where community_id=invite.scope_id for update;
  perform 1 from public.community_members
    where community_id=invite.scope_id and player_id in (auth.uid(),invite.created_by)
    order by player_id for update;
  if pico_private.scope_invitation_available(invite.id,auth.uid()) is distinct from true
    then raise insufficient_privilege; end if;
  insert into public.community_members(community_id,player_id,status) values(invite.scope_id,auth.uid(),'active')
    on conflict(community_id,player_id) do update set status='active';
  update pico_private.invitations set accepted_at=now(),accepted_by=auth.uid()
    where id=invite.id;
  insert into pico_private.audit_events(actor_id,action,scope_id,target_id) values(auth.uid(),'community.invite.accept',invite.scope_id,invite.id);
  return invite.scope_id;
end;
$$;

create function public.preview_scope_invitation(p_kind text, p_token text) returns uuid
language sql stable security definer set search_path = '' as $$
  select pico_private.available_scope_invitation(p_kind,p_token);
$$;

-- Legacy email-bound scope invitation entry points are unsafe while signup is
-- intentionally auto-confirmed. Existing links remain revocable but cannot be
-- redeemed; managers recreate them for a concrete @username.
revoke execute on function public.invite_arena_manager(uuid,text,text), public.accept_arena_invite(text),
  public.invite_community_member(uuid,text), public.accept_community_invite(text) from authenticated;
revoke all on function public.invite_arena_player(uuid,text,text), public.accept_arena_player_invite(text),
  public.invite_community_player(uuid,text), public.accept_community_player_invite(text),
  public.preview_scope_invitation(text,text) from public, anon, authenticated;
grant execute on function public.invite_arena_player(uuid,text,text), public.accept_arena_player_invite(text),
  public.invite_community_player(uuid,text), public.accept_community_player_invite(text),
  public.preview_scope_invitation(text,text) to authenticated;

-- Manager lists never return the stored delivery address. New invitations show
-- the bound Pico handle; pre-migration rows remain manageable under a neutral
-- label until they expire or are revoked.
create or replace function public.arena_invitations(p_arena uuid) returns jsonb
language plpgsql stable security definer set search_path='' as $$
begin
  if pico_private.arena_rank(p_arena)<30 then raise insufficient_privilege; end if;
  return coalesce((select jsonb_agg(jsonb_build_object(
    'id',i.id,
    'recipient',case
      when i.recipient_id is null then 'convite legado'
      when not pico_private.can_see_player(i.recipient_id) or p.id is null then 'conta indisponível'
      else '@'||p.username end,
    'role',i.role,
    'expires_at',i.expires_at,
    'expired',i.accepted_at is null and i.revoked_at is null and i.expires_at<=statement_timestamp(),
    'revoked_at',i.revoked_at,
    'accepted_at',i.accepted_at
  ) order by i.created_at desc,i.id desc)
  from (select * from pico_private.invitations
    where kind='arena' and scope_id=p_arena
    order by created_at desc,id desc limit 100) i
  left join public.profiles p on p.id=i.recipient_id),'[]'::jsonb);
end;
$$;

create or replace function public.community_invitations(p_id uuid,p_revoke uuid default null) returns jsonb
language plpgsql security definer set search_path='' as $$
begin
  if pico_private.community_rank(p_id)<20 then raise insufficient_privilege; end if;
  if p_revoke is not null then
    update pico_private.invitations set revoked_at=now()
      where id=p_revoke and scope_id=p_id and kind='community'
        and accepted_at is null and revoked_at is null;
    if not found then raise insufficient_privilege; end if;
    insert into pico_private.audit_events(actor_id,action,scope_id,target_id)
      values(auth.uid(),'community.invite.revoke',p_id,p_revoke);
  end if;
  return coalesce((select jsonb_agg(jsonb_build_object(
    'id',i.id,
    'recipient',case
      when i.recipient_id is null then 'convite legado'
      when not pico_private.can_see_player(i.recipient_id) or p.id is null then 'conta indisponível'
      else '@'||p.username end,
    'expires_at',i.expires_at,
    'expired',i.accepted_at is null and i.revoked_at is null and i.expires_at<=statement_timestamp(),
    'revoked_at',i.revoked_at,
    'accepted_at',i.accepted_at
  ) order by i.created_at desc,i.id desc)
  from (select * from pico_private.invitations
    where kind='community' and scope_id=p_id
    order by created_at desc,id desc limit 100) i
  left join public.profiles p on p.id=i.recipient_id),'[]'::jsonb);
end;
$$;
revoke all on function public.arena_invitations(uuid),public.community_invitations(uuid,uuid)
  from public,anon,authenticated;
grant execute on function public.arena_invitations(uuid),public.community_invitations(uuid,uuid)
  to authenticated;

-- A repeated or post-acceptance revoke is a rejected action, not an audit
-- event. Keep legacy email invitations revocable until they expire.
create or replace function public.revoke_arena_invite(p_id uuid) returns void
language plpgsql security definer set search_path='' as $$
declare invite pico_private.invitations; rank integer;
begin
  select * into invite from pico_private.invitations
    where id=p_id and kind='arena' for update;
  if invite.id is null or invite.accepted_at is not null or invite.revoked_at is not null
    then raise insufficient_privilege; end if;
  rank:=pico_private.arena_rank(invite.scope_id);
  if rank<30 or (invite.role='admin' and rank<40) then raise insufficient_privilege; end if;
  update pico_private.invitations set revoked_at=now()
    where id=invite.id and accepted_at is null and revoked_at is null;
  if not found then raise insufficient_privilege; end if;
  insert into pico_private.audit_events(actor_id,action,scope_id,target_id)
    values(auth.uid(),'arena.invite.revoke',invite.scope_id,invite.id);
end;
$$;

create or replace function public.erase_account_private_data(p_user uuid) returns void
language plpgsql security definer set search_path='' as $$
begin
  if not exists(select 1 from public.account_deletions where player_id=p_user) then raise insufficient_privilege; end if;
  delete from pico_private.invitations where recipient_id=p_user
    or (email is not null and lower(email)=(select lower(email) from auth.users where id=p_user));
  update pico_private.audit_events set target_id=null where target_id=p_user;
end;
$$;
revoke all on function public.erase_account_private_data(uuid) from public,anon,authenticated;
grant execute on function public.erase_account_private_data(uuid) to service_role;

create function public.export_product_measurement(p_user uuid) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare result jsonb;
begin
  if p_user is null or not exists(select 1 from auth.users where id = p_user) then raise insufficient_privilege; end if;
  select jsonb_build_object(
    'product_measurement',coalesce((select jsonb_agg(to_jsonb(q)) from (
      select event_type,context_type,context_id,occurred_at from pico_private.product_events
      where actor_id=p_user order by occurred_at,id limit 5001
    ) q),'[]'::jsonb),
    'scope_invitations',coalesce((select jsonb_agg(to_jsonb(q)) from (
      select id,kind,scope_id,role,
        case when created_by=p_user then 'issued' else 'received' end direction,
        expires_at,revoked_at,accepted_at,created_at
      from pico_private.invitations
      where kind in ('arena','community') and (created_by=p_user or recipient_id=p_user)
      order by created_at,id limit 5001
    ) q),'[]'::jsonb)
  ) into result;
  if jsonb_array_length(result->'product_measurement') > 5000
    or jsonb_array_length(result->'scope_invitations') > 5000
    or octet_length(result::text) > 1048576 then
    raise sqlstate 'P0413' using message = 'Product measurement export too large';
  end if;
  return result;
end;
$$;

-- Keep privacy export complete even if the web application rolls back one
-- version after collection begins.
alter function public.export_account_data(uuid) rename to export_account_data_core;
revoke all on function public.export_account_data_core(uuid) from public, anon, authenticated;
grant execute on function public.export_account_data_core(uuid) to service_role;
create function public.export_account_data(p_user uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare result jsonb;
begin
  result := public.export_account_data_core(p_user) || public.export_product_measurement(p_user);
  if octet_length(result::text)>8388608 then raise sqlstate 'P0413' using message='Account export too large'; end if;
  return result;
end;
$$;
revoke all on function public.export_account_data(uuid) from public, anon, authenticated;
grant execute on function public.export_account_data(uuid) to service_role;

create function public.purge_product_events() returns integer
language plpgsql security definer set search_path = '' as $$
declare
  kept_days integer;
  max_age integer;
  removed integer;
  previous_purge timestamptz;
  collection_start timestamptz;
  now_at timestamptz := clock_timestamp();
  gap_start timestamptz;
begin
  select retention_days,purge_max_age_hours,last_purged_at,collection_started_at
    into kept_days,max_age,previous_purge,collection_start
    from pico_private.product_measurement_settings where singleton for update;
  if kept_days is null then raise check_violation using message = 'Retention is not approved'; end if;
  if collection_start is not null and previous_purge is not null
    and previous_purge < now_at-make_interval(hours=>max_age) then
    gap_start:=greatest(collection_start,previous_purge+make_interval(hours=>max_age));
    if gap_start<now_at then
      insert into pico_private.product_measurement_gaps(started_at,ended_at,reason)
        values(gap_start,now_at,'retention_heartbeat');
    end if;
  end if;
  delete from pico_private.product_events where occurred_at < now_at-make_interval(days=>kept_days);
  get diagnostics removed = row_count;
  update pico_private.product_measurement_settings set last_purged_at=now_at where singleton;
  return removed;
end;
$$;

-- Aggregate-only report. Every block is suppressed when its base, a positive
-- numerator, or a complementary cell would expose a group of 1..4.
create function public.product_metrics_snapshot(
  p_start date,
  p_end date,
  p_timezone text default 'America/Sao_Paulo'
) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  start_at timestamptz; end_at timestamptz; available_start date; available_end date;
  setting pico_private.product_measurement_settings;
  edge_state pico_private.product_measurement_edge_state;
  reciprocal jsonb; conversations jsonb; profile_completion jsonb; activation jsonb; d7 jsonb; invitations jsonb;
begin
  select * into setting from pico_private.product_measurement_settings where singleton;
  select * into edge_state from pico_private.product_measurement_edge_state where singleton;
  if setting.singleton is null or setting.enabled is distinct from true
    or setting.retention_days is null or setting.approved_at is null or setting.approved_by is null
    or setting.collection_started_at is null or setting.first_enabled_at is null
    or setting.expected_edge_release is null then
    return jsonb_build_object('status','disabled','reason','privacy_gate_closed','hasBase',false);
  end if;
  if setting.approved_at>clock_timestamp() or setting.collection_started_at>clock_timestamp() then
    return jsonb_build_object('status','disabled','reason','approval_not_active','hasBase',false);
  end if;
  if setting.purge_verified_at is null or setting.purge_verified_by is null
    or setting.purge_verified_at>clock_timestamp() then
    return jsonb_build_object('status','disabled','reason','retention_maintenance_unverified','hasBase',false);
  end if;
  if setting.last_purged_at is null or setting.last_purged_at>clock_timestamp()
    or setting.last_purged_at < clock_timestamp()-make_interval(hours=>setting.purge_max_age_hours) then
    return jsonb_build_object('status','disabled','reason','retention_maintenance_stale','hasBase',false);
  end if;
  if p_start is null or p_end is null or p_timezone is null
    or p_end < p_start or p_end - p_start > 366 or p_timezone <> setting.reporting_timezone then
    raise check_violation;
  end if;

  available_start := greatest(
    (setting.collection_started_at at time zone p_timezone)::date + 1,
    ((clock_timestamp()-make_interval(days=>setting.retention_days)) at time zone p_timezone)::date + 1
  );
  available_end := (clock_timestamp() at time zone p_timezone)::date - 1;
  if p_start<available_start or p_end>available_end then
    return jsonb_build_object('status','incomplete','reason','outside_complete_retained_window','hasBase',false,
      'availableStart',available_start,'availableEnd',available_end,'timezone',p_timezone);
  end if;
  start_at := p_start::timestamp at time zone p_timezone;
  end_at := (p_end + 1)::timestamp at time zone p_timezone;
  if exists(select 1 from pico_private.product_measurement_gaps g
    where g.source='request_edge' and g.started_at<end_at
      and coalesce(g.ended_at,'infinity'::timestamptz)>start_at)
    or ((edge_state.singleton is null or edge_state.configured_enabled is distinct from true
      or edge_state.protocol_version is distinct from 1
      or edge_state.release is distinct from setting.expected_edge_release or edge_state.lease_until is null
      or edge_state.lease_until<=clock_timestamp())
      and greatest(setting.collection_started_at,coalesce(edge_state.lease_until,setting.collection_started_at))<end_at
      and clock_timestamp()>start_at) then
    return jsonb_build_object('status','incomplete','reason','request_edge_gap','hasBase',false,
      'availableStart',available_start,'availableEnd',available_end,'timezone',p_timezone);
  end if;
  if exists(select 1 from pico_private.product_measurement_gaps g
    where g.source='database' and g.started_at<end_at
      and coalesce(g.ended_at,'infinity'::timestamptz)>start_at) then
    return jsonb_build_object('status','incomplete','reason','collection_gap','hasBase',false,
      'availableStart',available_start,'availableEnd',available_end,'timezone',p_timezone);
  end if;

  with dm_pairs as (
    select c.participant_low a,c.participant_high b
    from public.direct_conversations c join public.direct_messages m on m.conversation_id=c.id
    where m.created_at>=start_at and m.created_at<end_at
      and pico_private.product_person_eligible(c.participant_low)
      and pico_private.product_person_eligible(c.participant_high)
    group by c.id,c.participant_low,c.participant_high
    having bool_or(m.sender_id=c.participant_low) and bool_or(m.sender_id=c.participant_high)
  ), comment_pairs as (
    select least(c.author_id,p.author_id) a,greatest(c.author_id,p.author_id) b
    from public.comments c join public.posts p on p.id=c.post_id
    where c.created_at>=start_at and c.created_at<end_at and c.author_id<>p.author_id
      and c.moderated_at is null and p.moderated_at is null
      and pico_private.product_person_eligible(c.author_id) and pico_private.product_person_eligible(p.author_id)
    group by least(c.author_id,p.author_id),greatest(c.author_id,p.author_id)
    having bool_or(c.author_id=least(c.author_id,p.author_id)) and bool_or(c.author_id=greatest(c.author_id,p.author_id))
  ), pairs as (select * from dm_pairs union select * from comment_pairs), people as (
    select a player_id from pairs union select b from pairs
  ), totals as (select count(*)::integer people from people)
  select jsonb_build_object('people',case when people>=5 then people end,'hasBase',people>0,
    'suppressed',people between 1 and 4,
    'definition','Pessoa em par com troca bilateral de DM ou comentários cruzados entre autores no período; curtida e follow isolados não contam.')
    into reciprocal from totals;

  with first_message as (
    select distinct on (m.conversation_id) m.conversation_id,m.sender_id,m.created_at,c.participant_low,c.participant_high
    from public.direct_messages m join public.direct_conversations c on c.id=m.conversation_id
    where pico_private.product_person_eligible(c.participant_low) and pico_private.product_person_eligible(c.participant_high)
    order by m.conversation_id,m.sequence
  ), cohort as (
    select f.*,r.created_at response_at from first_message f
    left join lateral (select m.created_at from public.direct_messages m where m.conversation_id=f.conversation_id
      and m.sender_id<>f.sender_id and m.created_at>f.created_at and m.created_at<end_at
      order by m.sequence limit 1) r on true
    where f.created_at>=start_at and f.created_at<end_at
  ), totals as (select count(*)::integer started,count(response_at)::integer answered,
    (count(*)-count(response_at))::integer unanswered,
    round(avg(extract(epoch from response_at-created_at))) average_seconds from cohort), protected as (
    select *,started between 1 and 4 base_hidden,
      started>=5 and (answered between 1 and 4 or unanswered between 1 and 4) response_hidden
    from totals
  )
  select jsonb_build_object('started',case when started>=5 then started end,
    'withResponse',case when started>=5 and not response_hidden then answered end,
    'withoutResponse',case when started>=5 and not response_hidden then unanswered end,
    'averageFirstResponseSeconds',case when started>=5 and not response_hidden and answered>=5 then average_seconds end,
    'hasBase',started>0,'suppressed',base_hidden or response_hidden,
    'definition','Conversa entra pela primeira mensagem; resposta é a primeira mensagem posterior do outro participante.')
    into conversations from protected;

  -- Profile completion uses a private retained edge and the same complete D7
  -- observation window for every mature signup cohort.
  with cohorts as (
    select (p.created_at at time zone p_timezone)::date cohort_day,count(*)::integer base,
      count(*) filter(where exists(select 1 from pico_private.product_events e
        where e.actor_id=p.id and e.event_type='profile_completed'
          and e.occurred_at>=greatest(p.created_at,setting.collection_started_at)
          and e.occurred_at<(((p.created_at at time zone p_timezone)::date+8)::timestamp at time zone p_timezone)))::integer activated
    from public.profiles p
    where p.created_at>=start_at and p.created_at<end_at
      and (p.created_at at time zone p_timezone)::date<=p_end-7
      and pico_private.product_person_eligible(p.id)
    group by (p.created_at at time zone p_timezone)::date
  ), protected as (select *,base<5 or activated between 1 and 4 or base-activated between 1 and 4 hidden from cohorts)
  select coalesce(jsonb_agg(jsonb_build_object('cohortDay',cohort_day,
    'eligible',case when not hidden then base end,'activated',case when not hidden then activated end,
    'hasBase',base>0,'suppressed',hidden) order by cohort_day),'[]'::jsonb) into profile_completion from protected;

  -- Social activation uses the same complete D7 observation window for every
  -- cohort. A cohort is omitted until its seventh local day has ended.
  with cohorts as (
    select (p.created_at at time zone p_timezone)::date cohort_day,count(*)::integer base,
      count(*) filter(where exists(select 1 from pico_private.product_events e
        where e.actor_id=p.id and e.event_type='social_activated'
          and e.occurred_at>=greatest(p.created_at,setting.collection_started_at)
          and e.occurred_at<(((p.created_at at time zone p_timezone)::date+8)::timestamp at time zone p_timezone)))::integer activated
    from public.profiles p
    where p.created_at>=start_at and p.created_at<end_at
      and (p.created_at at time zone p_timezone)::date<=p_end-7
      and pico_private.product_person_eligible(p.id)
    group by (p.created_at at time zone p_timezone)::date
  ), protected as (select *,base<5 or activated between 1 and 4 or base-activated between 1 and 4 hidden from cohorts)
  select coalesce(jsonb_agg(jsonb_build_object('cohortDay',cohort_day,
    'eligible',case when not hidden then base end,'activated',case when not hidden then activated end,
    'hasBase',base>0,'suppressed',hidden) order by cohort_day),'[]'::jsonb) into activation from protected;

  with cohorts as (
    select (p.created_at at time zone p_timezone)::date cohort_day,count(*)::integer base,
      count(*) filter(where exists(select 1 from pico_private.product_events e where e.actor_id=p.id and e.event_type='return_active'
        and (e.occurred_at at time zone p_timezone)::date=(p.created_at at time zone p_timezone)::date+7))::integer returned
    from public.profiles p where p.created_at>=start_at and p.created_at<end_at
      and (p.created_at at time zone p_timezone)::date<=p_end-7 and pico_private.product_person_eligible(p.id)
    group by (p.created_at at time zone p_timezone)::date
  ), protected as (select *,base<5 or returned between 1 and 4 or base-returned between 1 and 4 hidden from cohorts)
  select coalesce(jsonb_agg(jsonb_build_object('cohortDay',cohort_day,
    'eligible',case when not hidden then base end,'returnedD7',case when not hidden then returned end,
    'hasBase',base>0,'suppressed',hidden) order by cohort_day),'[]'::jsonb) into d7 from protected;

  with issued as (
    select i.id,i.created_at,i.recipient_id,i.accepted_at,i.accepted_by
    from pico_private.invitations i
    where i.kind in ('arena','community') and i.recipient_id is not null
      and i.created_at>=start_at and i.created_at<end_at
      and pico_private.product_person_eligible(i.created_by)
      and pico_private.product_person_eligible(i.recipient_id)
  ), totals as (
    select count(*)::integer issued,
      count(*) filter(where exists(select 1 from pico_private.product_events e
        where e.event_type='invitation_opened' and e.context_id=i.id
          and e.occurred_at>=i.created_at and e.occurred_at<end_at))::integer opened,
      count(*) filter(where i.accepted_at>=i.created_at and i.accepted_at<end_at
        and i.accepted_by=i.recipient_id and pico_private.product_person_eligible(i.accepted_by))::integer accepted,
      count(*) filter(where i.accepted_at>=i.created_at and i.accepted_at<end_at
        and (i.accepted_at at time zone p_timezone)::date<=p_end-7
        and i.accepted_by=i.recipient_id
        and pico_private.product_person_eligible(i.accepted_by))::integer mature_accepted,
      count(*) filter(where i.accepted_at>=i.created_at and i.accepted_at<end_at
        and (i.accepted_at at time zone p_timezone)::date<=p_end-7
        and i.accepted_by=i.recipient_id
        and pico_private.product_person_eligible(i.accepted_by)
        and exists(select 1 from pico_private.product_events e
          where e.actor_id=i.accepted_by and e.event_type='social_activated'
            and e.occurred_at>=i.accepted_at
            and e.occurred_at<(((i.accepted_at at time zone p_timezone)::date+8)::timestamp at time zone p_timezone)))::integer activated
    from issued i
  ), protected as (select *,
    issued between 1 and 4 base_hidden,
    issued>=5 and (opened between 1 and 4 or issued-opened between 1 and 4) opened_hidden,
    issued>=5 and (accepted between 1 and 4 or issued-accepted between 1 and 4) accepted_hidden,
    accepted>=5 and (mature_accepted between 1 and 4 or accepted-mature_accepted between 1 and 4) maturity_hidden,
    mature_accepted between 1 and 4 or (mature_accepted>=5
      and (activated between 1 and 4 or mature_accepted-activated between 1 and 4)) activation_hidden
    from totals)
  select jsonb_build_object('issued',case when issued>=5 then issued end,
    'opened',case when issued>=5 and not opened_hidden then opened end,
    'accepted',case when issued>=5 and not accepted_hidden then accepted end,
    'matureAccepted',case when issued>=5 and not accepted_hidden and not maturity_hidden then mature_accepted end,
    'socialActivatedD7',case when issued>=5 and not accepted_hidden and not maturity_hidden and not activation_hidden then activated end,
    'hasBase',issued>0,
    'suppressed',base_hidden or opened_hidden or accepted_hidden or maturity_hidden or activation_hidden,
    'scope','Convites seguros de arena e comunidade vinculados a uma conta Pico existente.',
    'definition','Emitidos é o denominador geral; entre aceites maduros, ativação é uma primeira conexão mútua observada em até D7 após o aceite. Não implica causalidade nem ausência de relação anterior fora da retenção.')
    into invitations from protected;

  return jsonb_build_object('status','ready','period',jsonb_build_object('start',p_start,'end',p_end,'timezone',p_timezone),
    'hasBase',coalesce((reciprocal->>'hasBase')::boolean,false) or coalesce((conversations->>'hasBase')::boolean,false)
      or jsonb_array_length(profile_completion)>0 or jsonb_array_length(activation)>0
      or jsonb_array_length(d7)>0 or coalesce((invitations->>'hasBase')::boolean,false),
    'weeklyReciprocalPeople',reciprocal,'conversationResponse',conversations,
    'profileCompletionD7ByCohort',profile_completion,'socialActivationD7ByCohort',activation,
    'returnD7',d7,'invitations',invitations,'smallCellMinimum',5,
    'coverage',jsonb_build_object('availableStart',available_start,'availableEnd',available_end));
end;
$$;

revoke all on function public.record_product_event(uuid,text,text,text,uuid),
  public.export_product_measurement(uuid), public.purge_product_events(),
  public.product_metrics_snapshot(date,date,text) from public, anon, authenticated;
grant execute on function public.record_product_event(uuid,text,text,text,uuid),
  public.export_product_measurement(uuid), public.purge_product_events(),
  public.product_metrics_snapshot(date,date,text) to service_role;

comment on table pico_private.product_events is
  'Dormant privacy-gated categorical journey edges only. Keys are server-derived; no content, contact, URL, token, network, target-profile or device attributes.';

commit;
