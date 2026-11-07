begin;

-- Retrospective, voluntary "played here on this day". Not presence: no time of day,
-- no location, no automatic post. Separate from the private played_games journal
-- and from the public "Já joguei" mark.
create table public.arena_checkins (
  arena_id uuid not null references public.arenas(id) on delete cascade,
  player_id uuid not null references public.profiles(id) on delete cascade,
  played_on date not null,
  created_at timestamptz not null default now(),
  primary key (arena_id, player_id, played_on)
);
create index arena_checkins_ranking on public.arena_checkins(arena_id, played_on desc, player_id);
create index arena_checkins_player on public.arena_checkins(player_id, played_on desc);
alter table public.arena_checkins enable row level security;
revoke all on public.arena_checkins from public, anon, authenticated;
comment on table public.arena_checkins is 'Explicit, reversible, day-level claim of having played at an arena (today or up to 6 days back). Feeds rankings only; no presence, time or location.';

create function public.record_arena_checkin(p_arena uuid, p_day date default null) returns void
language plpgsql security definer set search_path = '' as $$
declare today date := (now() at time zone 'America/Sao_Paulo')::date; day date;
begin
  if not pico_private.active_account() then raise insufficient_privilege; end if;
  if p_arena is null then raise check_violation; end if;
  day := coalesce(p_day, today);
  if day > today or day < today - 6 then raise check_violation; end if;
  if not exists (
    select 1 from public.arenas a where a.id = p_arena and a.is_public and a.status = 'active' and not a.is_demo
  ) or exists (
    select 1 from public.arena_members m where m.arena_id = p_arena and m.player_id = auth.uid() and m.status = 'suspended'
  ) then raise check_violation; end if;
  perform pico_private.consume_write('arena_checkin', 30, 3600);
  insert into public.arena_checkins(arena_id, player_id, played_on)
    values(p_arena, auth.uid(), day) on conflict do nothing;
end;
$$;

-- Removing a claim never depends on the arena still being public or on the write quota.
create function public.remove_arena_checkin(p_arena uuid, p_day date) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not pico_private.active_account() then raise insufficient_privilege; end if;
  if p_arena is null or p_day is null then raise check_violation; end if;
  delete from public.arena_checkins where arena_id = p_arena and player_id = auth.uid() and played_on = p_day;
end;
$$;

create function public.read_arena_ranking(p_arena uuid, p_period text) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  today date := (now() at time zone 'America/Sao_Paulo')::date;
  since date; result jsonb; mine jsonb; total_players_holder integer;
begin
  if not pico_private.active_account() then raise insufficient_privilege; end if;
  if p_arena is null or p_period not in ('week', 'month', 'all') then raise check_violation; end if;
  if not exists (select 1 from public.arenas a where a.id = p_arena and a.is_public and a.status = 'active' and not a.is_demo) then
    return jsonb_build_object('period', p_period, 'since', null, 'entries', '[]'::jsonb, 'me', null, 'today_done', false, 'recent_days', '[]'::jsonb, 'total_players', 0);
  end if;
  since := case p_period when 'week' then date_trunc('week', today)::date when 'month' then date_trunc('month', today)::date else null end;
  with counted as (
    select c.player_id, count(*)::int days, max(c.played_on) last_day
    from public.arena_checkins c
    where c.arena_id = p_arena and (since is null or c.played_on >= since)
    group by c.player_id
  ), visible as (
    select c.*, p.username, p.display_name, p.avatar_path
    from counted c join public.profiles p on p.id = c.player_id
    where p.onboarding_completed and not p.is_demo
      and (c.player_id = auth.uid() or pico_private.can_see_player(c.player_id))
  ), ranked as (
    select v.*, rank() over (order by v.days desc, v.last_day asc) place from visible v
  )
  select coalesce(jsonb_agg(jsonb_build_object('rank', r.place, 'player_id', r.player_id, 'username', r.username,
      'name', r.display_name, 'avatar_path', r.avatar_path, 'days', r.days, 'last_day', r.last_day, 'me', r.player_id = auth.uid())
      order by r.place, r.username) filter (where r.place <= 20 or r.player_id = auth.uid()), '[]'::jsonb),
    (select jsonb_build_object('rank', m.place, 'days', m.days) from ranked m where m.player_id = auth.uid()),
    count(*)::int
  into result, mine, total_players_holder
  from ranked r;
  return jsonb_build_object('period', p_period, 'since', since, 'entries', result, 'me', mine,
    'today_done', exists (select 1 from public.arena_checkins where arena_id = p_arena and player_id = auth.uid() and played_on = today),
    'recent_days', coalesce((select jsonb_agg(c.played_on order by c.played_on desc) from public.arena_checkins c
      where c.arena_id = p_arena and c.player_id = auth.uid() and c.played_on >= today - 6), '[]'::jsonb),
    'total_players', total_players_holder);
end;
$$;

create function public.read_arenas_activity(p_period text) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  today date := (now() at time zone 'America/Sao_Paulo')::date;
  since date;
begin
  if not pico_private.active_account() then raise insufficient_privilege; end if;
  if p_period not in ('week', 'month') then raise check_violation; end if;
  since := case p_period when 'week' then date_trunc('week', today)::date else date_trunc('month', today)::date end;
  return jsonb_build_object('period', p_period, 'since', since, 'arenas', coalesce((
    select jsonb_agg(jsonb_build_object('id', q.id, 'slug', q.slug, 'name', q.name, 'neighborhood', q.neighborhood,
      'city', q.city, 'players', q.players, 'checkins', q.checkins) order by q.players desc, q.checkins desc, q.name)
    from (
      select a.id, a.slug, a.name, a.neighborhood, a.city,
        count(distinct c.player_id)::int players, count(*)::int checkins
      from public.arena_checkins c
      join public.arenas a on a.id = c.arena_id and a.is_public and a.status = 'active' and not a.is_demo
      join public.profiles p on p.id = c.player_id and p.onboarding_completed and not p.is_demo
      where c.played_on >= since and (c.player_id = auth.uid() or pico_private.can_see_player(c.player_id))
      group by a.id order by count(distinct c.player_id) desc, count(*) desc, a.name limit 5
    ) q), '[]'::jsonb));
end;
$$;

revoke all on function public.record_arena_checkin(uuid, date), public.remove_arena_checkin(uuid, date),
  public.read_arena_ranking(uuid, text), public.read_arenas_activity(text) from public, anon, authenticated;
grant execute on function public.record_arena_checkin(uuid, date), public.remove_arena_checkin(uuid, date),
  public.read_arena_ranking(uuid, text), public.read_arenas_activity(text) to authenticated;

-- Privacy export stays complete: wrap again instead of redefining the whole export.
alter function public.export_account_data(uuid) rename to export_account_data_pre_checkins;
revoke all on function public.export_account_data_pre_checkins(uuid) from public, anon, authenticated;
grant execute on function public.export_account_data_pre_checkins(uuid) to service_role;
create function public.export_account_data(p_user uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare result jsonb;
begin
  result := public.export_account_data_pre_checkins(p_user) || jsonb_build_object('arena_checkins', coalesce((
    select jsonb_agg(row_to_json(q)) from
      (select arena_id, played_on, created_at from public.arena_checkins where player_id = p_user order by played_on desc, arena_id limit 5001) q), '[]'::jsonb));
  if octet_length(result::text) > 8388608 then raise sqlstate 'P0413' using message = 'Account export too large'; end if;
  return result;
end;
$$;
revoke all on function public.export_account_data(uuid) from public, anon, authenticated;
grant execute on function public.export_account_data(uuid) to service_role;

commit;
