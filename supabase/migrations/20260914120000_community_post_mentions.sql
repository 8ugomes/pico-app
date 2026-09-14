begin;

alter table public.notifications add column post_id uuid references public.posts(id) on delete cascade;
alter table public.notifications drop constraint notifications_kind_check;
alter table public.notifications add constraint notifications_kind_check
  check (kind in ('community_join', 'post_mention', 'community_mention_all'));
alter table public.notifications add constraint notifications_post_kind_check
  check ((kind = 'community_join' and post_id is null) or (kind <> 'community_join' and post_id is not null));
create index notifications_post on public.notifications(post_id) where post_id is not null;
create unique index notifications_post_recipient on public.notifications(post_id, community_id, recipient_id) where post_id is not null;

create table pico_private.mention_publications (
  post_id uuid primary key references public.posts(id) on delete cascade,
  request_digest text not null
);
revoke all on pico_private.mention_publications from public, anon, authenticated;

create function pico_private.can_read_notification(p_recipient uuid, p_actor uuid, p_community uuid, p_post uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select pico_private.can_read_notification(p_recipient, p_actor, p_community)
    and (p_post is null or (pico_private.can_read_post(p_post)
      and exists(select 1 from public.post_destinations d where d.post_id = p_post and d.community_id = p_community)));
$$;
revoke all on function pico_private.can_read_notification(uuid, uuid, uuid, uuid) from public, anon, authenticated;
grant execute on function pico_private.can_read_notification(uuid, uuid, uuid, uuid) to authenticated;
alter policy notifications_own_read on public.notifications
  using (recipient_id = (select auth.uid())
    and pico_private.can_read_notification(recipient_id, actor_id, community_id, post_id));

create or replace function public.read_notifications(p_before uuid default null) returns jsonb
language plpgsql stable security invoker set search_path = '' as $$
declare items jsonb; cursor_date timestamptz;
begin
  if not pico_private.active_account() then raise insufficient_privilege; end if;
  if p_before is not null then select created_at into cursor_date from public.notifications where id = p_before; end if;
  select coalesce(jsonb_agg(to_jsonb(q) order by q.created_at desc, q.id desc), '[]'::jsonb) into items
  from (
    select n.id, n.kind, n.post_id, n.created_at, n.read_at, p.display_name actor_name,
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

create or replace function public.mark_notifications_read(p_ids uuid[]) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform pico_private.consume_write('notification_read', 120, 3600);
  if p_ids is null or cardinality(p_ids) not between 1 and 100 or array_position(p_ids, null) is not null then raise check_violation; end if;
  update public.notifications set read_at = now()
  where recipient_id = auth.uid() and id = any(p_ids) and read_at is null
    and pico_private.can_read_notification(recipient_id, actor_id, community_id, post_id);
end;
$$;

create or replace function public.mark_all_notifications_read() returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform pico_private.consume_write('notification_read', 120, 3600);
  update public.notifications set read_at = now()
  where recipient_id = auth.uid() and read_at is null
    and pico_private.can_read_notification(recipient_id, actor_id, community_id, post_id);
end;
$$;

-- Search only active people in a community the caller currently belongs to.
create function public.community_mention_candidates(p_community uuid, p_search text default '') returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  if p_community is null or p_search is null or char_length(p_search) > 80
    or pico_private.community_rank(p_community) < 10 or not pico_private.can_read_community(p_community) then
    raise insufficient_privilege;
  end if;
  return coalesce((select jsonb_agg(row_to_json(q)) from (
    select p.id, p.display_name name, p.username
    from public.community_members m join public.profiles p on p.id = m.player_id
    join pico_private.beta_admissions a on a.player_id = m.player_id and a.status = 'approved'
    where m.community_id = p_community and m.status = 'active' and m.player_id <> auth.uid()
      and not exists(select 1 from public.account_deletions x where x.player_id = m.player_id)
      and pico_private.can_see_player(m.player_id)
      and (p_search = '' or p.display_name ilike '%' || p_search || '%' or p.username ilike '%' || p_search || '%')
    order by p.display_name, p.id limit 20
  ) q), '[]'::jsonb);
end;
$$;
revoke all on function public.community_mention_candidates(uuid, text) from public, anon, authenticated;
grant execute on function public.community_mention_candidates(uuid, text) to authenticated;

-- The mention choice is part of the idempotency contract, in the same transaction as the post.
create function public.publish_post_with_mentions(
  p_key uuid, p_body text, p_image_path text default null, p_arena uuid default null,
  p_sport uuid default null, p_audience text default 'beta', p_wall_arena uuid default null,
  p_groups uuid[] default '{}', p_mention_community uuid default null,
  p_people uuid[] default '{}', p_everyone boolean default false
) returns uuid language plpgsql security definer set search_path = '' as $$
declare result uuid; previous text; fingerprint text; people uuid[]; labels text; full_body text;
begin
  if not pico_private.active_account() or p_key is null or p_groups is null or p_people is null or p_everyone is null
    or cardinality(p_people) > 20 or array_position(p_people, null) is not null then raise check_violation; end if;
  select coalesce(array_agg(distinct x order by x), '{}'::uuid[]) into people from unnest(p_people) x;
  if (p_mention_community is null and (cardinality(people) > 0 or p_everyone))
    or (p_mention_community is not null and (not p_mention_community = any(p_groups)
      or (cardinality(people) = 0 and not p_everyone) or (cardinality(people) > 0 and p_everyone))) then raise check_violation; end if;
  fingerprint := encode(sha256(convert_to(jsonb_build_array(btrim(p_body),p_image_path,p_arena,p_sport,p_audience,p_wall_arena,
    (select coalesce(array_agg(distinct x order by x), '{}'::uuid[]) from unnest(p_groups) x),
    p_mention_community,people,p_everyone)::text,'UTF8')),'hex');
  perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text || p_key::text, 0));
  select p.id, m.request_digest into result, previous from public.posts p
    left join pico_private.mention_publications m on m.post_id = p.id
    where p.author_id = auth.uid() and p.idempotency_key = p_key;
  if result is not null then
    if previous is distinct from fingerprint then raise sqlstate 'P0409'; end if;
    return result;
  end if;
  if p_mention_community is not null then
    if pico_private.community_rank(p_mention_community) < 10 or not pico_private.can_read_community(p_mention_community) then raise insufficient_privilege; end if;
    if p_everyone then
      labels := '@todos';
    else
      if exists(select 1 from unnest(people) person where person = auth.uid() or not exists(
        select 1 from public.community_members m
        join pico_private.beta_admissions a on a.player_id = m.player_id and a.status = 'approved'
        where m.community_id = p_mention_community and m.player_id = person and m.status = 'active'
          and not exists(select 1 from public.account_deletions x where x.player_id = person)
          and pico_private.can_see_player(person))) then raise insufficient_privilege; end if;
      select string_agg('@' || p.username, ' ' order by p.username) into labels from public.profiles p where p.id = any(people);
    end if;
  end if;
  full_body := btrim(p_body) || case when labels is null then '' else E'\n\n' || labels end;
  if char_length(full_body) not between 1 and 500 then raise check_violation; end if;
  result := public.publish_post(p_key, full_body, p_image_path, p_arena, p_sport, p_audience, p_wall_arena, p_groups);
  insert into pico_private.mention_publications(post_id, request_digest) values(result, fingerprint);
  if p_mention_community is not null then
    if p_everyone then perform pico_private.consume_write('community_mention_all', 3, 86400); end if;
    insert into public.notifications(recipient_id, actor_id, community_id, post_id, kind)
      select m.player_id, auth.uid(), p_mention_community, result,
        case when p_everyone then 'community_mention_all' else 'post_mention' end
      from public.community_members m
      join pico_private.beta_admissions a on a.player_id = m.player_id and a.status = 'approved'
      where m.community_id = p_mention_community and m.status = 'active' and m.player_id <> auth.uid()
        and (p_everyone or m.player_id = any(people))
        and not exists(select 1 from public.account_deletions x where x.player_id = m.player_id)
        and pico_private.can_see_player(m.player_id);
  end if;
  return result;
end;
$$;
revoke all on function public.publish_post_with_mentions(uuid,text,text,uuid,uuid,text,uuid,uuid[],uuid,uuid[],boolean)
  from public, anon, authenticated;
grant execute on function public.publish_post_with_mentions(uuid,text,text,uuid,uuid,text,uuid,uuid[],uuid,uuid[],boolean)
  to authenticated;
commit;
