-- Enforce the same minimum text-safety invariant at the database boundary.
-- API validation remains useful for friendly errors, but an authenticated
-- client must not be able to bypass it through PostgREST or an RPC.
begin;

create function pico_private.assert_publishable_text(p_value text)
returns text
language plpgsql
immutable
security definer
set search_path = ''
as $$
declare
  normalized text := lower(translate(coalesce(p_value, ''),
    'áàâãäéèêëíìîïóòôõöúùûüç',
    'aaaaaeeeeiiiiooooouuuuc'));
  link_count integer;
begin
  select count(*) into link_count
  from regexp_matches(normalized, 'https?://|www\.', 'g');

  if link_count >= 3
    or normalized ~ '(nude|nudes|sexo|sexual|pornografia|pornografico).{0,48}(menor|menores|crianca|criancas|adolescente|adolescentes)'
    or normalized ~ '(menor|menores|crianca|criancas|adolescente|adolescentes).{0,48}(nude|nudes|sexo|sexual|pornografia|pornografico)'
    or normalized ~ '(^|[^[:alnum:]_])(eu[[:space:]]+)?vou[[:space:]]+(te[[:space:]]+|lhe[[:space:]]+)?(matar|estuprar|agredir)([^[:alnum:]_]|$)'
    or normalized ~ '(^|[^[:alnum:]_])(matar|estuprar)[[:space:]]+(voce|ele|ela|voces)([^[:alnum:]_]|$)'
  then
    raise check_violation using message = 'Text rejected by the publication safety policy';
  end if;

  return p_value;
end;
$$;

create function pico_private.enforce_social_text_moderation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  field_name text;
begin
  foreach field_name in array tg_argv loop
    perform pico_private.assert_publishable_text(to_jsonb(new) ->> field_name);
  end loop;
  return new;
end;
$$;

revoke all on function pico_private.assert_publishable_text(text),
  pico_private.enforce_social_text_moderation() from public, anon, authenticated;

create trigger moderate_profile_text
before insert or update of display_name, bio, city, neighborhood on public.profiles
for each row execute function pico_private.enforce_social_text_moderation('display_name', 'bio', 'city', 'neighborhood');

create trigger moderate_post_text
before insert or update of body on public.posts
for each row execute function pico_private.enforce_social_text_moderation('body');

create trigger moderate_comment_text
before insert or update of body on public.comments
for each row execute function pico_private.enforce_social_text_moderation('body');

create trigger moderate_community_text
before insert or update of name, description, rules on public.communities
for each row execute function pico_private.enforce_social_text_moderation('name', 'description', 'rules');

create trigger moderate_arena_text
before insert or update of name, description, city, neighborhood, public_info on public.arenas
for each row execute function pico_private.enforce_social_text_moderation('name', 'description', 'city', 'neighborhood', 'public_info');

create trigger moderate_arena_request_text
before insert or update of name, city, neighborhood, details on public.arena_requests
for each row execute function pico_private.enforce_social_text_moderation('name', 'city', 'neighborhood', 'details');

commit;
