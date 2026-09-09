begin;
-- One transaction for the profile and primary sport. RLS still applies to the caller.
create function public.save_profile(p_name text, p_username text, p_bio text, p_city text,
  p_neighborhood text, p_sport_id uuid, p_level public.player_level, p_available boolean)
returns void language plpgsql security invoker set search_path = '' as $$
declare caller uuid := auth.uid();
begin
  if caller is null then raise insufficient_privilege using message = 'Authentication required'; end if;
  perform 1 from public.profiles where id = caller for update;
  if not found then raise foreign_key_violation using message = 'Profile missing'; end if;
  if p_sport_id is null or p_level is null or p_available is null then
    raise check_violation using message = 'Profile incomplete';
  end if;
  update public.profiles set display_name = btrim(p_name), username = lower(btrim(p_username)),
    bio = btrim(p_bio), city = btrim(p_city), neighborhood = btrim(p_neighborhood),
    available = p_available, onboarding_completed = true where id = caller;
  update public.player_sports set is_primary = false where player_id = caller and is_primary;
  insert into public.player_sports(player_id, sport_id, level, is_primary)
    values (caller, p_sport_id, p_level, true)
    on conflict (player_id, sport_id) do update set level = excluded.level, is_primary = true;
end;
$$;
revoke all on function public.save_profile(text,text,text,text,text,uuid,public.player_level,boolean) from public, anon, authenticated;
grant execute on function public.save_profile(text,text,text,text,text,uuid,public.player_level,boolean) to authenticated;
commit;
