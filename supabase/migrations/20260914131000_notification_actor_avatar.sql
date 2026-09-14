begin;

-- Resolve the actor's current profile photo at read time, without storing a
-- snapshot or widening the notification's existing RLS-scoped audience.
create or replace function public.read_notifications(p_before uuid default null) returns jsonb
language plpgsql stable security invoker set search_path = '' as $$
declare items jsonb; cursor_date timestamptz;
begin
  if not pico_private.active_account() then raise insufficient_privilege; end if;
  if p_before is not null then
    select created_at into cursor_date from public.notifications where id = p_before;
  end if;
  select coalesce(jsonb_agg(to_jsonb(q) order by q.created_at desc, q.id desc), '[]'::jsonb) into items
  from (
    select n.id, n.kind, n.post_id, n.created_at, n.read_at, p.display_name actor_name,
      p.avatar_path actor_avatar_path, c.name community_name, c.slug community_slug
    from public.notifications n
    join public.profiles p on p.id = n.actor_id
    join public.communities c on c.id = n.community_id
    where p_before is null or (n.created_at, n.id) < (cursor_date, p_before)
    order by n.created_at desc, n.id desc limit 21
  ) q;
  return jsonb_build_object(
    'items', case when jsonb_array_length(items) > 20 then items - 20 else items end,
    'nextCursor', case when jsonb_array_length(items) > 20 then items->19->>'id' end,
    'unreadCount', (select count(*) from public.notifications where read_at is null)
  );
end;
$$;

commit;
