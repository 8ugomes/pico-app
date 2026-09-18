begin;

-- The API flag alone cannot gate Supabase's authenticated RPC endpoint. Keep
-- this additive domain disabled in the database until the release is verified.
create table pico_private.direct_messages_settings (
  singleton boolean primary key default true check (singleton),
  enabled boolean not null default false
);
insert into pico_private.direct_messages_settings(singleton) values (true);
revoke all on pico_private.direct_messages_settings from public, anon, authenticated;

create table public.direct_conversations (
  id uuid primary key default gen_random_uuid(),
  participant_low uuid not null references public.profiles(id) on delete cascade,
  participant_high uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default clock_timestamp(),
  last_message_at timestamptz,
  last_sequence bigint not null default 0 check (last_sequence >= 0),
  unique (participant_low, participant_high),
  check (participant_low < participant_high),
  check ((last_sequence = 0) = (last_message_at is null))
);
create index direct_conversations_low on public.direct_conversations(participant_low, last_message_at desc, id desc);
create index direct_conversations_high on public.direct_conversations(participant_high, last_message_at desc, id desc);

create table public.direct_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.direct_conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  sequence bigint not null check (sequence > 0),
  client_key uuid not null,
  body text not null check (char_length(body) between 1 and 2000 and body ~ '[^[:space:]]'),
  created_at timestamptz not null default clock_timestamp(),
  unique (conversation_id, sequence),
  unique (sender_id, client_key)
);
create index direct_messages_history on public.direct_messages(conversation_id, sequence desc);
create index direct_messages_sender on public.direct_messages(sender_id, created_at, id);

-- This is the caller's private read cursor, not a receipt shared with the peer.
create table public.direct_message_reads (
  conversation_id uuid not null references public.direct_conversations(id) on delete cascade,
  player_id uuid not null references public.profiles(id) on delete cascade,
  last_read_sequence bigint not null check (last_read_sequence > 0),
  read_at timestamptz not null default clock_timestamp(),
  primary key (conversation_id, player_id)
);
create index direct_message_reads_player on public.direct_message_reads(player_id, conversation_id);

alter table public.direct_conversations enable row level security;
alter table public.direct_messages enable row level security;
alter table public.direct_message_reads enable row level security;
revoke all on public.direct_conversations, public.direct_messages, public.direct_message_reads from public, anon, authenticated;
grant select on public.direct_conversations, public.direct_message_reads to authenticated;
grant select(id, conversation_id, sender_id, sequence, body, created_at) on public.direct_messages to authenticated;

create function pico_private.direct_messages_enabled() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce((select enabled from pico_private.direct_messages_settings where singleton), false);
$$;

create function pico_private.direct_peer_available(p_player uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select p_player is not null and p_player <> auth.uid()
    and pico_private.can_see_player(p_player)
    and exists(select 1 from public.profiles where id = p_player);
$$;

create function pico_private.can_read_direct_conversation(p_conversation uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select pico_private.direct_messages_enabled() and pico_private.active_account()
    and exists(select 1 from public.direct_conversations c where c.id = p_conversation
      and auth.uid() in (c.participant_low, c.participant_high)
      and pico_private.direct_peer_available(case when c.participant_low = auth.uid() then c.participant_high else c.participant_low end));
$$;

create function pico_private.can_send_direct_message(p_conversation uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select pico_private.can_read_direct_conversation(p_conversation)
    and exists(select 1 from public.direct_conversations c
      join public.connections f on f.follower_id = c.participant_low and f.followed_id = c.participant_high
      join public.connections r on r.follower_id = c.participant_high and r.followed_id = c.participant_low
      where c.id = p_conversation);
$$;
revoke all on function pico_private.direct_messages_enabled(), pico_private.direct_peer_available(uuid),
  pico_private.can_read_direct_conversation(uuid), pico_private.can_send_direct_message(uuid) from public, anon, authenticated;
grant execute on function pico_private.direct_messages_enabled(), pico_private.can_read_direct_conversation(uuid),
  pico_private.can_send_direct_message(uuid) to authenticated;

create policy direct_conversations_participants on public.direct_conversations for select to authenticated
  using ((select auth.uid()) in (participant_low, participant_high) and pico_private.can_read_direct_conversation(id));
create policy direct_messages_participants on public.direct_messages for select to authenticated
  using (pico_private.can_read_direct_conversation(conversation_id));
create policy direct_message_reads_own on public.direct_message_reads for select to authenticated
  using (player_id = (select auth.uid()) and pico_private.can_read_direct_conversation(conversation_id));

-- Lock referenced people before relationships, matching account-deletion
-- cascades. Keep this order in both creation/sending and the block trigger.
create function pico_private.lock_direct_people(p_first uuid, p_second uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform id from auth.users where id in (p_first, p_second) order by id for key share;
  perform id from public.profiles where id in (p_first, p_second) order by id for key share;
end;
$$;

-- A row-level DELETE trigger already owns its tuple lock; acquiring an advisory
-- lock there could deadlock with block_disconnect. Lock the two relationships in
-- the same order before that existing bilateral DELETE runs instead.
create function pico_private.lock_direct_relationship() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  perform pico_private.lock_direct_people(new.blocker_id, new.blocked_id);
  perform follower_id from public.connections
    where (follower_id = new.blocker_id and followed_id = new.blocked_id)
      or (follower_id = new.blocked_id and followed_id = new.blocker_id)
    order by follower_id, followed_id for update;
  return new;
end;
$$;
revoke all on function pico_private.lock_direct_people(uuid, uuid), pico_private.lock_direct_relationship() from public, anon, authenticated;
create trigger a_direct_relationship_lock before insert on public.blocks
  for each row execute function pico_private.lock_direct_relationship();

create function public.open_direct_conversation(p_player uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare first_player uuid := least(auth.uid(), p_player); second_player uuid := greatest(auth.uid(), p_player); found_id uuid; consent_links integer;
begin
  if not pico_private.active_account() or not pico_private.direct_messages_enabled() then raise insufficient_privilege; end if;
  if p_player is null or p_player = auth.uid() then raise check_violation; end if;
  perform pico_private.lock_direct_people(first_player, second_player);
  perform follower_id from public.connections
    where (follower_id = first_player and followed_id = second_player)
      or (follower_id = second_player and followed_id = first_player)
    order by follower_id, followed_id for key share;
  get diagnostics consent_links = row_count;
  perform pg_advisory_xact_lock(hashtextextended('pico-dm:' || first_player::text || ':' || second_player::text, 0));
  if not pico_private.direct_peer_available(p_player) then raise insufficient_privilege; end if;
  select id into found_id from public.direct_conversations where participant_low = first_player and participant_high = second_player;
  if found_id is not null then return jsonb_build_object('id', found_id); end if;
  if consent_links <> 2 then raise insufficient_privilege; end if;
  perform pico_private.consume_write('direct_conversation', 20, 3600);
  insert into public.direct_conversations(participant_low, participant_high) values(first_player, second_player) returning id into found_id;
  return jsonb_build_object('id', found_id);
end;
$$;

create function public.send_direct_message(p_conversation uuid, p_key uuid, p_body text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare conversation public.direct_conversations; previous public.direct_messages; sent public.direct_messages;
  normalized text := btrim(p_body, E' \t\n\r'); consent_links integer;
begin
  if not pico_private.active_account() or not pico_private.direct_messages_enabled() then raise insufficient_privilege; end if;
  if p_conversation is null or p_key is null or normalized is null
    or char_length(normalized) not between 1 and 2000 or normalized !~ '[^[:space:]]' then raise check_violation; end if;
  select * into conversation from public.direct_conversations where id = p_conversation and auth.uid() in (participant_low, participant_high);
  if conversation.id is null then raise insufficient_privilege; end if;
  perform pico_private.lock_direct_people(conversation.participant_low, conversation.participant_high);
  perform follower_id from public.connections
    where (follower_id = conversation.participant_low and followed_id = conversation.participant_high)
      or (follower_id = conversation.participant_high and followed_id = conversation.participant_low)
    order by follower_id, followed_id for key share;
  get diagnostics consent_links = row_count;
  if consent_links <> 2 then raise insufficient_privilege; end if;
  perform pg_advisory_xact_lock(hashtextextended('pico-dm:' || conversation.participant_low::text || ':' || conversation.participant_high::text, 0));
  if not pico_private.can_send_direct_message(p_conversation) then raise insufficient_privilege; end if;
  -- Serialize a sender's key across different conversations as well as retries.
  perform pg_advisory_xact_lock(hashtextextended('pico-dm-key:' || auth.uid()::text || ':' || p_key::text, 0));
  select * into previous from public.direct_messages where sender_id = auth.uid() and client_key = p_key;
  if previous.id is not null then
    if previous.conversation_id <> p_conversation or previous.body <> normalized then
      raise sqlstate 'P0409' using message = 'Message attempt already has different content';
    end if;
    return jsonb_build_object('id', previous.id, 'conversation_id', previous.conversation_id,
      'sender_id', previous.sender_id, 'body', previous.body, 'created_at', previous.created_at);
  end if;
  perform pico_private.consume_write('direct_message_minute', 30, 60);
  perform pico_private.consume_write('direct_message_hour', 600, 3600);
  update public.direct_conversations set last_sequence = last_sequence + 1,
    last_message_at = greatest(clock_timestamp(), last_message_at + interval '1 microsecond')
    where id = p_conversation returning * into conversation;
  insert into public.direct_messages(conversation_id, sender_id, sequence, client_key, body, created_at)
    values(p_conversation, auth.uid(), conversation.last_sequence, p_key, normalized, conversation.last_message_at) returning * into sent;
  return jsonb_build_object('id', sent.id, 'conversation_id', sent.conversation_id,
    'sender_id', sent.sender_id, 'body', sent.body, 'created_at', sent.created_at);
end;
$$;

-- Read queries run with the caller's grants/RLS and never mark anything read.
-- The inbox cursor references an immutable message, not a mutable conversation.
create function public.read_direct_conversations(p_before uuid default null) returns jsonb
language plpgsql stable security invoker set search_path = '' as $$
declare items jsonb; cursor_date timestamptz;
begin
  if not pico_private.active_account() or not pico_private.direct_messages_enabled() then raise insufficient_privilege; end if;
  if p_before is not null then
    select created_at into cursor_date from public.direct_messages where id = p_before;
    if cursor_date is null then raise insufficient_privilege; end if;
  end if;
  select coalesce(jsonb_agg(to_jsonb(q) - 'sort_date' - 'sort_id' order by q.sort_date desc, q.sort_id desc), '[]'::jsonb) into items
  from (
    select c.id, jsonb_build_object('id', p.id, 'username', p.username, 'display_name', p.display_name, 'avatar_path', p.avatar_path) peer,
      jsonb_build_object('id', m.id, 'body', m.body, 'sender_id', m.sender_id, 'created_at', m.created_at) last_message,
      (select count(*) from public.direct_messages incoming
        where incoming.conversation_id = c.id and incoming.sender_id <> auth.uid()
          and incoming.sequence > coalesce(r.last_read_sequence, 0)) unread_count,
      m.created_at sort_date, m.id sort_id
    from public.direct_conversations c
    join public.profiles p on p.id = case when c.participant_low = auth.uid() then c.participant_high else c.participant_low end
    join public.direct_messages m on m.conversation_id = c.id and m.sequence = c.last_sequence
    left join public.direct_message_reads r on r.conversation_id = c.id and r.player_id = auth.uid()
    where auth.uid() in (c.participant_low, c.participant_high)
      and (p_before is null or (m.created_at, m.id) < (cursor_date, p_before))
    order by m.created_at desc, m.id desc limit 21
  ) q;
  return jsonb_build_object(
    'items', case when jsonb_array_length(items) > 20 then items - 20 else items end,
    'nextCursor', case when jsonb_array_length(items) > 20 then items->19->'last_message'->>'id' end,
    'unreadCount', (select count(*) from public.direct_conversations c
      join public.direct_messages m on m.conversation_id = c.id
      left join public.direct_message_reads r on r.conversation_id = m.conversation_id and r.player_id = auth.uid()
      where auth.uid() in (c.participant_low, c.participant_high)
        and m.sender_id <> auth.uid() and m.sequence > coalesce(r.last_read_sequence, 0))
  );
end;
$$;

create function public.read_direct_messages(p_conversation uuid, p_before uuid default null) returns jsonb
language plpgsql stable security invoker set search_path = '' as $$
declare items jsonb; summary jsonb; cursor_sequence bigint;
begin
  if not pico_private.can_read_direct_conversation(p_conversation) then raise insufficient_privilege; end if;
  if p_before is not null then
    select sequence into cursor_sequence from public.direct_messages where id = p_before and conversation_id = p_conversation;
    if cursor_sequence is null then raise insufficient_privilege; end if;
  end if;
  select jsonb_build_object('id', c.id, 'can_send', pico_private.can_send_direct_message(c.id),
    'peer', jsonb_build_object('id', p.id, 'username', p.username, 'display_name', p.display_name, 'avatar_path', p.avatar_path)) into summary
  from public.direct_conversations c join public.profiles p
    on p.id = case when c.participant_low = auth.uid() then c.participant_high else c.participant_low end where c.id = p_conversation;
  select coalesce(jsonb_agg(to_jsonb(q) - 'sequence' order by q.sequence desc), '[]'::jsonb) into items
  from (select id, conversation_id, sender_id, body, created_at, sequence from public.direct_messages
    where conversation_id = p_conversation and (p_before is null or sequence < cursor_sequence)
    order by sequence desc limit 31) q;
  return jsonb_build_object('conversation', summary,
    'items', case when jsonb_array_length(items) > 30 then items - 30 else items end,
    'nextCursor', case when jsonb_array_length(items) > 30 then items->29->>'id' end);
end;
$$;

create function public.mark_direct_messages_read(p_conversation uuid, p_through uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare through_sequence bigint; previous_sequence bigint;
begin
  if not pico_private.can_read_direct_conversation(p_conversation) then raise insufficient_privilege; end if;
  if p_through is null then raise check_violation; end if;
  select sequence into through_sequence from public.direct_messages where id = p_through and conversation_id = p_conversation;
  if through_sequence is null then raise insufficient_privilege; end if;
  select last_read_sequence into previous_sequence from public.direct_message_reads where conversation_id = p_conversation and player_id = auth.uid();
  if previous_sequence >= through_sequence then return; end if;
  perform pico_private.consume_write('direct_message_read', 240, 3600);
  insert into public.direct_message_reads as r(conversation_id, player_id, last_read_sequence)
    values(p_conversation, auth.uid(), through_sequence)
    on conflict(conversation_id, player_id) do update set last_read_sequence = excluded.last_read_sequence,
      read_at = clock_timestamp() where r.last_read_sequence < excluded.last_read_sequence;
end;
$$;

-- Called only after the existing server-only, rate-limited account export.
-- It includes the subject's own writing and never another person's message body.
create function public.export_account_messages(p_user uuid) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare result jsonb;
begin
  if p_user is null or not exists(select 1 from auth.users where id = p_user) then raise insufficient_privilege; end if;
  select jsonb_build_object('direct_messages_sent', coalesce(jsonb_agg(to_jsonb(q)), '[]'::jsonb)) into result
    from (select id, conversation_id, body, created_at from public.direct_messages
      where sender_id = p_user order by created_at, id limit 5001) q;
  if jsonb_array_length(result->'direct_messages_sent') > 5000 or octet_length(result::text) > 8388608 then
    raise sqlstate 'P0413' using message = 'Account export too large';
  end if;
  return result;
end;
$$;

revoke all on function public.open_direct_conversation(uuid), public.send_direct_message(uuid, uuid, text),
  public.read_direct_conversations(uuid), public.read_direct_messages(uuid, uuid),
  public.mark_direct_messages_read(uuid, uuid), public.export_account_messages(uuid) from public, anon, authenticated;
grant execute on function public.open_direct_conversation(uuid), public.send_direct_message(uuid, uuid, text),
  public.read_direct_conversations(uuid), public.read_direct_messages(uuid, uuid), public.mark_direct_messages_read(uuid, uuid) to authenticated;
grant execute on function public.export_account_messages(uuid) to service_role;

comment on table public.direct_messages is 'Private text-only conversations. Pair consent is mutual following; no public read receipts, presence, automatic posting or push. Account deletion cascades the whole two-person conversation.';
commit;
