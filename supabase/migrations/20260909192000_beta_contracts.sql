begin;
-- The trigger always replaces this value. A database default also communicates
-- to generated clients that callers must omit this protected column.
alter table public.blocks alter column blocked_name set default '';
create or replace function pico_private.can_see_player(target uuid) returns boolean
language sql stable security definer set search_path='' as $$
  select not exists(select 1 from public.account_deletions where player_id=target)
    and not exists(select 1 from public.blocks
      where (blocker_id=auth.uid() and blocked_id=target) or (blocked_id=auth.uid() and blocker_id=target));
$$;
commit;
