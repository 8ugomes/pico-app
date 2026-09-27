begin;

-- A follow is an intention, not an accepted connection. Reuse the existing
-- private inbox, but keep every notification kind structurally unambiguous.
-- Delivery is a separate release step: schema-first deployment remains safe
-- for the previous frontend, and disabling this gate hides existing intent
-- rows again before a frontend rollback.
create table pico_private.social_intent_settings (
  singleton boolean primary key default true check (singleton),
  enabled boolean not null default false
);
insert into pico_private.social_intent_settings(singleton, enabled) values(true, false);
revoke all on pico_private.social_intent_settings from public, anon, authenticated;

alter table public.notifications alter column community_id drop not null;
alter table public.notifications drop constraint notifications_kind_check;
alter table public.notifications drop constraint notifications_post_kind_check;
alter table public.notifications add constraint notifications_kind_check
  check (kind in ('community_join', 'post_mention', 'community_mention_all', 'new_follower'));
alter table public.notifications add constraint notifications_context_check check (
  (kind = 'community_join' and community_id is not null and post_id is null) or
  (kind in ('post_mention', 'community_mention_all') and community_id is not null and post_id is not null) or
  (kind = 'new_follower' and community_id is null and post_id is null)
);
create unique index notifications_new_follower_pair
  on public.notifications(recipient_id, actor_id) where kind = 'new_follower';

create function pico_private.can_read_notification_v2(
  p_recipient uuid, p_actor uuid, p_community uuid, p_post uuid, p_kind text
) returns boolean language sql stable security definer set search_path = '' as $$
  select p_recipient = auth.uid() and pico_private.active_account()
    and pico_private.can_see_player(p_actor)
    and exists(select 1 from pico_private.beta_admissions where player_id = p_actor and status = 'approved')
    and not exists(select 1 from public.account_deletions where player_id = p_actor)
    and case
      when p_kind = 'new_follower' then
        coalesce((select enabled from pico_private.social_intent_settings where singleton), false)
        and exists(select 1 from public.connections where follower_id = p_actor and followed_id = p_recipient)
      when p_kind in ('community_join', 'post_mention', 'community_mention_all') then
        p_community is not null and pico_private.can_read_notification(p_recipient, p_actor, p_community, p_post)
      else false
    end;
$$;
revoke all on function pico_private.can_read_notification_v2(uuid, uuid, uuid, uuid, text)
  from public, anon, authenticated;
grant execute on function pico_private.can_read_notification_v2(uuid, uuid, uuid, uuid, text)
  to authenticated;

alter policy notifications_own_read on public.notifications using (
  recipient_id = (select auth.uid())
  and pico_private.can_read_notification_v2(recipient_id, actor_id, community_id, post_id, kind)
);

create function pico_private.notify_new_follower() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if not coalesce((select enabled from pico_private.social_intent_settings where singleton), false) then
    return new;
  end if;
  if not exists(select 1 from pico_private.beta_admissions where player_id = new.follower_id and status = 'approved')
    or not exists(select 1 from pico_private.beta_admissions where player_id = new.followed_id and status = 'approved')
    or exists(select 1 from public.account_deletions where player_id in (new.follower_id, new.followed_id))
    or exists(select 1 from public.blocks where
      (blocker_id = new.follower_id and blocked_id = new.followed_id)
      or (blocker_id = new.followed_id and blocked_id = new.follower_id)) then
    return new;
  end if;

  insert into public.notifications(recipient_id, actor_id, kind)
    values(new.followed_id, new.follower_id, 'new_follower')
  on conflict(recipient_id, actor_id) where kind = 'new_follower'
  do update set created_at = excluded.created_at, read_at = null
    where public.notifications.read_at is not null
      and public.notifications.created_at <= clock_timestamp() - interval '30 days';
  return new;
end;
$$;
revoke all on function pico_private.notify_new_follower() from public, anon, authenticated;
create trigger connection_intent_notification after insert on public.connections
  for each row execute function pico_private.notify_new_follower();

create or replace function public.read_notifications(p_before uuid default null) returns jsonb
language plpgsql stable security invoker set search_path = '' as $$
declare items jsonb; cursor_date timestamptz;
begin
  if not pico_private.active_account() then raise insufficient_privilege; end if;
  if p_before is not null then
    select created_at into cursor_date from public.notifications where id = p_before;
  end if;
  select coalesce(jsonb_agg(to_jsonb(q) order by q.created_at desc, q.id desc), '[]'::jsonb) into items
  from (
    select n.id, n.kind, n.actor_id, n.post_id, n.created_at, n.read_at,
      p.display_name actor_name, p.username actor_username, p.avatar_path actor_avatar_path,
      c.name community_name, c.slug community_slug,
      exists(select 1 from public.connections mine
        where mine.follower_id = auth.uid() and mine.followed_id = n.actor_id) recipient_follows_actor
    from public.notifications n
    join public.profiles p on p.id = n.actor_id
    left join public.communities c on c.id = n.community_id
    where p_before is null or (n.created_at, n.id) < (cursor_date, p_before)
    order by n.created_at desc, n.id desc limit 21
  ) q;
  return jsonb_build_object(
    'items', case when jsonb_array_length(items) > 20 then items - 20 else items end,
    'nextCursor', case when jsonb_array_length(items) > 20 then items->19->>'id' end,
    'unreadCount', (select count(*) from public.notifications where read_at is null)
  );
end;
$$;

create or replace function public.mark_notifications_read(p_ids uuid[]) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform pico_private.consume_write('notification_read', 120, 3600);
  if p_ids is null or cardinality(p_ids) not between 1 and 100 or array_position(p_ids, null) is not null then
    raise check_violation;
  end if;
  update public.notifications set read_at = now()
  where recipient_id = auth.uid() and id = any(p_ids) and read_at is null
    and pico_private.can_read_notification_v2(recipient_id, actor_id, community_id, post_id, kind);
end;
$$;

create or replace function public.mark_all_notifications_read() returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform pico_private.consume_write('notification_read', 120, 3600);
  update public.notifications set read_at = now()
  where recipient_id = auth.uid() and read_at is null
    and pico_private.can_read_notification_v2(recipient_id, actor_id, community_id, post_id, kind);
end;
$$;

-- Return only the relationship between the caller and one visible person.
-- This avoids broadening the private follower table to inbound-list reads.
create function public.read_connection_state(p_player uuid) returns jsonb
language sql stable security definer set search_path = '' as $$
  select case
    when not pico_private.active_account() or p_player is null or p_player = auth.uid()
      or not pico_private.can_see_player(p_player)
      or not exists(select 1 from pico_private.beta_admissions where player_id = p_player and status = 'approved')
      or exists(select 1 from public.account_deletions where player_id = p_player)
      then null
    else jsonb_build_object(
      'following', exists(select 1 from public.connections where follower_id = auth.uid() and followed_id = p_player),
      'followsYou', exists(select 1 from public.connections where follower_id = p_player and followed_id = auth.uid()),
      'mutual', exists(select 1 from public.connections where follower_id = auth.uid() and followed_id = p_player)
        and exists(select 1 from public.connections where follower_id = p_player and followed_id = auth.uid())
    )
  end;
$$;
revoke all on function public.read_connection_state(uuid) from public, anon, authenticated;
grant execute on function public.read_connection_state(uuid) to authenticated;

-- A report references one received message. It never copies a thread or gives
-- operators general conversation access.
-- Keep the opaque message id even if account deletion removes the conversation;
-- the exact pending-case evidence lives in the private table below. Resolution
-- erases its body while retaining private sender/date provenance for audit.
alter table public.reports add column message_id uuid;
alter table public.reports drop constraint reports_check;
alter table public.reports add constraint reports_one_target_check
  check (num_nonnulls(player_id, post_id, comment_id, message_id) = 1);
create unique index reports_message_once on public.reports(reporter_id, message_id) where message_id is not null;

create table pico_private.message_report_evidence (
  report_id uuid primary key references public.reports(id) on delete cascade,
  sender_id uuid not null,
  body text,
  message_created_at timestamptz not null
);
revoke all on pico_private.message_report_evidence from public, anon, authenticated;

-- The old generic operator RPC could resolve a report without applying the
-- message-specific evidence lifecycle. Keep its unrelated management actions
-- behind the same public signature, but make the retired report action
-- unreachable even if a caller bypasses the current API/UI.
alter function public.operator_action(text, uuid, uuid, text)
  rename to operator_action_pre_social_safety;
revoke all on function public.operator_action_pre_social_safety(text, uuid, uuid, text)
  from public, anon, authenticated;
create function public.operator_action(
  p_action text, p_scope_id uuid default null, p_target_id uuid default null, p_value text default null
) returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  if p_action = 'review_report' then raise check_violation; end if;
  return public.operator_action_pre_social_safety(p_action, p_scope_id, p_target_id, p_value);
end;
$$;
revoke all on function public.operator_action(text, uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.operator_action(text, uuid, uuid, text) to authenticated;

-- Defense in depth for trusted administrative updates outside moderate_report:
-- no transition out of pending may retain a copied message body.
create function pico_private.purge_resolved_message_report_body() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if old.status = 'pending' and new.status <> 'pending' and new.message_id is not null then
    update pico_private.message_report_evidence set body = null where report_id = new.id;
  end if;
  return new;
end;
$$;
revoke all on function pico_private.purge_resolved_message_report_body() from public, anon, authenticated;
create trigger purge_resolved_message_report_body after update of status on public.reports
  for each row execute function pico_private.purge_resolved_message_report_body();

drop policy reports_visible_insert on public.reports;
create policy reports_visible_insert on public.reports for insert to authenticated with check(
  reporter_id = (select auth.uid()) and (
    (player_id <> auth.uid() and exists(select 1 from public.profiles p where p.id = player_id)) or
    exists(select 1 from public.posts p where p.id = post_id and p.author_id <> auth.uid()) or
    exists(select 1 from public.comments c where c.id = comment_id and c.author_id <> auth.uid())
  )
);

create function public.report_direct_message(p_message uuid, p_reason text, p_details text default '') returns uuid
language plpgsql security definer set search_path = '' as $$
declare result uuid; evidence record;
begin
  if not pico_private.active_account() or p_message is null
    or p_reason not in ('spam', 'harassment', 'unsafe', 'other') or p_details is null
    or char_length(p_details) > 500 then
    raise insufficient_privilege;
  end if;
  perform pg_advisory_xact_lock(hashtextextended('pico-message-report:' || auth.uid()::text || ':' || p_message::text, 0));
  select id into result from public.reports where reporter_id = auth.uid() and message_id = p_message;
  if result is not null then return result; end if;
  select m.sender_id, m.body, m.created_at into evidence
    from public.direct_messages m
    join public.direct_conversations c on c.id = m.conversation_id
    where m.id = p_message and m.sender_id <> auth.uid()
      and auth.uid() in (c.participant_low, c.participant_high)
    for share of m;
  if evidence.sender_id is null then raise insufficient_privilege; end if;
  insert into public.reports(message_id, reason, details)
    values(p_message, p_reason, btrim(p_details)) returning id into result;
  insert into pico_private.message_report_evidence(report_id, sender_id, body, message_created_at)
    values(result, evidence.sender_id, evidence.body, evidence.created_at);
  return result;
end;
$$;
revoke all on function public.report_direct_message(uuid, text, text) from public, anon, authenticated;
grant execute on function public.report_direct_message(uuid, text, text) to authenticated;

create or replace function public.operator_read(p_context text, p_scope_id uuid default null) returns jsonb
language plpgsql security definer set search_path = '' as $$
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
  select coalesce(jsonb_agg(row_to_json(q)),'[]') into result from(select id,reason,details,status,created_at,post_id,comment_id,player_id,message_id from public.reports order by created_at desc limit 100)q;
 elsif p_context='report_detail' then
  if pico_private.platform_role() is null then raise insufficient_privilege; end if;
  insert into pico_private.audit_events(actor_id,action,target_id) values(auth.uid(),'report.inspect',p_scope_id);
  select jsonb_build_object('id',r.id,'reason',r.reason,'details',r.details,'status',r.status,
    'post',p.body,'comment',c.body,'player',u.display_name,
    'message',e.body,'message_author_id',e.sender_id,'message_created_at',e.message_created_at)
    into result from public.reports r
    left join public.posts p on p.id=r.post_id
    left join public.comments c on c.id=r.comment_id
    left join public.profiles u on u.id=r.player_id
    left join pico_private.message_report_evidence e on e.report_id=r.id
    where r.id=p_scope_id;
 elsif p_context='audit' then
  if pico_private.platform_role() is null then raise insufficient_privilege; end if;
  select coalesce(jsonb_agg(row_to_json(q)),'[]') into result from(select action,scope_id,target_id,created_at from pico_private.audit_events order by id desc limit 100)q;
 else raise check_violation; end if;
 return result;
end;
$$;

create or replace function public.moderate_report(p_report uuid, p_action text) returns void
language plpgsql security definer set search_path='' as $$
declare r public.reports; target uuid; operator_role text:=pico_private.platform_role();
begin
 perform pico_private.consume_write('moderation',60,3600);
 if operator_role is null or p_action is null or p_action not in ('dismiss','hide','suspend') then raise insufficient_privilege; end if;
 select * into r from public.reports where id=p_report for update;
 if r.id is null then raise check_violation; end if;
 if r.status<>'pending' then raise sqlstate 'P0409'; end if;
 target:=(select sender_id from pico_private.message_report_evidence where report_id=r.id);
 if p_action='hide' then
  if r.post_id is not null then update public.posts set moderated_at=now() where id=r.post_id;
  elsif r.comment_id is not null then update public.comments set moderated_at=now() where id=r.comment_id;
  else raise check_violation; end if;
 elsif p_action='suspend' then
  target:=coalesce(target,r.player_id,
    (select author_id from public.posts where id=r.post_id),
    (select author_id from public.comments where id=r.comment_id));
  if target is null or target=auth.uid() or (operator_role='moderator' and exists(select 1 from pico_private.platform_grants where player_id=target)) then raise insufficient_privilege; end if;
  update pico_private.beta_admissions set status='suspended',updated_at=now() where player_id=target;
 end if;
 update public.reports set status=case when p_action='dismiss' then 'dismissed' else 'action_taken' end,reviewed_at=now() where id=p_report;
 insert into pico_private.audit_events(actor_id,action,scope_id,target_id) values(auth.uid(),'report.'||p_action,p_report,target);
 -- Retain only non-content case provenance after resolution. The exact body is
 -- necessary while the case is pending, but must not become indefinite history.
 update pico_private.message_report_evidence set body=null where report_id=p_report;
end;
$$;

-- The account archive keeps the reporter's case reference and writing, but
-- never exports the other participant's message body through this path.
create or replace function public.export_account_messages(p_user uuid) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare result jsonb;
begin
  if p_user is null or not exists(select 1 from auth.users where id = p_user) then raise insufficient_privilege; end if;
  select jsonb_build_object(
    'direct_messages_sent', coalesce((select jsonb_agg(to_jsonb(q)) from (
      select id, conversation_id, body, created_at from public.direct_messages
      where sender_id = p_user order by created_at, id limit 5001
    ) q), '[]'::jsonb),
    'direct_message_reports', coalesce((select jsonb_agg(to_jsonb(q)) from (
      select id, message_id, reason, details, status, created_at, reviewed_at from public.reports
      where reporter_id = p_user and message_id is not null order by created_at, id limit 5001
    ) q), '[]'::jsonb)
  ) into result;
  if exists(select 1 from jsonb_each(result) where jsonb_array_length(value) > 5000)
    or octet_length(result::text) > 8388608 then
    raise sqlstate 'P0413' using message = 'Account export too large';
  end if;
  return result;
end;
$$;
revoke all on function public.export_account_messages(uuid) from public, anon, authenticated;
grant execute on function public.export_account_messages(uuid) to service_role;

commit;
