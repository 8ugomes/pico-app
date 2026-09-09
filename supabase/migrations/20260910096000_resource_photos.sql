begin;
alter table public.media_assets add column deleting boolean not null default false;
create or replace function pico_private.check_media_reference() returns trigger language plpgsql security definer set search_path='' as $$
declare target text; owner_uuid uuid; target_bucket text; asset public.media_assets;
begin
 if tg_table_name='profiles' then target:=new.avatar_path;owner_uuid:=new.id;target_bucket:='avatars';else target:=new.image_path;owner_uuid:=new.author_id;target_bucket:='post-media';end if;
 if target is not null then
  select * into asset from public.media_assets where path=target for update;
  if asset.path is null or asset.player_id<>owner_uuid or asset.bucket<>target_bucket or not asset.ready or asset.deleting then raise check_violation using message='Image unavailable';end if;
 end if;return new;
end;$$;
create function public.claim_unused_media(p_bucket text,p_path text) returns void language plpgsql security definer set search_path='' as $$
declare asset public.media_assets;
begin
 if not pico_private.active_account() then raise insufficient_privilege;end if;
 select * into asset from public.media_assets where path=p_path for update;
 if asset.path is null or asset.player_id<>auth.uid() or asset.bucket<>p_bucket then raise insufficient_privilege;end if;
 if exists(select 1 from public.profiles where avatar_path=p_path) or exists(select 1 from public.posts where image_path=p_path) then raise sqlstate 'P0409';end if;
 update public.media_assets set deleting=true where path=p_path;
end;$$;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('entity-media','entity-media',false,3145728,array['image/webp']);
create table public.entity_media_assets(
 path text primary key,arena_id uuid references public.arenas(id) on delete cascade,community_id uuid references public.communities(id) on delete cascade,
 slot text not null check(slot in ('avatar','cover')),uploaded_by uuid references public.profiles(id) on delete set null,ready boolean not null default false,deleting boolean not null default false,created_at timestamptz not null default now(),
 check(num_nonnulls(arena_id,community_id)=1),check(path ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.webp$' and split_part(path,'/',1)=coalesce(arena_id,community_id)::text)
);
create index entity_media_scope on public.entity_media_assets(coalesce(arena_id,community_id));
alter table public.entity_media_assets enable row level security;
revoke all on public.entity_media_assets from public,anon,authenticated;
grant select(path,arena_id,community_id,slot,ready,deleting) on public.entity_media_assets to authenticated;
grant all on public.entity_media_assets to service_role;
alter table public.arenas add constraint arena_avatar_asset foreign key(avatar_path) references public.entity_media_assets(path),add constraint arena_cover_asset foreign key(cover_path) references public.entity_media_assets(path);
alter table public.communities add constraint community_avatar_asset foreign key(avatar_path) references public.entity_media_assets(path),add constraint community_cover_asset foreign key(cover_path) references public.entity_media_assets(path);
create function pico_private.lock_photo_scope(p_kind text,p_id uuid) returns void language plpgsql security definer set search_path='' as $$
begin
 if p_kind='arena' then perform 1 from public.arenas where id=p_id for update;if not found or pico_private.arena_rank(p_id)<30 then raise insufficient_privilege;end if;
 elsif p_kind='community' then perform 1 from public.communities where id=p_id for update;if not found or pico_private.community_rank(p_id)<30 then raise insufficient_privilege;end if;
 else raise check_violation;end if;
end;$$;
create function public.can_read_entity_media(p_path text) returns boolean language sql stable security definer set search_path='' as $$
 select pico_private.active_account() and exists(select 1 from public.entity_media_assets m where m.path=p_path and m.ready and not m.deleting and (
 (m.arena_id is not null and (pico_private.arena_rank(m.arena_id)>=30 or exists(select 1 from public.arenas a where a.id=m.arena_id and a.is_public and a.status='active' and p_path in (a.avatar_path,a.cover_path)))) or
 (m.community_id is not null and pico_private.can_read_community(m.community_id) and (pico_private.community_rank(m.community_id)>=30 or exists(select 1 from public.communities c where c.id=m.community_id and p_path in(c.avatar_path,c.cover_path))))));
$$;
create policy entity_media_read on public.entity_media_assets for select to authenticated using(public.can_read_entity_media(path) or (pico_private.active_account() and (pico_private.arena_rank(arena_id)>=30 or pico_private.community_rank(community_id)>=30)));
create function public.reserve_entity_media(p_kind text,p_id uuid,p_slot text) returns text language plpgsql security definer set search_path='' as $$
declare result text;
begin
 perform pico_private.consume_write('media',20,3600);perform pico_private.lock_photo_scope(p_kind,p_id);
 if p_slot is null or p_slot not in ('avatar','cover') then raise check_violation;end if;
 if (select count(*) from public.entity_media_assets where coalesce(arena_id,community_id)=p_id)>=6 then raise sqlstate 'P0429';end if;
 result:=p_id::text||'/'||gen_random_uuid()::text||'.webp';
 insert into public.entity_media_assets(path,arena_id,community_id,slot,uploaded_by) values(result,case when p_kind='arena' then p_id end,case when p_kind='community' then p_id end,p_slot,auth.uid());return result;
end;$$;
-- Reference updates and garbage collection serialize on the asset row.
create function pico_private.check_entity_photo() returns trigger language plpgsql security definer set search_path='' as $$
declare target text;which_slot text;asset public.entity_media_assets;
begin
 foreach which_slot in array array['avatar','cover'] loop
  target:=case when which_slot='avatar' then new.avatar_path else new.cover_path end;
  if target is not null then
   select * into asset from public.entity_media_assets where path=target for update;
   if asset.path is null or not asset.ready or asset.deleting or asset.slot<>which_slot or (tg_table_name='arenas' and asset.arena_id is distinct from new.id) or (tg_table_name='communities' and asset.community_id is distinct from new.id) then raise check_violation;end if;
  end if;
 end loop;return new;
end;$$;
create trigger arena_photo_reference before insert or update of avatar_path,cover_path on public.arenas for each row execute function pico_private.check_entity_photo();
create trigger community_photo_reference before insert or update of avatar_path,cover_path on public.communities for each row execute function pico_private.check_entity_photo();
create function public.set_entity_photo(p_kind text,p_id uuid,p_slot text,p_path text default null) returns void language plpgsql security definer set search_path='' as $$
begin
 perform pico_private.consume_write('entity_photo',30,3600);perform pico_private.lock_photo_scope(p_kind,p_id);
 if p_slot is null or p_slot not in ('avatar','cover') then raise check_violation;end if;
 if p_kind='arena' then update public.arenas set avatar_path=case when p_slot='avatar' then p_path else avatar_path end,cover_path=case when p_slot='cover' then p_path else cover_path end,version=version+1 where id=p_id;
 else update public.communities set avatar_path=case when p_slot='avatar' then p_path else avatar_path end,cover_path=case when p_slot='cover' then p_path else cover_path end,version=version+1 where id=p_id;end if;
 insert into pico_private.audit_events(actor_id,action,scope_id) values(auth.uid(),p_kind||'.photo',p_id);
end;$$;
create function public.claim_entity_media(p_path text) returns void language plpgsql security definer set search_path='' as $$
declare asset public.entity_media_assets;
begin
 select * into asset from public.entity_media_assets where path=p_path;
 if asset.path is null then raise insufficient_privilege;end if;
 perform pico_private.lock_photo_scope(case when asset.arena_id is not null then 'arena' else 'community' end,coalesce(asset.arena_id,asset.community_id));
 perform 1 from public.entity_media_assets where path=p_path for update;
 if exists(select 1 from public.arenas where p_path in(avatar_path,cover_path)) or exists(select 1 from public.communities where p_path in(avatar_path,cover_path)) then raise sqlstate 'P0409';end if;
 update public.entity_media_assets set deleting=true where path=p_path;
end;$$;
revoke all on function pico_private.lock_photo_scope(text,uuid),pico_private.check_entity_photo() from public,anon,authenticated;
revoke all on function public.claim_unused_media(text,text),public.can_read_entity_media(text),public.reserve_entity_media(text,uuid,text),public.set_entity_photo(text,uuid,text,text),public.claim_entity_media(text) from public,anon,authenticated;
grant execute on function public.claim_unused_media(text,text),public.can_read_entity_media(text),public.reserve_entity_media(text,uuid,text),public.set_entity_photo(text,uuid,text,text),public.claim_entity_media(text) to authenticated;
commit;
