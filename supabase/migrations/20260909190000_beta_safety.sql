begin;
create schema if not exists pico_private;
revoke all on schema pico_private from public, anon, authenticated;
grant usage on schema pico_private to authenticated;

create table public.blocks (
  blocker_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  blocked_name text not null,
  created_at timestamptz not null default now(),
  primary key(blocker_id, blocked_id), check(blocker_id <> blocked_id)
);
create index blocks_reverse on public.blocks(blocked_id, blocker_id);
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  player_id uuid references public.profiles(id) on delete cascade,
  post_id uuid references public.posts(id) on delete cascade,
  comment_id uuid references public.comments(id) on delete cascade,
  reason text not null check(reason in ('spam','harassment','unsafe','other')),
  details text not null default '' check(char_length(details) <= 500),
  status text not null default 'pending' check(status in ('pending','dismissed','action_taken')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  check(num_nonnulls(player_id,post_id,comment_id) = 1)
);
create unique index reports_player_once on public.reports(reporter_id,player_id) where player_id is not null;
create unique index reports_post_once on public.reports(reporter_id,post_id) where post_id is not null;
create unique index reports_comment_once on public.reports(reporter_id,comment_id) where comment_id is not null;
create index reports_queue on public.reports(status,created_at);
create table public.account_deletions (
  player_id uuid primary key references public.profiles(id) on delete cascade,
  requested_at timestamptz not null default now()
);
alter table public.blocks enable row level security;
alter table public.reports enable row level security;
alter table public.account_deletions enable row level security;
revoke all on public.blocks, public.reports, public.account_deletions from public, anon, authenticated;
grant select, delete on public.blocks to authenticated;
grant insert(blocked_id) on public.blocks to authenticated;
grant select on public.reports, public.account_deletions to authenticated;
grant insert(player_id,post_id,comment_id,reason,details) on public.reports to authenticated;
grant all on public.blocks, public.reports, public.account_deletions to service_role;
create policy blocks_own_read on public.blocks for select to authenticated using(blocker_id=(select auth.uid()));
create policy blocks_own_insert on public.blocks for insert to authenticated with check(blocker_id=(select auth.uid()));
create policy blocks_own_delete on public.blocks for delete to authenticated using(blocker_id=(select auth.uid()));
create policy reports_own_read on public.reports for select to authenticated using(reporter_id=(select auth.uid()));
create policy reports_visible_insert on public.reports for insert to authenticated with check(
  reporter_id=(select auth.uid()) and (
    (player_id <> auth.uid() and exists(select 1 from public.profiles p where p.id=player_id)) or
    exists(select 1 from public.posts p where p.id=post_id and p.author_id <> auth.uid()) or
    exists(select 1 from public.comments c where c.id=comment_id and c.author_id <> auth.uid())
  )
);
create policy deletions_own_read on public.account_deletions for select to authenticated using(player_id=(select auth.uid()));

create table pico_private.write_limits (
  player_id uuid not null references auth.users(id) on delete cascade,
  action text not null, window_start timestamptz not null, used integer not null,
  primary key(player_id,action)
);
revoke all on pico_private.write_limits from public,anon,authenticated;
create function pico_private.active_account() returns boolean
language sql stable security definer set search_path='' as $$
  select auth.uid() is not null
    and exists(select 1 from public.profiles where id=auth.uid())
    and not exists(select 1 from public.account_deletions where player_id=auth.uid());
$$;
create function pico_private.can_see_player(target uuid) returns boolean
language sql stable security definer set search_path='' as $$
  select not exists(select 1 from public.blocks
    where (blocker_id=auth.uid() and blocked_id=target) or (blocked_id=auth.uid() and blocker_id=target));
$$;
revoke all on function pico_private.active_account(), pico_private.can_see_player(uuid) from public,anon,authenticated;
grant execute on function pico_private.active_account(), pico_private.can_see_player(uuid) to authenticated;

-- The atomic UPSERT serializes concurrent writes for a user/action. Only one
-- counter per action is retained; deleting a user also removes these counters.
create function pico_private.consume_write(p_action text,p_limit integer,p_seconds integer) returns void
language plpgsql security definer set search_path='' as $$
declare total integer; cutoff timestamptz;
begin
  if not pico_private.active_account() then raise insufficient_privilege; end if;
  cutoff := to_timestamp(floor(extract(epoch from clock_timestamp())/p_seconds)*p_seconds);
  insert into pico_private.write_limits as l(player_id,action,window_start,used)
  values(auth.uid(),p_action,cutoff,1)
  on conflict(player_id,action) do update set window_start=excluded.window_start,
    used=case when l.window_start=excluded.window_start then l.used+1 else 1 end
  returning used into total;
  if total > p_limit then raise sqlstate 'P0429' using message='Try again later'; end if;
end;
$$;
revoke all on function pico_private.consume_write(text,integer,integer) from public,anon,authenticated;

create function pico_private.guard_social_write() returns trigger
language plpgsql security definer set search_path='' as $$
begin
  -- Administrative migrations/seeds do not impersonate a client identity.
  if auth.uid() is null then return new; end if;
  case tg_table_name
    when 'posts' then perform pico_private.consume_write('posts',10,600);
    when 'comments' then perform pico_private.consume_write('comments',30,600);
    when 'post_likes' then perform pico_private.consume_write('likes',120,60);
    when 'connections' then perform pico_private.consume_write('connections',60,3600);
    when 'blocks' then perform pico_private.consume_write('blocks',30,3600);
    when 'reports' then perform pico_private.consume_write('reports',5,86400);
    when 'checkins' then perform pico_private.consume_write('checkins',30,3600);
    else perform pico_private.consume_write('profile',120,3600);
  end case;
  return new;
end;
$$;
revoke all on function pico_private.guard_social_write() from public,anon,authenticated;
do $$ declare t text; begin
  foreach t in array array['posts','comments','post_likes','connections','blocks','reports','checkins','profiles','player_sports','arena_members'] loop
    execute format('create trigger beta_write_guard before insert or update on public.%I for each row execute function pico_private.guard_social_write()',t);
  end loop;
  foreach t in array array['profiles','player_sports','arena_members','posts','post_likes','comments','checkins','connections','blocks','reports'] loop
    execute format('create policy beta_active_account on public.%I as restrictive for all to authenticated using ((select pico_private.active_account())) with check ((select pico_private.active_account()))',t);
  end loop;
end $$;
create policy profiles_block_filter on public.profiles as restrictive for select to authenticated using(pico_private.can_see_player(id));
create policy sports_block_filter on public.player_sports as restrictive for select to authenticated using(pico_private.can_see_player(player_id));
create policy members_block_filter on public.arena_members as restrictive for select to authenticated using(pico_private.can_see_player(player_id));
create policy posts_block_filter on public.posts as restrictive for select to authenticated using(pico_private.can_see_player(author_id));
create policy likes_block_filter on public.post_likes as restrictive for select to authenticated using(pico_private.can_see_player(player_id));
create policy comments_block_filter on public.comments as restrictive for select to authenticated using(pico_private.can_see_player(author_id));
create policy checkins_block_filter on public.checkins as restrictive for select to authenticated using(pico_private.can_see_player(player_id));
create policy connections_block_filter on public.connections as restrictive for all to authenticated
  using(pico_private.can_see_player(followed_id)) with check(pico_private.can_see_player(followed_id));

create function pico_private.apply_block() returns trigger
language plpgsql security definer set search_path='' as $$
begin
  select display_name into new.blocked_name from public.profiles where id=new.blocked_id;
  delete from public.connections where
    (follower_id=new.blocker_id and followed_id=new.blocked_id) or
    (follower_id=new.blocked_id and followed_id=new.blocker_id);
  return new;
end;
$$;
revoke all on function pico_private.apply_block() from public,anon,authenticated;
create trigger block_disconnect before insert on public.blocks for each row execute function pico_private.apply_block();
commit;
