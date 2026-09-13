begin;
set local lock_timeout = '5s';
set local statement_timeout = '30s';

-- Retiring the three fictional catalog entries must not hide players' originals.
-- This exception does not apply to real arenas, other demo IDs or active/private arenas.
-- Arena SELECT policies still hide these examples; their historical FKs stay intact.
create function pico_private.is_retired_demo_arena(p_arena uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.arenas a where a.id=p_arena
    and a.id in ('20000000-0000-4000-8000-000000000001'::uuid,
                 '20000000-0000-4000-8000-000000000002'::uuid,
                 '20000000-0000-4000-8000-000000000003'::uuid)
    and a.is_demo and not a.is_public and a.status='archived');
$$;
revoke all on function pico_private.is_retired_demo_arena(uuid) from public,anon,authenticated;
grant execute on function pico_private.is_retired_demo_arena(uuid) to authenticated;

create or replace function pico_private.post_audience_visible(p_author uuid,p_arena uuid,p_audience text,p_group uuid,p_moderated timestamptz) returns boolean language sql stable security definer set search_path='' as $$
 select pico_private.active_account() and p_moderated is null and pico_private.can_see_player(p_author)
 and exists(select 1 from pico_private.beta_admissions where player_id=p_author and status='approved')
 and (p_arena is null or pico_private.is_retired_demo_arena(p_arena) or exists(select 1 from public.arenas where id=p_arena and is_public and (status<>'archived' or pico_private.arena_rank(id)>=20)))
 and (p_audience='beta' or (p_audience='private' and pico_private.community_rank(p_group)>=10 and pico_private.can_read_community(p_group)));
$$;

create or replace function pico_private.repost_visible(p_post uuid, p_player uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select pico_private.can_read_post(p_post)
    and pico_private.can_see_player(p_player)
    and exists (
      select 1 from public.posts p where p.id = p_post and p.author_id <> p_player
        and not exists (select 1 from public.blocks b
          where (b.blocker_id = p_player and b.blocked_id = p.author_id)
             or (b.blocked_id = p_player and b.blocker_id = p.author_id))
        and (p.arena_id is null or pico_private.is_retired_demo_arena(p.arena_id) or exists (
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

commit;
