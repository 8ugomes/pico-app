begin;
create function public.start_checkin(arena_id uuid, sport_id uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare caller uuid := auth.uid(); stamp timestamptz; result uuid;
begin
  if caller is null then raise insufficient_privilege using message = 'Authentication required'; end if;
  -- Same lock in start/end serializes simultaneous actions, including the first check-in.
  perform 1 from public.profiles p where p.id = caller for update;
  if not found then raise foreign_key_violation using message = 'Profile missing'; end if;
  perform 1 from public.arenas a join public.arena_sports s on s.arena_id = a.id
    where a.id = start_checkin.arena_id and a.is_public and s.sport_id = start_checkin.sport_id
    for share of a, s;
  if not found then raise check_violation using message = 'Arena or sport unavailable'; end if;
  stamp := clock_timestamp();
  update public.checkins set ended_at = greatest(stamp, started_at) where player_id = caller and ended_at is null;
  insert into public.checkins(player_id, arena_id, sport_id, started_at, expires_at)
    values(caller, start_checkin.arena_id, start_checkin.sport_id, stamp, stamp + interval '2 hours') returning id into result;
  return result;
end;
$$;
create function public.end_checkin() returns void language plpgsql security definer set search_path = '' as $$
declare caller uuid := auth.uid();
begin
  if caller is null then raise insufficient_privilege using message = 'Authentication required'; end if;
  perform 1 from public.profiles where id = caller for update;
  update public.checkins set ended_at = greatest(clock_timestamp(), started_at) where player_id = caller and ended_at is null;
end;
$$;
revoke all on function public.start_checkin(uuid,uuid), public.end_checkin() from public, anon, authenticated;
grant execute on function public.start_checkin(uuid,uuid), public.end_checkin() to authenticated;
comment on table public.checkins is 'Voluntary presence, at most two hours. Only start_checkin/end_checkin write, using auth.uid().';
commit;
