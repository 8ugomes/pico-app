-- Development fixtures only. Idempotent catalog + clearly fictional SP arenas.
-- No Auth accounts, real venues, fake engagement, secrets, or private information.
begin;
insert into public.sports (id, slug, name) values
  ('10000000-0000-4000-8000-000000000001', 'futevolei', 'Futevôlei'),
  ('10000000-0000-4000-8000-000000000002', 'beach-tennis', 'Beach Tennis'),
  ('10000000-0000-4000-8000-000000000003', 'volei-praia', 'Vôlei de Praia')
on conflict (slug) do nothing;

insert into public.arenas (id, slug, name, description, neighborhood, city, image_path, is_demo) values
  ('20000000-0000-4000-8000-000000000001', 'areia-da-vila', 'Areia da Vila', 'Arena fictícia de demonstração em São Paulo. Usada para testar encontros de futevôlei e vôlei de praia.', 'Vila Madalena', 'São Paulo', '/images/urban-court.webp', true),
  ('20000000-0000-4000-8000-000000000002', 'alto-da-areia', 'Alto da Areia', 'Arena fictícia de demonstração em São Paulo. Nenhuma presença ou endereço corresponde a um local real.', 'Alto de Pinheiros', 'São Paulo', '/images/urban-court.webp', true),
  ('20000000-0000-4000-8000-000000000003', 'quintal-de-areia', 'Quintal de Areia', 'Arena fictícia de demonstração em São Paulo, criada para experimentar o núcleo social do Pico.', 'Moema', 'São Paulo', '/images/urban-court.webp', true)
on conflict (slug) do nothing;

insert into public.arena_sports (arena_id, sport_id)
select a.id, s.id from (values
  ('areia-da-vila', 'futevolei'), ('areia-da-vila', 'volei-praia'),
  ('alto-da-areia', 'futevolei'), ('alto-da-areia', 'beach-tennis'), ('alto-da-areia', 'volei-praia'),
  ('quintal-de-areia', 'beach-tennis'), ('quintal-de-areia', 'volei-praia')
) as fixture(arena_slug, sport_slug)
join public.arenas a on a.slug = fixture.arena_slug and a.is_demo
join public.sports s on s.slug::text = fixture.sport_slug
on conflict do nothing;
commit;
