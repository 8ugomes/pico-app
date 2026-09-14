begin;

-- Public catalog only. No inferred ownership, participation, games, posts or photos.
-- Provenance and intentionally deferred venues: docs/ARENA_CATALOG_UPDATE.md.
with candidates(slug, name, city, neighborhood, description, public_info) as (
  values
    ('r7-academia', 'R7 Academia', 'São Paulo', 'Jaraguá',
      'Centro poliesportivo com futevôlei e vôlei de praia.', 'Av. Jerimandubá, 803, Jaraguá, São Paulo - SP'),
    ('arena-xfield', 'Arena Xfield', 'São Paulo', 'Vila Clarice',
      'Arena de futevôlei, beach tennis e vôlei de praia.', 'Av. José Alves de Mira, 37, Vila Clarice, São Paulo - SP'),
    ('jaragua-clube-campestre', 'Jaraguá Clube Campestre', 'São Paulo', 'Pirituba',
      'Clube com prática de beach tennis.', 'Av. Dr. Felipe Pinel, 2008, Pirituba, São Paulo - SP')
)
insert into public.arenas (slug, name, city, neighborhood, description, public_info, is_public, is_demo)
select c.slug, c.name, c.city, c.neighborhood, c.description, c.public_info, true, false
from candidates c
where not exists (
  select 1 from public.arenas a
  where lower(btrim(a.name)) = lower(btrim(c.name))
    and lower(btrim(a.city)) = lower(btrim(c.city))
)
on conflict (slug) do nothing;

insert into public.arena_sports (arena_id, sport_id, enabled)
select a.id, s.id, true
from (values
  ('r7-academia', 'R7 Academia', 'futevolei'),
  ('r7-academia', 'R7 Academia', 'volei-praia'),
  ('arena-xfield', 'Arena Xfield', 'futevolei'),
  ('arena-xfield', 'Arena Xfield', 'beach-tennis'),
  ('arena-xfield', 'Arena Xfield', 'volei-praia'),
  ('jaragua-clube-campestre', 'Jaraguá Clube Campestre', 'beach-tennis')
) as verified(arena_slug, arena_name, sport_slug)
join public.arenas a on a.slug = verified.arena_slug
  and a.name = verified.arena_name and a.city = 'São Paulo' and not a.is_demo
join public.sports s on s.slug::text = verified.sport_slug
on conflict (arena_id, sport_id) do nothing;

commit;
