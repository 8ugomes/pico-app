begin;

alter table public.comments
  add column idempotency_key uuid,
  add column request_digest text;

create unique index comments_idempotency
  on public.comments(author_id, idempotency_key)
  where idempotency_key is not null;

create function public.create_comment_idempotent(p_post uuid, p_body text, p_key uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  result uuid;
  fingerprint text;
  previous text;
begin
  if not pico_private.active_account() or p_key is null then raise insufficient_privilege; end if;
  if p_post is null or p_body is null or char_length(btrim(p_body)) not between 1 and 280 then raise check_violation; end if;
  if not pico_private.can_read_post(p_post) then raise insufficient_privilege; end if;

  fingerprint := encode(sha256(convert_to(jsonb_build_array(p_post, btrim(p_body))::text, 'UTF8')), 'hex');
  perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text || p_key::text, 0));
  select id, request_digest into result, previous
  from public.comments
  where author_id = auth.uid() and idempotency_key = p_key;

  if result is not null then
    if previous <> fingerprint then raise sqlstate 'P0409'; end if;
    return result;
  end if;

  insert into public.comments(post_id, author_id, body, idempotency_key, request_digest)
  values(p_post, auth.uid(), btrim(p_body), p_key, fingerprint)
  returning id into result;
  return result;
end;
$$;

revoke all on function public.create_comment_idempotent(uuid, text, uuid) from public, anon, authenticated;
grant execute on function public.create_comment_idempotent(uuid, text, uuid) to authenticated;

commit;
