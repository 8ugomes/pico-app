begin;

-- Revoking a public declaration must not be held behind the quota for creating one.
create or replace function public.set_played_arena_mark(p_arena uuid, p_mark boolean) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not pico_private.active_account() then raise insufficient_privilege; end if;
  if p_arena is null or p_mark is null then raise check_violation; end if;
  if p_mark then
    perform pico_private.consume_write('arena_played_mark', 30, 3600);
    if not exists (
      select 1 from public.arenas a where a.id = p_arena and a.is_public and a.status = 'active' and not a.is_demo
    ) or exists (
      select 1 from public.arena_members m where m.arena_id = p_arena and m.player_id = auth.uid() and m.status = 'suspended'
    ) then raise check_violation; end if;
    insert into public.arena_played_marks(arena_id, player_id)
      values(p_arena, auth.uid()) on conflict do nothing;
  else
    delete from public.arena_played_marks where arena_id = p_arena and player_id = auth.uid();
  end if;
end;
$$;

-- The public profile reader still excludes hidden arenas. This separate reader
-- has no target parameter and returns only the caller's own declarations so
-- they can revoke a mark after the arena becomes inactive or private.
create function public.read_own_played_arena_marks() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  if not pico_private.active_account() then raise insufficient_privilege; end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', a.id, 'name', a.name,
      'visible', a.is_public and a.status = 'active' and not a.is_demo
    ) order by a.name, a.id)
    from public.arena_played_marks m join public.arenas a on a.id = m.arena_id
    where m.player_id = auth.uid()
  ), '[]'::jsonb);
end;
$$;

revoke all on function public.read_own_played_arena_marks() from public, anon, authenticated;
grant execute on function public.read_own_played_arena_marks() to authenticated;

commit;
