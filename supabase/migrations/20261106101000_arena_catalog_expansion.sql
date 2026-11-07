begin;

-- Public catalog only. No inferred ownership, participation, games, posts or photos.
-- Sources and caveats: docs/ARENA_CATALOG_UPDATE.md (update of 2026-11-06).
with candidates(slug, name, city, neighborhood, description, public_info) as (
  values
    ('beach-arena-real-parque', 'Beach Arena Real Parque', 'São Paulo', 'Morumbi', 'Arena de areia no Morumbi com aulas e planos para futevôlei, beach tennis e vôlei de praia.', 'Rua Dauro Cavallaro, 121, Morumbi, São Paulo - SP'),
    ('perna-de-pau-beach', 'Perna de Pau Beach', 'São Paulo', 'Brooklin', 'Arena no Brooklin com quadras de areia para vôlei de praia, futevôlei e beach tennis.', 'Rua Nova York, 1302, Brooklin, São Paulo - SP'),
    ('playa-sp-beach-sports', 'Playa SP Beach Sports', 'São Paulo', 'Santo Amaro', 'Arena de areia em Santo Amaro com futevôlei e vôlei de praia.', 'Avenida Washington Luís, 1752, Santo Amaro, São Paulo - SP'),
    ('prainha-beach-club', 'Prainha Beach Club', 'São Paulo', 'Lapa de Baixo', 'Clube de areia na Lapa de Baixo com futevôlei, vôlei de praia e beach tennis.', 'Rua Félix Guilhem, 1000, Lapa de Baixo, São Paulo - SP'),
    ('venice-beach-club-analia-franco', 'Venice Beach Club Anália Franco', 'São Paulo', 'Vila Gomes Cardim', 'Clube de areia na região de Anália Franco com três modalidades.', 'Rua Euclides Pacheco, 1600, Vila Gomes Cardim, São Paulo - SP'),
    ('arena-vila-maria-beach', 'Arena Vila Maria Beach', 'São Paulo', 'Jardim Japão', 'Arena de areia na região da Vila Maria com três modalidades.', 'Rua Cabo João Monteiro da Rocha, 264, Jardim Japão, São Paulo - SP'),
    ('hg-beach-guarulhos', 'HG Beach Guarulhos', 'Guarulhos', 'Vila Moreira', 'Arena em Guarulhos com circuito de areia e agendamento.', 'Rua Maria Inês, 874, Vila Moreira, Guarulhos - SP'),
    ('litoral-beach-arena', 'Litoral Beach Arena', 'Santo André', 'Jardim', 'Arena em Santo André com aulas, aluguel de quadra e day use de areia.', 'Rua das Monções, 228, Jardim, Santo André - SP'),
    ('arena-sul-sports', 'Arena Sul Sports', 'São José dos Campos', 'Jardim Sul', 'Arena em São José dos Campos com aulas de beach tennis, futevôlei e vôlei de praia.', 'Rua Maurício Cardoso, 220, Jardim Sul, São José dos Campos - SP'),
    ('arena-vinci-esportes-na-areia', 'Arena Vinci Esportes na Areia', 'Campinas', 'Jardim Ipaussurama', 'Arena em Campinas com aulas de futevôlei e beach tennis.', 'Avenida Homero Vasconcelos de Souza Camargo, 1003, Jardim Ipaussurama, Campinas - SP')
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
  ('beach-arena-real-parque', 'Beach Arena Real Parque', 'futevolei'),
  ('beach-arena-real-parque', 'Beach Arena Real Parque', 'beach-tennis'),
  ('beach-arena-real-parque', 'Beach Arena Real Parque', 'volei-praia'),
  ('perna-de-pau-beach', 'Perna de Pau Beach', 'futevolei'),
  ('perna-de-pau-beach', 'Perna de Pau Beach', 'beach-tennis'),
  ('perna-de-pau-beach', 'Perna de Pau Beach', 'volei-praia'),
  ('playa-sp-beach-sports', 'Playa SP Beach Sports', 'futevolei'),
  ('playa-sp-beach-sports', 'Playa SP Beach Sports', 'volei-praia'),
  ('prainha-beach-club', 'Prainha Beach Club', 'futevolei'),
  ('prainha-beach-club', 'Prainha Beach Club', 'beach-tennis'),
  ('prainha-beach-club', 'Prainha Beach Club', 'volei-praia'),
  ('venice-beach-club-analia-franco', 'Venice Beach Club Anália Franco', 'futevolei'),
  ('venice-beach-club-analia-franco', 'Venice Beach Club Anália Franco', 'beach-tennis'),
  ('venice-beach-club-analia-franco', 'Venice Beach Club Anália Franco', 'volei-praia'),
  ('arena-vila-maria-beach', 'Arena Vila Maria Beach', 'futevolei'),
  ('arena-vila-maria-beach', 'Arena Vila Maria Beach', 'beach-tennis'),
  ('arena-vila-maria-beach', 'Arena Vila Maria Beach', 'volei-praia'),
  ('hg-beach-guarulhos', 'HG Beach Guarulhos', 'futevolei'),
  ('hg-beach-guarulhos', 'HG Beach Guarulhos', 'beach-tennis'),
  ('hg-beach-guarulhos', 'HG Beach Guarulhos', 'volei-praia'),
  ('litoral-beach-arena', 'Litoral Beach Arena', 'futevolei'),
  ('litoral-beach-arena', 'Litoral Beach Arena', 'beach-tennis'),
  ('litoral-beach-arena', 'Litoral Beach Arena', 'volei-praia'),
  ('arena-sul-sports', 'Arena Sul Sports', 'futevolei'),
  ('arena-sul-sports', 'Arena Sul Sports', 'beach-tennis'),
  ('arena-sul-sports', 'Arena Sul Sports', 'volei-praia'),
  ('arena-vinci-esportes-na-areia', 'Arena Vinci Esportes na Areia', 'futevolei'),
  ('arena-vinci-esportes-na-areia', 'Arena Vinci Esportes na Areia', 'beach-tennis')
) as verified(arena_slug, arena_name, sport_slug)
join public.arenas a on a.slug = verified.arena_slug
  and a.name = verified.arena_name and not a.is_demo
join public.sports s on s.slug::text = verified.sport_slug
on conflict (arena_id, sport_id) do nothing;

commit;
