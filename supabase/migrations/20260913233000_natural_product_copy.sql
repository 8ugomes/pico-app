begin;
set local lock_timeout = '5s';
set local statement_timeout = '15s';

-- A product-owned name change, with the same ID, slug, members and posts.
-- ALTER TABLE holds an exclusive lock until commit: no concurrent writer can
-- use the brief suspension of this trigger. Failure rolls the whole change back.
alter table public.communities disable trigger protect_pico_community;
update public.communities set name = 'Comunidade oficial do Pico', version = version + 1
where id in (select community_id from pico_private.pico_community)
  and name = 'Pico — comunidade oficial';
alter table public.communities enable trigger protect_pico_community;

-- Change punctuation only in the two unchanged catalog descriptions.
-- Do not rewrite names, addresses or text supplied later by a venue manager.
update public.arenas a set public_info = copy.new_info, version = a.version + 1
from (values
  ('767b3b8a-cf7e-51d7-b8e4-7a2d8683753d', 'nossa-arena', 'Avenida Nicolas Boer, 100 — acesso à rua sem saída, 200
Programação voltada a meninas e mulheres; confira as condições de participação com a arena.', 'Avenida Nicolas Boer, 100 (acesso à rua sem saída, 200)
Programação voltada a meninas e mulheres; confira as condições de participação com a arena.'),
  ('c70b198b-2c49-5a2e-935d-ae4d1effb447', 'arena-nacional-caraguatatuba-caraguatatuba', 'Avenida José Herculano, 1086 — Serramar Shopping
Localização no Serramar Shopping confirmada na ficha da Federação Paulista. A TotalPass usa Jardim Britânia para o bairro.', 'Avenida José Herculano, 1086 (Serramar Shopping)
Localização no Serramar Shopping confirmada na ficha da Federação Paulista. A TotalPass usa Jardim Britânia para o bairro.')
) as copy(id, slug, old_info, new_info)
where a.id = copy.id::uuid and a.slug = copy.slug and a.public_info = copy.old_info;
commit;
