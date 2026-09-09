begin;
alter table public.posts alter column arena_id drop not null,alter column sport_id drop not null;
alter table public.posts add constraint posts_arena_optional foreign key(arena_id) references public.arenas(id) on delete restrict,
 add constraint posts_sport_optional foreign key(sport_id) references public.sports(id) on delete restrict,
 add column audience text not null default 'beta' check(audience in ('beta','private')),
 add column private_community_id uuid references public.communities(id) on delete restrict,
 add column idempotency_key uuid, add column request_digest text,
 add column distribution_explicit boolean not null default false,
 add column moderated_at timestamptz,
 add constraint posts_private_anchor check((audience='beta' and private_community_id is null) or (audience='private' and private_community_id is not null));
create unique index posts_idempotency on public.posts(author_id,idempotency_key) where idempotency_key is not null;
create table public.post_destinations(
 id uuid primary key default gen_random_uuid(),post_id uuid not null references public.posts(id) on delete cascade,
 arena_id uuid references public.arenas(id) on delete restrict,community_id uuid references public.communities(id) on delete restrict,
 created_at timestamptz not null default now(),check(num_nonnulls(arena_id,community_id)=1)
);
create unique index post_arena_once on public.post_destinations(post_id,arena_id) where arena_id is not null;
create unique index post_community_once on public.post_destinations(post_id,community_id) where community_id is not null;
create index destinations_arena_feed on public.post_destinations(arena_id,post_id);create index destinations_community_feed on public.post_destinations(community_id,post_id);
insert into public.post_destinations(post_id,arena_id) select id,arena_id from public.posts where arena_id is not null;
create function pico_private.can_read_post(p_id uuid) returns boolean language sql stable security definer set search_path='' as $$
 select pico_private.active_account() and exists(select 1 from public.posts p where p.id=p_id and p.moderated_at is null and pico_private.can_see_player(p.author_id)
 and exists(select 1 from pico_private.beta_admissions where player_id=p.author_id and status='approved')
 and (p.arena_id is null or exists(select 1 from public.arenas where id=p.arena_id and is_public))
 and (p.audience='beta' or (pico_private.community_rank(p.private_community_id)>=10 and pico_private.can_read_community(p.private_community_id))));
$$;
revoke all on function pico_private.can_read_post(uuid) from public,anon,authenticated;grant execute on function pico_private.can_read_post(uuid) to authenticated;
drop policy posts_read on public.posts;create policy posts_read on public.posts for select to authenticated using(pico_private.can_read_post(id));
drop policy posts_insert_own on public.posts;create policy posts_insert_own on public.posts for insert to authenticated with check(author_id=auth.uid() and audience='beta' and (arena_id is null or exists(select 1 from public.arenas where id=arena_id and is_public)));
drop policy posts_update_own on public.posts;create policy posts_update_own on public.posts for update to authenticated using(author_id=auth.uid() and pico_private.can_read_post(id)) with check(author_id=auth.uid() and pico_private.can_read_post(id));
alter table public.post_destinations enable row level security;revoke all on public.post_destinations from public,anon,authenticated;grant select on public.post_destinations to authenticated;
create policy destinations_read on public.post_destinations for select to authenticated using(pico_private.can_read_post(post_id) and (community_id is null or pico_private.can_read_community(community_id)));
create function pico_private.legacy_post_distribution() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if not new.distribution_explicit and new.arena_id is not null then
  if auth.uid() is not null and not exists(select 1 from public.arena_members where arena_id=new.arena_id and player_id=auth.uid() and status='active') and pico_private.arena_rank(new.arena_id)<30 then raise insufficient_privilege;end if;
  insert into public.post_destinations(post_id,arena_id) values(new.id,new.arena_id);
 end if;return new;
end;
$$;
revoke all on function pico_private.legacy_post_distribution() from public,anon,authenticated;
create trigger legacy_post_distribution after insert on public.posts for each row execute function pico_private.legacy_post_distribution();
create function public.publish_post(p_key uuid,p_body text,p_image_path text default null,p_arena uuid default null,p_sport uuid default null,p_audience text default 'beta',p_wall_arena uuid default null,p_groups uuid[] default '{}') returns uuid language plpgsql security definer set search_path='' as $$
declare result uuid; fingerprint text;previous text;group_id uuid;private_group uuid;groups uuid[];
begin
 if not pico_private.active_account() or p_key is null then raise insufficient_privilege;end if;
 if p_body is null or char_length(btrim(p_body)) not between 1 and 500 or p_audience not in ('beta','private') or p_audience is null or cardinality(p_groups)>5 or p_groups is null then raise check_violation;end if;
 select coalesce(array_agg(distinct x order by x),'{}'::uuid[]) into groups from unnest(p_groups)x;
 fingerprint:=encode(sha256(convert_to(jsonb_build_array(btrim(p_body),p_image_path,p_arena,p_sport,p_audience,p_wall_arena,groups)::text,'UTF8')),'hex');
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text||p_key::text,0));
 select id,request_digest into result,previous from public.posts where author_id=auth.uid() and idempotency_key=p_key;
 if result is not null then if previous<>fingerprint then raise sqlstate 'P0409';end if;return result;end if;
 if p_arena is not null and not exists(select 1 from public.arenas where id=p_arena and is_public and status='active') then raise insufficient_privilege;end if;
 if p_arena is not null and p_sport is not null and not exists(select 1 from public.arena_sports where arena_id=p_arena and sport_id=p_sport and enabled) then raise check_violation;end if;
 if p_wall_arena is not null then
  perform 1 from public.arenas where id=p_wall_arena and is_public and status='active' for update;if not found then raise insufficient_privilege;end if;
  if p_audience<>'beta' or (not exists(select 1 from public.arena_members where arena_id=p_wall_arena and player_id=auth.uid() and status='active') and pico_private.arena_rank(p_wall_arena)<30) then raise insufficient_privilege;end if;
 end if;
 if p_audience='private' and (cardinality(groups)<>1 or p_wall_arena is not null) then raise check_violation;end if;
 foreach group_id in array groups loop
  perform 1 from public.communities where id=group_id and status='active' and visibility=p_audience for update;
  if not found or pico_private.community_rank(group_id)<10 or not pico_private.can_read_community(group_id) then raise insufficient_privilege;end if;
  if p_audience='private' then private_group:=group_id;end if;
 end loop;
 insert into public.posts(author_id,arena_id,sport_id,body,image_path,audience,private_community_id,idempotency_key,request_digest,distribution_explicit) values(auth.uid(),p_arena,p_sport,btrim(p_body),p_image_path,p_audience,private_group,p_key,fingerprint,true) returning id into result;
 if p_wall_arena is not null then insert into public.post_destinations(post_id,arena_id) values(result,p_wall_arena);end if;
 foreach group_id in array groups loop insert into public.post_destinations(post_id,community_id) values(result,group_id);end loop;
 return result;
end;
$$;
create function public.publication_options() returns jsonb language sql stable security invoker set search_path='' as $$
 select jsonb_build_object('arenas',coalesce((select jsonb_agg(jsonb_build_object('id',a.id,'slug',a.slug,'name',a.name)) from public.arenas a where a.status='active' and (pico_private.arena_rank(a.id)>=30 or exists(select 1 from public.arena_members m where m.arena_id=a.id and m.player_id=auth.uid() and m.status='active'))),'[]'::jsonb),'communities',coalesce((select jsonb_agg(jsonb_build_object('id',c.id,'slug',c.slug,'name',c.name,'visibility',c.visibility)) from public.communities c where c.status='active' and pico_private.community_rank(c.id)>=10),'[]'::jsonb));
$$;
create function public.remove_distribution(p_post uuid,p_arena uuid default null,p_community uuid default null) returns void language plpgsql security definer set search_path='' as $$
begin
 perform pico_private.consume_write('moderation',60,3600);
 if num_nonnulls(p_arena,p_community)<>1 or (p_arena is not null and pico_private.arena_rank(p_arena)<20) or (p_community is not null and pico_private.community_rank(p_community)<20) then raise insufficient_privilege;end if;
 delete from public.post_destinations where post_id=p_post and ((p_arena is not null and arena_id=p_arena) or (p_community is not null and community_id=p_community));
 insert into pico_private.audit_events(actor_id,action,scope_id,target_id) values(auth.uid(),'post.distribution.remove',coalesce(p_arena,p_community),p_post);
end;
$$;
create function public.read_social_feed(p_offset integer default 0,p_arena uuid default null,p_community uuid default null,p_author uuid default null,p_post uuid default null) returns jsonb language plpgsql stable security invoker set search_path='' as $$
begin
 if not pico_private.active_account() then raise insufficient_privilege;end if;
 if p_offset is null or p_offset<0 or p_offset>10000 then raise check_violation;end if;
 return coalesce((select jsonb_agg(row_to_json(q)) from(select p.id,p.body,p.created_at,p.author_id,p.image_path,p.audience,u.username,u.display_name,u.avatar_path,
 a.id arena_id,a.name arena_name,a.slug arena_slug,a.is_demo arena_is_demo,s.id sport_id,s.name sport_name,s.slug sport_slug,
 (select count(*) from public.post_likes l where l.post_id=p.id)::int like_count,(select count(*) from public.comments c where c.post_id=p.id)::int comment_count,
 exists(select 1 from public.post_likes l where l.post_id=p.id and l.player_id=auth.uid()) liked,
 coalesce((select jsonb_agg(jsonb_build_object('arena_id',d.arena_id,'community_id',d.community_id)) from public.post_destinations d where d.post_id=p.id),'[]'::jsonb) destinations
 from public.posts p join public.profiles u on u.id=p.author_id left join public.arenas a on a.id=p.arena_id left join public.sports s on s.id=p.sport_id
 where (p_arena is null or exists(select 1 from public.post_destinations d where d.post_id=p.id and d.arena_id=p_arena))
 and (p_community is null or exists(select 1 from public.post_destinations d where d.post_id=p.id and d.community_id=p_community)) and (p_author is null or p.author_id=p_author) and (p_post is null or p.id=p_post)
 order by p.created_at desc,p.id desc limit 21 offset p_offset)q),'[]'::jsonb);
end;
$$;
-- The previous feed signature remains callable by the previously published app.
create or replace function public.read_feed(p_offset integer default 0,p_arena_id uuid default null)
returns table(id uuid,body text,created_at timestamptz,author_id uuid,username text,display_name text,arena_id uuid,arena_name text,arena_slug text,arena_is_demo boolean,sport_id uuid,sport_name text,sport_slug public.sport_slug,like_count integer,comment_count integer,liked boolean)
language plpgsql stable security invoker set search_path='' as $$
begin
 if auth.uid() is null then raise insufficient_privilege;end if;if p_offset is null or p_offset<0 or p_offset>10000 then raise check_violation;end if;
 return query select p.id,p.body,p.created_at,p.author_id,u.username,u.display_name,a.id,a.name,a.slug,a.is_demo,s.id,s.name,s.slug,
 (select count(*)::int from public.post_likes l where l.post_id=p.id),(select count(*)::int from public.comments c where c.post_id=p.id),exists(select 1 from public.post_likes l where l.post_id=p.id and l.player_id=auth.uid())
 from public.posts p join public.profiles u on u.id=p.author_id left join public.arenas a on a.id=p.arena_id left join public.sports s on s.id=p.sport_id
 where p_arena_id is null or exists(select 1 from public.post_destinations d where d.post_id=p.id and d.arena_id=p_arena_id) order by p.created_at desc,p.id desc limit 21 offset p_offset;
end;
$$;
create or replace function public.can_read_media(p_bucket text,p_path text) returns boolean language sql stable security definer set search_path='' as $$
 select pico_private.active_account() and exists(select 1 from public.media_assets m where m.bucket=p_bucket and m.path=p_path and m.ready) and (
 (p_bucket='post-media' and (exists(select 1 from public.posts p where p.image_path=p_path and pico_private.can_read_post(p.id)) or (exists(select 1 from public.media_assets m where m.path=p_path and m.player_id=auth.uid()) and not exists(select 1 from public.posts p where p.image_path=p_path))))
 or (p_bucket='avatars' and (exists(select 1 from public.profiles p where p.avatar_path=p_path and pico_private.can_see_player(p.id) and exists(select 1 from pico_private.beta_admissions a where a.player_id=p.id and a.status='approved')) or (exists(select 1 from public.media_assets m where m.path=p_path and m.player_id=auth.uid()) and not exists(select 1 from public.profiles p where p.avatar_path=p_path)))));
$$;
revoke all on function public.publish_post(uuid,text,text,uuid,uuid,text,uuid,uuid[]),public.publication_options(),public.remove_distribution(uuid,uuid,uuid),public.read_social_feed(integer,uuid,uuid,uuid,uuid) from public,anon,authenticated;
grant execute on function public.publish_post(uuid,text,text,uuid,uuid,text,uuid,uuid[]),public.publication_options(),public.remove_distribution(uuid,uuid,uuid),public.read_social_feed(integer,uuid,uuid,uuid,uuid) to authenticated;
commit;
