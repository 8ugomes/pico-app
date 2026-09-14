begin;

-- Video lives in a distinct private bucket. A signed, single-object upload avoids
-- routing up to 30 MiB through the application function's request body.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('post-videos','post-videos',false,31457280,array['video/mp4']);

create table public.post_video_assets (
 path text primary key,
 player_id uuid not null references public.profiles(id) on delete cascade,
 ready boolean not null default false,
 deleting boolean not null default false,
 byte_size integer check(byte_size between 1 and 31457280),
 created_at timestamptz not null default now(),
 check(path ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.mp4$' and split_part(path,'/',1)=player_id::text),
 check(not ready or byte_size is not null)
);
create index post_video_owner on public.post_video_assets(player_id,created_at desc);
alter table public.post_video_assets enable row level security;
revoke all on public.post_video_assets from public,anon,authenticated;
grant select on public.post_video_assets to authenticated;
grant all on public.post_video_assets to service_role;
create policy post_video_own on public.post_video_assets for select to authenticated
 using(player_id=(select auth.uid()) and (select pico_private.active_account()));

alter table public.posts add column video_path text references public.post_video_assets(path) on delete set null,
 add constraint post_one_media check(num_nonnulls(image_path,video_path)<=1);
create unique index post_video_single_use on public.posts(video_path) where video_path is not null;

create function public.reserve_post_video() returns text language plpgsql security definer set search_path='' as $$
declare result text;
begin
 if not pico_private.active_account() then raise insufficient_privilege;end if;
 perform pico_private.consume_write('media',20,3600);
 if (select count(*) from public.post_video_assets where player_id=auth.uid())>=8 then
  raise sqlstate 'P0429' using message='Remove an unused video before uploading another';
 end if;
 result:=auth.uid()::text||'/'||gen_random_uuid()::text||'.mp4';
 insert into public.post_video_assets(path,player_id) values(result,auth.uid());
 return result;
end;$$;

create function pico_private.check_post_video() returns trigger language plpgsql security definer set search_path='' as $$
declare asset public.post_video_assets;
begin
 if new.video_path is not null then
  select * into asset from public.post_video_assets where path=new.video_path for update;
  if asset.path is null or asset.player_id<>new.author_id or not asset.ready or asset.deleting then
   raise check_violation using message='Video unavailable';
  end if;
 end if;
 return new;
end;$$;
revoke all on function pico_private.check_post_video() from public,anon,authenticated;
create trigger post_video_reference before insert or update of video_path on public.posts
 for each row execute function pico_private.check_post_video();

create function public.can_read_post_video(p_path text) returns boolean language sql stable security definer set search_path='' as $$
 select pico_private.active_account() and exists(
  select 1 from public.post_video_assets m where m.path=p_path and m.ready and not m.deleting
   and (exists(select 1 from public.posts p where p.video_path=p_path and pico_private.can_read_post(p.id))
     or (m.player_id=auth.uid() and not exists(select 1 from public.posts p where p.video_path=p_path)))
 );$$;

create function public.claim_unused_post_video(p_path text) returns void language plpgsql security definer set search_path='' as $$
declare asset public.post_video_assets;
begin
 if not pico_private.active_account() then raise insufficient_privilege;end if;
 select * into asset from public.post_video_assets where path=p_path for update;
 if asset.path is null or asset.player_id<>auth.uid() then raise insufficient_privilege;end if;
 if exists(select 1 from public.posts where video_path=p_path) then raise sqlstate 'P0409';end if;
 update public.post_video_assets set deleting=true where path=p_path;
end;$$;

-- Leave the old RPC callable during rollout. The new RPC serializes on the
-- existing idempotency key and checks video on retries; the old digest by itself
-- does not know about this new media field.
create function public.publish_post_media(p_key uuid,p_body text,p_image_path text default null,
 p_arena uuid default null,p_sport uuid default null,p_audience text default 'beta',
 p_wall_arena uuid default null,p_groups uuid[] default '{}',p_video_path text default null)
returns uuid language plpgsql security definer set search_path='' as $$
declare result uuid; old_id uuid; old_image text; old_video text;
begin
 if not pico_private.active_account() or p_key is null then raise insufficient_privilege;end if;
 if p_image_path is not null and p_video_path is not null then raise check_violation;end if;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text||p_key::text,0));
 select id,image_path,video_path into old_id,old_image,old_video from public.posts
  where author_id=auth.uid() and idempotency_key=p_key;
 result:=public.publish_post(p_key,p_body,p_image_path,p_arena,p_sport,p_audience,p_wall_arena,p_groups);
 if old_id is not null then
  if old_image is distinct from p_image_path or old_video is distinct from p_video_path then raise sqlstate 'P0409';end if;
 else
  if p_video_path is not null then update public.posts set video_path=p_video_path where id=result;end if;
 end if;
 return result;
end;$$;

-- Keep the existing mention publisher as the single source of truth for
-- mention validation, inline labels, digest checks and recipient delivery.
-- The outer transaction is atomic: an invalid or claimed video rolls back the
-- post, mention publication marker and every notification together.
create function public.publish_post_with_mentions_media(
 p_key uuid,p_body text,p_image_path text default null,p_arena uuid default null,
 p_sport uuid default null,p_audience text default 'beta',p_wall_arena uuid default null,
 p_groups uuid[] default '{}',p_mention_community uuid default null,
 p_people uuid[] default '{}',p_everyone boolean default false,p_video_path text default null)
returns uuid language plpgsql security definer set search_path='' as $$
declare result uuid; old_id uuid; old_video text;
begin
 if not pico_private.active_account() or p_key is null then raise insufficient_privilege;end if;
 if p_image_path is not null and p_video_path is not null then raise check_violation;end if;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text||p_key::text,0));
 select id,video_path into old_id,old_video from public.posts
  where author_id=auth.uid() and idempotency_key=p_key;
 result:=public.publish_post_with_mentions(p_key,p_body,p_image_path,p_arena,p_sport,p_audience,
  p_wall_arena,p_groups,p_mention_community,p_people,p_everyone);
 if old_id is not null then
  if old_video is distinct from p_video_path then raise sqlstate 'P0409';end if;
 elsif p_video_path is not null then
  update public.posts set video_path=p_video_path where id=result;
 end if;
 return result;
end;$$;

create function public.share_played_game_media(p_id uuid,p_version integer,p_key uuid,p_body text default '',
 p_image_path text default null,p_audience text default 'beta',p_wall_arena uuid default null,
 p_groups uuid[] default '{}',p_video_path text default null)
returns uuid language plpgsql security definer set search_path='' as $$
declare result uuid; old_id uuid; old_video text;
begin
 if not pico_private.active_account() or p_key is null then raise insufficient_privilege;end if;
 if p_image_path is not null and p_video_path is not null then raise check_violation;end if;
 perform 1 from public.profiles where id=auth.uid() for update;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text||p_key::text,0));
 select post_id into old_id from pico_private.game_publications where player_id=auth.uid() and request_key=p_key;
 result:=public.share_played_game(p_id,p_version,p_key,p_body,p_image_path,p_audience,p_wall_arena,p_groups);
 if old_id is not null then
  select video_path into old_video from public.posts where id=old_id;
  if old_video is distinct from p_video_path then raise sqlstate 'P0409';end if;
 else
  if p_video_path is not null then update public.posts set video_path=p_video_path where id=result;end if;
 end if;
 return result;
end;$$;

-- Keep the existing result shape, adding only the new path for this release.
create or replace function public.read_repost_feed(p_offset integer default 0, p_arena uuid default null,
  p_community uuid default null, p_author uuid default null, p_post uuid default null)
returns jsonb language plpgsql stable security invoker set search_path = '' as $$
begin
  if not pico_private.active_account() then raise insufficient_privilege; end if;
  if p_offset is null or p_offset < 0 or p_offset > 10000 then raise check_violation; end if;
  return coalesce((select jsonb_agg(row_to_json(q)) from (
    select p.id, p.body, p.created_at, g.played_on game_played_on, p.author_id, p.image_path, p.video_path, p.audience,
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
end;$$;

-- A moderator can inspect only a reported post, with the same audit trail as
-- the existing photo exception; general private-group video access stays closed.
create function public.report_video(p_report uuid) returns text language plpgsql security definer set search_path='' as $$
declare result text;
begin
 if pico_private.platform_role() is null then raise insufficient_privilege;end if;
 select p.video_path into result from public.reports r join public.posts p on p.id=r.post_id
  join public.post_video_assets m on m.path=p.video_path
  where r.id=p_report and m.ready and not m.deleting;
 if result is not null then
  insert into pico_private.audit_events(actor_id,action,scope_id) values(auth.uid(),'report.inspect_video',p_report);
 end if;
 return result;
end;$$;

-- Server-only account export supplements the existing rate-limited archive.
-- Paths are references, not copies of the potentially large video bytes.
create function public.export_account_media_extra(p_user uuid) returns jsonb
 language sql stable security definer set search_path='' as $$
 select jsonb_build_object(
  'videos',coalesce((select jsonb_agg(row_to_json(q)) from
   (select v.path,v.byte_size,v.ready,v.created_at,p.id post_id from public.post_video_assets v
    left join public.posts p on p.video_path=v.path where v.player_id=p_user order by v.path limit 5001)q),'[]'::jsonb),
  'played_arena_marks',coalesce((select jsonb_agg(row_to_json(q)) from
   (select arena_id,created_at from public.arena_played_marks where player_id=p_user order by arena_id limit 5001)q),'[]'::jsonb)
 );$$;

revoke all on function public.reserve_post_video(),public.can_read_post_video(text),public.claim_unused_post_video(text),
 public.publish_post_media(uuid,text,text,uuid,uuid,text,uuid,uuid[],text),
 public.publish_post_with_mentions_media(uuid,text,text,uuid,uuid,text,uuid,uuid[],uuid,uuid[],boolean,text),
 public.share_played_game_media(uuid,integer,uuid,text,text,text,uuid,uuid[],text),public.report_video(uuid),
 public.export_account_media_extra(uuid)
 from public,anon,authenticated;
grant execute on function public.reserve_post_video(),public.can_read_post_video(text),public.claim_unused_post_video(text),
 public.publish_post_media(uuid,text,text,uuid,uuid,text,uuid,uuid[],text),
 public.publish_post_with_mentions_media(uuid,text,text,uuid,uuid,text,uuid,uuid[],uuid,uuid[],boolean,text),
 public.share_played_game_media(uuid,integer,uuid,text,text,text,uuid,uuid[],text),public.report_video(uuid)
 to authenticated;
grant execute on function public.export_account_media_extra(uuid) to service_role;
commit;
