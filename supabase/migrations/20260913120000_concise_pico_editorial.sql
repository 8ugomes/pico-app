begin;
-- Institutional copy has no user authors, comments or reactions. Preserve any edited editions.
delete from pico_private.pico_editorial where
 (id='boas-vindas' and title='A areia aproxima. O Pico conecta.') or
 (id='primeiros-passos' and title='Encontre seus lugares e sua turma');
update pico_private.pico_editorial
set title='Qual arena vale conhecer?',body='Deixe uma dica no mural: a quadra, o bairro e o que faz você voltar.',published_at=now()
where id='apresentacao' and title='Qual é a sua praia?';
update public.communities set description='Novidades do Pico e dicas de quem joga.',version=version+1
where id in (select community_id from pico_private.pico_community)
and description='O ponto de encontro da areia. Todas as modalidades, histórias e turmas do Pico em um só lugar.';
commit;
