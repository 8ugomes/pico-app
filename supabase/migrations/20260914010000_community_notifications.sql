begin;

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  actor_id uuid not null references public.profiles(id) on delete cascade,
  community_id uuid not null references public.communities(id) on delete cascade,
  kind text not null default 'community_join' check (kind = 'community_join'),
  created_at timestamptz not null default now(),
  read_at timestamptz,
  check (recipient_id <> actor_id)
);
create index notifications_recipient_date on public.notifications(recipient_id, created_at desc, id desc);
create index notifications_unread on public.notifications(recipient_id) where read_at is null;
create index notifications_community on public.notifications(community_id);
create index notifications_actor on public.notifications(actor_id);
alter table public.notifications enable row level security;
revoke all on public.notifications from public, anon, authenticated;
grant select on public.notifications to authenticated;

-- Recheck current membership, admission, deletion and bilateral blocks on every read.
create function pico_private.can_read_notification(p_recipient uuid, p_actor uuid, p_community uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select p_recipient = auth.uid() and pico_private.active_account()
    and pico_private.can_see_player(p_actor)
    and exists(select 1 from pico_private.beta_admissions where player_id = p_actor and status = 'approved')
    and not exists(select 1 from public.account_deletions where player_id = p_actor)
    and exists(select 1 from public.communities where id = p_community and status = 'active')
    and exists(select 1 from public.community_members where community_id = p_community and player_id = p_recipient and status = 'active')
    and exists(select 1 from public.community_members where community_id = p_community and player_id = p_actor and status = 'active');
$$;
revoke all on function pico_private.can_read_notification(uuid, uuid, uuid) from public, anon, authenticated;
grant execute on function pico_private.can_read_notification(uuid, uuid, uuid) to authenticated;
create policy notifications_own_read on public.notifications for select to authenticated
  using (pico_private.can_read_notification(recipient_id, actor_id, community_id));

create function pico_private.notify_community_join() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'DELETE' then
    delete from public.notifications where community_id = old.community_id and recipient_id = old.player_id;
    return old;
  end if;
  if new.status <> 'active' then
    -- Leaving/removal clears the recipient's old group inbox, including on reentry.
    delete from public.notifications where community_id = new.community_id and recipient_id = new.player_id;
    return new;
  end if;
  if tg_op = 'UPDATE' then
    if old.status = 'active' then return new; end if;
  end if;
  if not exists(select 1 from public.communities where id = new.community_id and status = 'active')
    or not exists(select 1 from pico_private.beta_admissions where player_id = new.player_id and status = 'approved')
    or exists(select 1 from public.account_deletions where player_id = new.player_id) then return new; end if;
  insert into public.notifications(recipient_id, actor_id, community_id)
    select m.player_id, new.player_id, new.community_id
    from public.community_members m
    join pico_private.beta_admissions a on a.player_id = m.player_id and a.status = 'approved'
    where m.community_id = new.community_id and m.status = 'active' and m.player_id <> new.player_id
      and not exists(select 1 from public.account_deletions where player_id = m.player_id)
      and not exists(select 1 from public.blocks where
        (blocker_id = m.player_id and blocked_id = new.player_id) or
        (blocked_id = m.player_id and blocker_id = new.player_id));
  return new;
end;
$$;
revoke all on function pico_private.notify_community_join() from public, anon, authenticated;
create trigger community_join_notifications after insert or update of status or delete on public.community_members
  for each row execute function pico_private.notify_community_join();

-- A UUID cursor is resolved only inside the caller's RLS-filtered inbox.
create function public.read_notifications(p_before uuid default null) returns jsonb
language plpgsql stable security invoker set search_path = '' as $$
declare items jsonb; cursor_date timestamptz;
begin
  if not pico_private.active_account() then raise insufficient_privilege; end if;
  if p_before is not null then
    select created_at into cursor_date from public.notifications where id = p_before;
  end if;
  select coalesce(jsonb_agg(to_jsonb(q) order by q.created_at desc, q.id desc), '[]'::jsonb) into items
  from (
    select n.id, n.kind, n.created_at, n.read_at, p.display_name actor_name,
      c.name community_name, c.slug community_slug
    from public.notifications n
    join public.profiles p on p.id = n.actor_id
    join public.communities c on c.id = n.community_id
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

-- Clients can change only their read state; no insert/update table grant.
create function public.mark_notifications_read(p_ids uuid[]) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform pico_private.consume_write('notification_read', 120, 3600);
  if p_ids is null or cardinality(p_ids) not between 1 and 100 or array_position(p_ids, null) is not null then
    raise check_violation;
  end if;
  update public.notifications set read_at = now()
  where id = any(p_ids) and read_at is null
    and pico_private.can_read_notification(recipient_id, actor_id, community_id);
end;
$$;

create function public.mark_all_notifications_read() returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform pico_private.consume_write('notification_read', 120, 3600);
  update public.notifications set read_at = now()
  where recipient_id = auth.uid() and read_at is null
    and pico_private.can_read_notification(recipient_id, actor_id, community_id);
end;
$$;
revoke all on function public.read_notifications(uuid), public.mark_notifications_read(uuid[]), public.mark_all_notifications_read() from public, anon, authenticated;
grant execute on function public.read_notifications(uuid), public.mark_notifications_read(uuid[]), public.mark_all_notifications_read() to authenticated;
commit;
