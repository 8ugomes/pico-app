begin;

-- Keep the private MP4 bucket and the asset row in sync. The projects' Free
-- global file limit is 50 MB; 45 MiB leaves room below that fixed ceiling.
do $$
declare changed integer;
begin
  update storage.buckets set file_size_limit = 47185920
    where id = 'post-videos' and public = false
      and allowed_mime_types = array['video/mp4']::text[]
      and file_size_limit in (31457280, 47185920);
  get diagnostics changed = row_count;
  if changed <> 1 then
    raise exception 'Unexpected post-videos bucket configuration';
  end if;
end $$;

alter table public.post_video_assets drop constraint post_video_assets_byte_size_check;
alter table public.post_video_assets add constraint post_video_assets_byte_size_check
  check (byte_size between 1 and 47185920);

commit;
