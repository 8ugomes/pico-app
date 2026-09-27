begin;

-- Delivery is a separate, explicit operational release. No existing account is
-- subscribed, no old inbox entry is backfilled, and this migration sends nothing.
create table pico_private.push_settings (
  singleton boolean primary key default true check (singleton),
  enabled boolean not null default false
);
insert into pico_private.push_settings(singleton, enabled) values(true, false);

create table pico_private.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.profiles(id) on delete cascade,
  endpoint text not null,
  endpoint_hash text not null unique,
  p256dh text not null,
  auth_key text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '30 days',
  last_delivered_at timestamptz,
  delivery_lease_until timestamptz,
  check (length(endpoint) between 30 and 2048),
  check (endpoint ~ '^https://(fcm[.]googleapis[.]com/fcm/send/|updates[.]push[.]services[.]mozilla[.]com/wpush/v[12]/|web[.]push[.]apple[.]com/)[A-Za-z0-9_:=-]+$'),
  check (endpoint_hash = encode(sha256(convert_to(endpoint, 'UTF8')), 'hex')),
  check (p256dh ~ '^[A-Za-z0-9_-]{87}$'),
  check (auth_key ~ '^[A-Za-z0-9_-]{22}$')
);
create index push_subscriptions_player on pico_private.push_subscriptions(player_id);

create table pico_private.push_outbox (
  id uuid primary key default gen_random_uuid(),
  notification_id uuid references public.notifications(id) on delete cascade,
  message_id uuid references public.direct_messages(id) on delete cascade,
  subscription_id uuid not null references pico_private.push_subscriptions(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'processing', 'sent', 'discarded')),
  attempts integer not null default 0 check (attempts between 0 and 5),
  available_at timestamptz not null default now(),
  lease_token uuid,
  lease_expires_at timestamptz,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '6 hours',
  finished_at timestamptz,
  unique(notification_id, subscription_id),
  unique(message_id, subscription_id),
  check ((notification_id is null) <> (message_id is null))
);
create index push_outbox_due on pico_private.push_outbox(subscription_id, available_at, created_at)
  where status in ('pending', 'processing');
create index push_outbox_expiry on pico_private.push_outbox(expires_at);
alter table pico_private.push_settings enable row level security;
alter table pico_private.push_subscriptions enable row level security;
alter table pico_private.push_outbox enable row level security;
revoke all on pico_private.push_settings, pico_private.push_subscriptions, pico_private.push_outbox from public, anon, authenticated;

create function public.read_push_subscription(p_endpoint text default null) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise insufficient_privilege; end if;
  return jsonb_build_object(
    'enabled', (select enabled from pico_private.push_settings where singleton) and pico_private.active_account(),
    'subscribed', exists(select 1 from pico_private.push_subscriptions where player_id = auth.uid()
      and endpoint = p_endpoint and expires_at > now()),
    'expiresAt', (select expires_at from pico_private.push_subscriptions where player_id = auth.uid()
      and endpoint = p_endpoint and expires_at > now())
  );
end;
$$;

create function public.save_push_subscription(p_endpoint text, p_p256dh text, p_auth text) returns void
language plpgsql security definer set search_path = '' as $$
declare existing pico_private.push_subscriptions;
begin
  if not coalesce((select enabled from pico_private.push_settings where singleton), false) then raise insufficient_privilege; end if;
  perform pico_private.consume_write('push_subscription', 20, 3600);
  if p_endpoint is null or p_p256dh is null or p_auth is null then raise check_violation; end if;
  perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text || ':push', 0));
  select * into existing from pico_private.push_subscriptions
    where endpoint_hash = encode(sha256(convert_to(p_endpoint, 'UTF8')), 'hex') for update;
  -- An endpoint can never be reassigned to a different account by an upsert.
  -- Switching accounts requires a fresh browser subscription and explicit opt-in.
  if existing.id is not null and existing.player_id <> auth.uid() then raise insufficient_privilege; end if;
  if existing.id is null and (select count(*) from pico_private.push_subscriptions
    where player_id = auth.uid() and expires_at > now()) >= 5 then
    raise sqlstate 'P0429' using message = 'Device limit';
  end if;
  if existing.id is not null then
    update pico_private.push_subscriptions set p256dh = p_p256dh, auth_key = p_auth,
      updated_at = now(), expires_at = now() + interval '30 days' where id = existing.id;
  else
    insert into pico_private.push_subscriptions(player_id, endpoint, endpoint_hash, p256dh, auth_key)
      values(auth.uid(), p_endpoint, encode(sha256(convert_to(p_endpoint, 'UTF8')), 'hex'), p_p256dh, p_auth);
  end if;
end;
$$;

-- Revocation remains available when the feature or social admission is disabled.
create function public.delete_push_subscription(p_endpoint text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise insufficient_privilege; end if;
  delete from pico_private.push_subscriptions where player_id = auth.uid() and endpoint = p_endpoint;
end;
$$;

create function pico_private.enqueue_community_push() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if coalesce((select enabled from pico_private.push_settings where singleton), false)
    and new.read_at is null and new.kind in ('community_join', 'post_mention', 'community_mention_all') then
    insert into pico_private.push_outbox(notification_id, subscription_id)
      select new.id, s.id from pico_private.push_subscriptions s
      where s.player_id = new.recipient_id and s.expires_at > now()
      on conflict(notification_id, subscription_id) do nothing;
  end if;
  return new;
end;
$$;
create trigger enqueue_community_push after insert on public.notifications
  for each row execute function pico_private.enqueue_community_push();

create function pico_private.enqueue_direct_message_push() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if coalesce((select enabled from pico_private.push_settings where singleton), false)
    and pico_private.direct_messages_enabled() then
    insert into pico_private.push_outbox(message_id, subscription_id)
      select new.id, s.id from public.direct_conversations c
      join pico_private.push_subscriptions s on s.player_id =
        case when c.participant_low = new.sender_id then c.participant_high else c.participant_low end
      where c.id = new.conversation_id and s.expires_at > now()
      on conflict(message_id, subscription_id) do nothing;
  end if;
  return new;
end;
$$;
create trigger enqueue_direct_message_push after insert on public.direct_messages
  for each row execute function pico_private.enqueue_direct_message_push();

-- A service worker has no user JWT. Recheck the same current people/group/post
-- boundaries without impersonating a user or changing request.jwt claims.
-- Archived arena posts are conservatively excluded even for arena managers.
create function pico_private.push_notification_visible(p_notification uuid, p_player uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(
    select 1 from public.notifications n
    join auth.users u on u.id = n.recipient_id and u.email_confirmed_at is not null
    join pico_private.beta_admissions recipient on recipient.player_id = n.recipient_id and recipient.status = 'approved'
    join pico_private.beta_admissions actor on actor.player_id = n.actor_id and actor.status = 'approved'
    join public.communities c on c.id = n.community_id and c.status = 'active'
    join public.community_members rm on rm.community_id = c.id and rm.player_id = n.recipient_id and rm.status = 'active'
    join public.community_members am on am.community_id = c.id and am.player_id = n.actor_id and am.status = 'active'
    where n.id = p_notification and n.recipient_id = p_player and n.read_at is null
      and n.kind in ('community_join', 'post_mention', 'community_mention_all')
      and not exists(select 1 from public.account_deletions where player_id in (n.recipient_id, n.actor_id))
      and not exists(select 1 from public.blocks where
        (blocker_id = n.recipient_id and blocked_id = n.actor_id) or
        (blocked_id = n.recipient_id and blocker_id = n.actor_id))
      and (n.post_id is null or exists(
        select 1 from public.posts p
        join public.post_destinations d on d.post_id = p.id and d.community_id = n.community_id
        where p.id = n.post_id and p.author_id = n.actor_id and p.moderated_at is null
          and (p.audience = 'beta' or (p.audience = 'private' and p.private_community_id = n.community_id))
          and (p.arena_id is null or exists(select 1 from public.arenas a where a.id = p.arena_id and a.is_public and a.status <> 'archived'))
      ))
  );
$$;

create function pico_private.push_message_visible(p_message uuid, p_player uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select pico_private.direct_messages_enabled() and exists(
    select 1 from public.direct_messages m
    join public.direct_conversations c on c.id = m.conversation_id
    join auth.users recipient_user on recipient_user.id = p_player and recipient_user.email_confirmed_at is not null
    join auth.users sender_user on sender_user.id = m.sender_id and sender_user.email_confirmed_at is not null
    join pico_private.beta_admissions recipient on recipient.player_id = p_player and recipient.status = 'approved'
    join pico_private.beta_admissions sender on sender.player_id = m.sender_id and sender.status = 'approved'
    join public.connections f on f.follower_id = p_player and f.followed_id = m.sender_id
    join public.connections r on r.follower_id = m.sender_id and r.followed_id = p_player
    where m.id = p_message and m.sender_id <> p_player
      and m.sender_id in (c.participant_low, c.participant_high) and p_player in (c.participant_low, c.participant_high)
      and not exists(select 1 from public.account_deletions where player_id in (p_player, m.sender_id))
      and not exists(select 1 from public.blocks where
        (blocker_id = p_player and blocked_id = m.sender_id) or (blocked_id = p_player and blocker_id = m.sender_id))
      and not exists(select 1 from public.direct_message_reads where conversation_id = c.id
        and player_id = p_player and last_read_sequence >= m.sequence)
  );
$$;

-- One lease per device prevents two workers delivering concurrent duplicates.
-- Bounded cleanup and batches keep the endpoint suitable for a scheduled worker.
create function public.claim_push_batch(p_limit integer default 20)
returns table(job_id uuid, lease_token uuid)
language plpgsql security definer set search_path = '' as $$
declare item record; retired record; token uuid;
begin
  if p_limit is null or p_limit not between 1 and 20 then raise check_violation; end if;
  if not coalesce((select enabled from pico_private.push_settings where singleton), false) then return; end if;
  -- Every path locks subscription before its jobs, including FK cleanup.
  -- SKIP LOCKED prevents housekeeping from waiting behind a live delivery.
  for retired in
    select s.id, s.expires_at from pico_private.push_subscriptions s
    where s.expires_at < now() - interval '7 days'
      or exists(select 1 from pico_private.push_outbox o where o.subscription_id = s.id and o.expires_at < now())
    order by s.id limit 20 for update of s skip locked
  loop
    if retired.expires_at < now() - interval '7 days' then
      delete from pico_private.push_subscriptions where id = retired.id;
    else
      delete from pico_private.push_outbox where id in (
        select id from pico_private.push_outbox where subscription_id = retired.id and expires_at < now() limit 10
      );
    end if;
  end loop;
  for item in
    select s.id subscription_id, q.id job_id from pico_private.push_subscriptions s
    cross join lateral (
      select o.id, o.available_at, o.created_at from pico_private.push_outbox o
      where o.subscription_id = s.id and o.expires_at > now() and o.attempts < 5
        and ((o.status = 'pending' and o.available_at <= now())
          or (o.status = 'processing' and o.lease_expires_at < now()))
      order by o.available_at, o.created_at, o.id limit 1
    ) q
    where s.expires_at > now() and (s.delivery_lease_until is null or s.delivery_lease_until < now())
      and (s.last_delivered_at is null or s.last_delivered_at < now() - interval '1 minute')
    order by q.available_at, q.created_at, s.id limit p_limit for update of s skip locked
  loop
    token := gen_random_uuid();
    update pico_private.push_subscriptions set delivery_lease_until = now() + interval '2 minutes' where id = item.subscription_id;
    update pico_private.push_outbox set status = 'processing', attempts = attempts + 1,
      lease_token = token, lease_expires_at = now() + interval '2 minutes' where id = item.job_id;
    job_id := item.job_id; lease_token := token; return next;
  end loop;
end;
$$;

create function public.read_push_delivery(p_job uuid, p_lease uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare job pico_private.push_outbox; sub pico_private.push_subscriptions;
begin
  select * into job from pico_private.push_outbox where id = p_job;
  if job.id is null then return null; end if;
  select * into sub from pico_private.push_subscriptions where id = job.subscription_id for update;
  if sub.id is null then return null; end if;
  select * into job from pico_private.push_outbox where id = p_job and lease_token = p_lease
    and status = 'processing' and lease_expires_at > now() for update;
  if job.id is null then return null; end if;
  if not coalesce((select enabled from pico_private.push_settings where singleton), false)
    or job.expires_at <= now() or sub.id is null or sub.expires_at <= now()
    or (job.notification_id is not null and not pico_private.push_notification_visible(job.notification_id, sub.player_id))
    or (job.message_id is not null and not pico_private.push_message_visible(job.message_id, sub.player_id)) then
    update pico_private.push_outbox set status = 'discarded', finished_at = now() where id = job.id;
    update pico_private.push_subscriptions set delivery_lease_until = null where id = job.subscription_id;
    return null;
  end if;
  return jsonb_build_object('endpoint', sub.endpoint, 'p256dh', sub.p256dh, 'auth', sub.auth_key,
    'kind', case when job.message_id is not null then 'message' else 'community' end,
    'ttl', least(300, greatest(1, extract(epoch from job.expires_at - now())::integer)));
end;
$$;

create function public.finish_push_delivery(p_job uuid, p_lease uuid, p_outcome text, p_retry_after integer default 0) returns void
language plpgsql security definer set search_path = '' as $$
declare job pico_private.push_outbox; next_attempt timestamptz;
begin
  if p_outcome is null or p_outcome not in ('sent', 'retry', 'gone', 'discarded')
    or p_retry_after is null or p_retry_after not between 0 and 3600 then raise check_violation; end if;
  select * into job from pico_private.push_outbox where id = p_job;
  if job.id is null then return; end if;
  perform 1 from pico_private.push_subscriptions where id = job.subscription_id for update;
  if not found then return; end if;
  select * into job from pico_private.push_outbox where id = p_job and lease_token = p_lease
    and status = 'processing' and lease_expires_at > now() for update;
  if job.id is null then return; end if;
  if p_outcome = 'gone' then
    delete from pico_private.push_subscriptions where id = job.subscription_id;
    return;
  end if;
  next_attempt := now() + make_interval(secs => greatest(p_retry_after, least(3600, 30 * (2 ^ job.attempts)::integer)));
  update pico_private.push_subscriptions set
    delivery_lease_until = case when p_outcome = 'retry' then next_attempt else null end,
    last_delivered_at = case when p_outcome = 'sent' then now() else last_delivered_at end where id = job.subscription_id;
  update pico_private.push_outbox set
    status = case when p_outcome = 'sent' then 'sent'
      when p_outcome = 'retry' and attempts < 5 and expires_at > next_attempt then 'pending' else 'discarded' end,
    available_at = next_attempt, lease_expires_at = null, lease_token = null,
    finished_at = case when p_outcome = 'retry' and attempts < 5 and expires_at > next_attempt then null else now() end
    where id = job.id;
  if p_outcome = 'sent' then
    -- The generic alert already points to the entire inbox. Coalesce events that
    -- accumulated before delivery instead of sending a burst to the same device.
    update pico_private.push_outbox set status = 'discarded', finished_at = now()
      where subscription_id = job.subscription_id and status = 'pending' and created_at <= now()
        and (message_id is null) = (job.message_id is null);
  end if;
end;
$$;

revoke all on function pico_private.enqueue_community_push(), pico_private.enqueue_direct_message_push(),
  pico_private.push_notification_visible(uuid, uuid), pico_private.push_message_visible(uuid, uuid) from public, anon, authenticated;
revoke all on function public.read_push_subscription(text), public.save_push_subscription(text, text, text), public.delete_push_subscription(text)
  from public, anon, authenticated;
grant execute on function public.read_push_subscription(text), public.save_push_subscription(text, text, text), public.delete_push_subscription(text) to authenticated;
revoke all on function public.claim_push_batch(integer), public.read_push_delivery(uuid, uuid), public.finish_push_delivery(uuid, uuid, text, integer)
  from public, anon, authenticated;
grant execute on function public.claim_push_batch(integer), public.read_push_delivery(uuid, uuid), public.finish_push_delivery(uuid, uuid, text, integer) to service_role;

commit;
