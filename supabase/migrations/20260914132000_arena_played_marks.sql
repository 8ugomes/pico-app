begin;

-- A deliberate public statement, never inferred from the private played_games journal.
create table public.arena_played_marks (
  arena_id uuid not null references public.arenas(id) on delete cascade,
  player_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (arena_id, player_id)
);
create index arena_played_marks_player on public.arena_played_marks(player_id, arena_id);
alter table public.arena_played_marks enable row level security;
revoke all on public.arena_played_marks from public, anon, authenticated;
comment on table public.arena_played_marks is 'Explicit, reversible public claim of having played at an arena. No game dates, counts, presence or automatic posts.';

create function public.set_played_arena_mark(p_arena uuid, p_mark boolean) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not pico_private.active_account() then raise insufficient_privilege; end if;
  if p_arena is null or p_mark is null then raise check_violation; end if;
  perform pico_private.consume_write('arena_played_mark', 30, 3600);
  if p_mark then
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

create function public.read_played_arena_marks(p_player uuid default null) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare target uuid := coalesce(p_player, auth.uid());
begin
  if not pico_private.active_account() then raise insufficient_privilege; end if;
  if target is null or (target <> auth.uid() and not pico_private.can_see_player(target)) then return '[]'::jsonb; end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object('id', a.id, 'name', a.name, 'slug', a.slug) order by a.name, a.id)
    from public.arena_played_marks m join public.arenas a on a.id = m.arena_id
    where m.player_id = target and a.is_public and a.status = 'active' and not a.is_demo
  ), '[]'::jsonb);
end;
$$;

revoke all on function public.set_played_arena_mark(uuid, boolean), public.read_played_arena_marks(uuid) from public, anon, authenticated;
grant execute on function public.set_played_arena_mark(uuid, boolean), public.read_played_arena_marks(uuid) to authenticated;

commit;
