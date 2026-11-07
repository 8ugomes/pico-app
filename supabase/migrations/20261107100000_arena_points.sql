begin;

-- Points are derived from current rows, never stored: deleting a post, comment or like
-- removes its points, and there is nothing to keep in sync. Weights and daily caps
-- (per person, arena, kind and São Paulo day) are the whole policy, so spam cannot dominate.
--   check-in 5 (1/day) · post 2, with photo 4, with video 6 (3/day) · comment on someone else's post 1 (5/day)
--   like given 1 (5/day) · like received 1 (10/day) · repost of someone else's post 3 (2/day)
create function pico_private.arena_scored_events(p_arena uuid)
returns table(kind text, player_id uuid, day date, pts integer)
language sql stable security definer set search_path = '' as $$
  with ap as (
    select p.id, p.author_id, p.created_at, p.image_path, p.video_path
    from public.posts p
    where p.arena_id = p_arena and p.audience = 'beta' and p.moderated_at is null
  ), raw as (
    select 'checkin'::text as kind, c.player_id, c.played_on as day, c.created_at as ts, 5 as pts, 1 as cap
      from public.arena_checkins c where c.arena_id = p_arena
    union all
    select 'post', a.author_id, (a.created_at at time zone 'America/Sao_Paulo')::date, a.created_at,
      case when a.video_path is not null then 6 when a.image_path is not null then 4 else 2 end, 3 from ap a
    union all
    select 'comment', cm.author_id, (cm.created_at at time zone 'America/Sao_Paulo')::date, cm.created_at, 1, 5
      from public.comments cm join ap a on a.id = cm.post_id
      where cm.moderated_at is null and cm.author_id <> a.author_id
    union all
    select 'like_given', l.player_id, (l.created_at at time zone 'America/Sao_Paulo')::date, l.created_at, 1, 5
      from public.post_likes l join ap a on a.id = l.post_id where l.player_id <> a.author_id
    union all
    select 'like_received', a.author_id, (l.created_at at time zone 'America/Sao_Paulo')::date, l.created_at, 1, 10
      from public.post_likes l join ap a on a.id = l.post_id where l.player_id <> a.author_id
    union all
    select 'repost', r.player_id, (r.created_at at time zone 'America/Sao_Paulo')::date, r.created_at, 3, 2
      from public.post_reposts r join ap a on a.id = r.post_id where r.player_id <> a.author_id
  ), capped as (
    select raw.*, row_number() over (partition by raw.player_id, raw.day, raw.kind order by raw.ts) as seq from raw
  )
  select capped.kind, capped.player_id, capped.day, capped.pts from capped where capped.seq <= capped.cap;
$$;
revoke all on function pico_private.arena_scored_events(uuid) from public, anon, authenticated;

create function public.read_arena_points(p_arena uuid, p_period text) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  today date := (now() at time zone 'America/Sao_Paulo')::date;
  since date; entries jsonb; mine jsonb; total integer; breakdown jsonb;
begin
  if not pico_private.active_account() then raise insufficient_privilege; end if;
  if p_arena is null or p_period not in ('week', 'month', 'all') then raise check_violation; end if;
  if not exists (select 1 from public.arenas a where a.id = p_arena and a.is_public and a.status = 'active' and not a.is_demo) then
    return jsonb_build_object('period', p_period, 'since', null, 'entries', '[]'::jsonb, 'me', null, 'today_done', false,
      'recent_days', '[]'::jsonb, 'total_players', 0, 'breakdown', '{}'::jsonb);
  end if;
  since := case p_period when 'week' then date_trunc('week', today)::date when 'month' then date_trunc('month', today)::date else null end;
  with per as (
    select e.player_id, sum(e.pts) filter (where since is null or e.day >= since)::int points,
      sum(e.pts)::int all_points, max(e.day) filter (where since is null or e.day >= since) last_day
    from pico_private.arena_scored_events(p_arena) e group by e.player_id
  ), visible as (
    select per.*, p.username, p.display_name, p.avatar_path
    from per join public.profiles p on p.id = per.player_id
    where per.points > 0 and p.onboarding_completed and not p.is_demo
      and (per.player_id = auth.uid() or pico_private.can_see_player(per.player_id))
  ), ranked as (
    select v.*, rank() over (order by v.points desc, v.last_day asc) place from visible v
  )
  select coalesce(jsonb_agg(jsonb_build_object('rank', r.place, 'player_id', r.player_id, 'username', r.username,
      'name', r.display_name, 'avatar_path', r.avatar_path, 'points', r.points, 'me', r.player_id = auth.uid())
      order by r.place, r.username) filter (where r.place <= 20 or r.player_id = auth.uid()), '[]'::jsonb),
    (select jsonb_build_object('rank', m.place, 'points', m.points, 'all_points', m.all_points) from ranked m where m.player_id = auth.uid()),
    count(*)::int
  into entries, mine, total from ranked r;
  select coalesce(jsonb_object_agg(q.kind, jsonb_build_object('points', q.points, 'count', q.n)), '{}'::jsonb) into breakdown
  from (select e.kind, sum(e.pts)::int points, count(*)::int n from pico_private.arena_scored_events(p_arena) e
        where e.player_id = auth.uid() and (since is null or e.day >= since) group by e.kind) q;
  if mine is null then
    mine := (select jsonb_build_object('rank', null, 'points', 0, 'all_points', coalesce(sum(e.pts), 0)::int)
             from pico_private.arena_scored_events(p_arena) e where e.player_id = auth.uid());
  end if;
  return jsonb_build_object('period', p_period, 'since', since, 'entries', entries, 'me', mine, 'breakdown', breakdown,
    'today_done', exists (select 1 from public.arena_checkins where arena_id = p_arena and player_id = auth.uid() and played_on = today),
    'recent_days', coalesce((select jsonb_agg(c.played_on order by c.played_on desc) from public.arena_checkins c
      where c.arena_id = p_arena and c.player_id = auth.uid() and c.played_on >= today - 6), '[]'::jsonb),
    'total_players', total);
end;
$$;
revoke all on function public.read_arena_points(uuid, text) from public, anon, authenticated;
grant execute on function public.read_arena_points(uuid, text) to authenticated;

commit;
