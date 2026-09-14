begin;
create or replace function public.publish_post_with_mentions(
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
  -- New editors place chosen mentions at the caret. Existing clients that still send
  -- a separate selection retain the previous suffix behavior during rollout.
  full_body := btrim(p_body);
  if labels is not null and not (
    (p_everyone and full_body ~* '(^|[^a-z0-9_])@todos($|[^a-z0-9_])')
    or (not p_everyone and not exists (
      select 1 from public.profiles p where p.id = any(people)
        and full_body !~* ('(^|[^a-z0-9_])@' || p.username || '($|[^a-z0-9_])')
    ))
  ) then full_body := full_body || E'\n\n' || labels; end if;
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
commit;
