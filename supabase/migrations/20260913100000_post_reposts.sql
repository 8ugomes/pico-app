begin;

-- References only: content, audience, media, likes and comments stay canonical.
create table public.post_reposts (
  post_id uuid not null references public.posts(id) on delete cascade,
  player_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (player_id, post_id)
);
create index post_reposts_post on public.post_reposts(post_id, created_at desc, player_id);
create index post_reposts_profile on public.post_reposts(player_id, created_at desc, post_id);
alter table public.post_reposts enable row level security;
revoke all on public.post_reposts from public, anon, authenticated;
grant select on public.post_reposts to authenticated;
grant all on public.post_reposts to service_role;

-- The viewer AND the republisher must retain access. Never impersonate another
-- JWT or broaden a private audience through a follower relationship.
create function pico_private.repost_visible(p_post uuid, p_player uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select pico_private.can_read_post(p_post)
    and pico_private.can_see_player(p_player)
    and exists (
      select 1 from public.posts p where p.id = p_post and p.author_id <> p_player
        and not exists (select 1 from public.blocks b
          where (b.blocker_id = p_player and b.blocked_id = p.author_id)
             or (b.blocked_id = p_player and b.blocker_id = p.author_id))
        and (p.arena_id is null or exists (
          select 1 from public.arenas a where a.id = p.arena_id and a.is_public and a.status <> 'archived'))
        and (p.audience = 'beta' or exists (
          select 1 from public.communities c where c.id = p.private_community_id
            and (c.owner_id = p_player or exists (
              select 1 from public.community_members m where m.community_id = c.id
                and m.player_id = p_player and m.status = 'active'))
            and not exists (select 1 from public.community_members m where m.community_id = c.id
              and m.player_id = p_player and m.status = 'suspended')
        ))
    );
$$;
revoke all on function pico_private.repost_visible(uuid, uuid) from public, anon, authenticated;
grant execute on function pico_private.repost_visible(uuid, uuid) to authenticated;
create policy reposts_read on public.post_reposts for select to authenticated
  using (pico_private.repost_visible(post_id, player_id));

create function public.set_post_repost(p_post uuid, p_reposted boolean)
returns boolean language plpgsql security definer set search_path = '' as $$
declare previous boolean;
begin
  if not pico_private.active_account() then raise insufficient_privilege; end if;
  if p_post is null or p_reposted is null then raise check_violation; end if;
  perform pg_advisory_xact_lock(hashtextextended('repost:' || auth.uid()::text || p_post::text, 0));
  if p_reposted and not pico_private.repost_visible(p_post, auth.uid()) then raise insufficient_privilege; end if;
  select exists(select 1 from public.post_reposts where post_id = p_post and player_id = auth.uid()) into previous;
  if previous = p_reposted then return previous; end if;
  perform pico_private.consume_write('reposts', 60, 3600);
  if p_reposted then
    insert into public.post_reposts(post_id, player_id) values(p_post, auth.uid());
  else
    -- A person may also withdraw a reference after losing access to the post.
    delete from public.post_reposts where post_id = p_post and player_id = auth.uid();
  end if;
  return p_reposted;
end;
$$;
revoke all on function public.set_post_repost(uuid, boolean) from public, anon, authenticated;
grant execute on function public.set_post_repost(uuid, boolean) to authenticated;

-- Keep read_social_feed untouched so the preceding release remains deployable.
create function public.read_repost_feed(p_offset integer default 0, p_arena uuid default null,
  p_community uuid default null, p_author uuid default null, p_post uuid default null)
returns jsonb language plpgsql stable security invoker set search_path = '' as $$
begin
  if not pico_private.active_account() then raise insufficient_privilege; end if;
  if p_offset is null or p_offset < 0 or p_offset > 10000 then raise check_violation; end if;
  return coalesce((select jsonb_agg(row_to_json(q)) from (
    select p.id, p.body, p.created_at, g.played_on game_played_on, p.author_id, p.image_path, p.audience,
      u.username, u.display_name, u.avatar_path,
      a.id arena_id, a.name arena_name, a.slug arena_slug, a.is_demo arena_is_demo,
      s.id sport_id, s.name sport_name, s.slug sport_slug,
      (select count(*) from public.post_likes l where l.post_id = p.id)::int like_count,
      (select count(*) from public.comments c where c.post_id = p.id)::int comment_count,
      exists(select 1 from public.post_likes l where l.post_id = p.id and l.player_id = auth.uid()) liked,
      exists(select 1 from public.post_reposts r where r.post_id = p.id and r.player_id = auth.uid()) reposted,
      pico_private.repost_visible(p.id, auth.uid()) can_repost,
      case when rp.player_id is not null then jsonb_build_object(
        'player_id', rp.player_id, 'username', rp.username, 'display_name', rp.display_name, 'created_at', rp.created_at)
        else null end repost,
      coalesce((select jsonb_agg(jsonb_build_object('arena_id', d.arena_id, 'community_id', d.community_id,
        'arena_name', da.name, 'arena_slug', da.slug, 'community_name', dc.name, 'community_slug', dc.slug))
        from public.post_destinations d left join public.arenas da on da.id = d.arena_id
        left join public.communities dc on dc.id = d.community_id where d.post_id = p.id), '[]'::jsonb) destinations
    from public.posts p
    join public.profiles u on u.id = p.author_id
    left join public.post_game_context g on g.post_id = p.id
    left join public.arenas a on a.id = p.arena_id
    left join public.sports s on s.id = p.sport_id
    left join lateral (
      select r.player_id, r.created_at, person.username, person.display_name
      from public.post_reposts r join public.profiles person on person.id = r.player_id
      where r.post_id = p.id and p_arena is null and p_community is null and p_post is null
        and ((p_author is not null and r.player_id = p_author)
          or (p_author is null and (r.player_id = auth.uid() or exists (
            select 1 from public.connections c where c.follower_id = auth.uid() and c.followed_id = r.player_id))))
      order by r.created_at desc, r.player_id desc limit 1
    ) rp on true
    where (p_arena is null or exists(select 1 from public.post_destinations d where d.post_id = p.id and d.arena_id = p_arena))
      and (p_community is null or exists(select 1 from public.post_destinations d where d.post_id = p.id and d.community_id = p_community))
      and (p_author is null or p.author_id = p_author or rp.player_id is not null)
      and (p_post is null or p.id = p_post)
    order by greatest(p.created_at, rp.created_at) desc, p.id desc limit 21 offset p_offset
  ) q), '[]'::jsonb);
end;
$$;
revoke all on function public.read_repost_feed(integer, uuid, uuid, uuid, uuid) from public, anon, authenticated;
grant execute on function public.read_repost_feed(integer, uuid, uuid, uuid, uuid) to authenticated;
comment on table public.post_reposts is 'Canonical post references; current original audience and republisher access apply on every read. Writes only via set_post_repost.';
commit;
