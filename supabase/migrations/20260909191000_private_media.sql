begin;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values
  ('avatars','avatars',false,3145728,array['image/webp']),
  ('post-media','post-media',false,3145728,array['image/webp']);

create table public.media_assets (
  path text primary key,
  player_id uuid not null references public.profiles(id) on delete cascade,
  bucket text not null check(bucket in ('avatars','post-media')),
  ready boolean not null default false,
  created_at timestamptz not null default now(),
  check(path ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.webp$' and split_part(path,'/',1)=player_id::text)
);
create index media_assets_owner on public.media_assets(player_id,bucket);
alter table public.profiles add constraint profile_avatar_asset foreign key(avatar_path) references public.media_assets(path) on delete set null;
alter table public.posts add constraint post_image_asset foreign key(image_path) references public.media_assets(path) on delete set null;
alter table public.media_assets enable row level security;
revoke all on public.media_assets from public,anon,authenticated;
grant select on public.media_assets to authenticated;
grant all on public.media_assets to service_role;
create policy media_assets_own on public.media_assets for select to authenticated
  using(player_id=(select auth.uid()) and (select pico_private.active_account()));

-- Reserves a bounded upload slot. Only the server can upload bytes or mark it
-- ready, so direct Storage calls cannot bypass decoding and metadata removal.
create function public.reserve_media(p_bucket text) returns text
language plpgsql security definer set search_path='' as $$
declare result text; total integer;
begin
  if p_bucket not in ('avatars','post-media') or p_bucket is null then raise check_violation; end if;
  perform pico_private.consume_write('media',20,3600);
  select count(*) into total from public.media_assets where player_id=auth.uid() and bucket=p_bucket;
  if total >= (case when p_bucket='avatars' then 3 else 40 end) then
    raise sqlstate 'P0429' using message='Remove an image before uploading another';
  end if;
  result := auth.uid()::text || '/' || gen_random_uuid()::text || '.webp';
  insert into public.media_assets(path,player_id,bucket) values(result,auth.uid(),p_bucket);
  return result;
end;
$$;
revoke all on function public.reserve_media(text) from public,anon,authenticated;
grant execute on function public.reserve_media(text) to authenticated;

create function pico_private.check_media_reference() returns trigger
language plpgsql security definer set search_path='' as $$
declare target text; owner_uuid uuid; target_bucket text;
begin
  if tg_table_name='profiles' then target:=new.avatar_path; owner_uuid:=new.id; target_bucket:='avatars';
  else target:=new.image_path; owner_uuid:=new.author_id; target_bucket:='post-media'; end if;
  if target is not null and not exists(select 1 from public.media_assets
    where path=target and player_id=owner_uuid and bucket=target_bucket and ready) then
    raise check_violation using message='Image is not ready or does not belong to this account';
  end if;
  return new;
end;
$$;
revoke all on function pico_private.check_media_reference() from public,anon,authenticated;
create trigger profile_media_reference before insert or update of avatar_path on public.profiles
  for each row execute function pico_private.check_media_reference();
create trigger post_media_reference before insert or update of image_path on public.posts
  for each row execute function pico_private.check_media_reference();
create unique index post_media_single_use on public.posts(image_path) where image_path is not null;

-- No client INSERT/UPDATE/DELETE policies: file mutations go through the verified
-- server route. Read policy deliberately excludes object signing and public URLs.
create policy pico_media_read on storage.objects for select to authenticated using (
  (select pico_private.active_account()) and bucket_id in ('avatars','post-media')
  and storage.allow_any_operation(array['object.get_authenticated','object.get_authenticated_info'])
  and (
    exists(select 1 from public.media_assets m where m.path=name and m.bucket=bucket_id and m.ready)
    or (bucket_id='avatars' and exists(select 1 from public.profiles p where p.avatar_path=name))
    or (bucket_id='post-media' and exists(select 1 from public.posts p where p.image_path=name))
  )
);
commit;
