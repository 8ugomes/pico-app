# Pico — schema Supabase V1

Rodada 2, 9 de setembro de 2026. **Contrato proposto, não aplicado.** Nenhum projeto, usuário, bucket ou tabela foi criado por esta rodada.

## Separação entre demonstração e produção

As telas usam src/data/mock.ts e DemoProvider. Configurar Auth não muda a fonte dos dados sociais nem transforma Rafa em um usuário real. O estado do demo fica em memória e reinicia na recarga; o relógio e os IDs do demo não representam dados de produção.

src/types/database.ts contém tipos escritos manualmente. src/lib/supabase/queries.ts contém consultas de leitura que exigem um cliente explícito; nenhuma tela social as chama. Depois de aplicar migrations revisadas, substituir o contrato por tipos gerados do Supabase.

## Convenções

UUID nas identidades; auth.users é a fonte de autenticação. Timestamps de produção usam timestamptz/default now(). Campos obrigatórios com NOT NULL, textos com comprimento limitado, FKs com comportamento de exclusão definido e índices nas consultas reais. IDs e tempos relativos dos mocks nunca são inseridos diretamente.

| Tabela | Campos e relações principais | Regras |
| --- | --- | --- |
| profiles | id → auth.users.id; username, display_name, bio, neighborhood, avatar_path, available, created_at | username único sem distinção de caixa, nome 2–60, bio até 160; sem e-mail/telefone no perfil público |
| sports | id, slug, name | slugs únicos futevolei, beach-tennis, volei-praia; catálogo controlado |
| arenas | id, slug, name, description, neighborhood, city, image_path, is_public, created_at | slug único; cadastro inicial administrativo; sem preços/reservas |
| arena_sports | arena_id → arenas, sport_id → sports | PK composta, vínculo único |
| posts | id, author_id → profiles, arena_id → arenas, sport_id → sports, body, image_path, created_at | body não vazio, até 500; esporte compatível com arena; exclusão pelo autor |
| checkins | id, player_id → profiles, arena_id → arenas, sport_id → sports, started_at, expires_at, ended_at | no máximo um registro não encerrado por pessoa; duração máxima 2h; escrita por RPC |
| connections | follower_id → profiles, following_id → profiles, created_at | PK composta, proibir conexão consigo; seguir é unilateral neste MVP |
| post_likes | post_id → posts, player_id → profiles, created_at | PK composta; desfazer por delete |
| comments | id, post_id → posts, author_id → profiles, body, created_at | body não vazio, até 280; excluir pelo autor |

Tabelas auxiliares necessárias:

- player_sports: player_id, sport_id, level. PK composta, níveis Iniciante/Intermediário/Avançado.
- arena_members: arena_id, player_id, created_at. PK composta; acompanhamento voluntário e reversível.

O demo mantém contagens ilustrativas de comunidade em arenas.members; em produção, calcular a partir de arena_members, sem campo editável pelo cliente.

## Integridade e índices

- Índice único em lower(username) e em arenas.slug.
- Índices em posts(arena_id, created_at DESC, id DESC) e posts(author_id, created_at DESC).
- Índices em comments(post_id, created_at), connections(following_id) e arena_members(player_id).
- Índices em checkins(arena_id, expires_at) e checkins(player_id).
- Unique parcial em checkins(player_id) WHERE ended_at IS NULL. Não usar now() em predicado de índice parcial.
- FK composta (arena_id, sport_id) dos posts/checkins para arena_sports.
- Check de expires_at > started_at e expires_at <= started_at + interval '2 hours'.
- Excluir post remove likes/comentários; exclusão de arena com atividade deve ser controlada ou arquivada.
- Contagens devem acompanhar os dados e obedecer à visibilidade da entidade original.

## Check-in no servidor

Implementar start_checkin(arena_id, sport_id) em transação. Derivar player_id de auth.uid(), validar autenticação, arena visível e modalidade. Serializar operações por jogador com lock transacional, encerrar o check-in anterior e inserir o novo com timestamps do servidor.

RPC revisada com SECURITY DEFINER, search_path vazio, nomes de tabelas qualificados, EXECUTE somente para authenticated e verificação explícita de auth.uid(). Revogar escrita direta em checkins do cliente; end_checkin() só encerra o registro do autor. Não aceitar player_id, started_at ou expires_at arbitrários do navegador.

Expiração de leitura sempre usa expires_at > now() e ended_at IS NULL. O novo check-in encerra registros expirados ainda abertos antes de inserir; nenhuma tarefa periódica é necessária para liberar a constraint. Um job de limpeza pode ser adicionado depois.

## RLS: política inicial

Habilitar RLS explicitamente antes de expor cada tabela. Ações administrativas ficam fora do cliente. A demonstração pública não exige liberar todos os dados reais anonimamente.

| Tabela | SELECT | INSERT | UPDATE / DELETE |
| --- | --- | --- | --- |
| profiles | authenticated, apenas colunas públicas | id = auth.uid() ou trigger de cadastro revisada | apenas próprio id; impedir troca de id |
| sports | catálogo público | administrativo | administrativo |
| arenas / arena_sports | somente arenas is_public; privado apenas acesso autorizado futuro | administrativo | administrativo |
| player_sports | authenticated, conforme perfil público | player_id = auth.uid() | próprio jogador |
| arena_members | authenticated em arena pública | próprio player_id e arena pública | sair apenas do próprio vínculo |
| posts | authenticated e arena visível | author_id = auth.uid(), arena visível e esporte permitido | próprio autor e validação de campos |
| checkins | authenticated; arena visível; não encerrado e não expirado | somente RPC validada | somente RPC de encerramento |
| connections | vínculos do próprio follower/following; contagens públicas via view específica revisada | follower_id = auth.uid() e alvo diferente | desfazer pelo follower; sem troca dos envolvidos |
| post_likes | visibilidade herdada do post | próprio player_id e post visível | delete do próprio vínculo |
| comments | visibilidade herdada do post | próprio author_id e post visível | apenas autor |

Combinar USING (linha existente) e WITH CHECK (linha resultante), com grants de colunas quando apropriado. RLS de autoria não substitui constraints de tamanho, compatibilidade e integridade. Não confiar em user_metadata como papel administrativo.

Antes de permitir perfis privados ou bloqueios, adicionar a política correspondente em todas as leituras derivadas; o V1 propõe apenas campos compartilháveis para usuários autenticados.

## Storage

Buckets privados para avatars e post-images, caminhos iniciados por auth.uid(). Validar tamanho e MIME no servidor, limites de resolução e metadados antes de publicar. Permitir escrita/exclusão só pelo proprietário; leitura por URL assinada curta conforme visibilidade. Sem upload irrestrito ou permissão baseada somente no nome enviado pelo navegador.

## Configuração e autenticação

.env.example contém somente NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY vazias. Não incluir service_role/secret key ou tokens em Git, logs ou NEXT_PUBLIC_*.

Os helpers atuais suportam Auth e callback PKCE. O helper de servidor escreve cookies em Route Handlers/Server Actions. Adicionar proxy de renovação antes de páginas privadas SSR e validar identidade com getClaims/getUser. Recovery, reenvio de confirmação e testes de e-mail continuam pendentes.

## Sequência de integração real

1. Revisar migrations e RLS em ambiente de desenvolvimento.
2. Aplicar schema, gerar tipos e inserir somente seeds identificados para teste.
3. Criar adapter de leitura e tratar erro/vazio/loading sem retornar mock silenciosamente.
4. Integrar perfil/arenas, depois check-in, depois posts/conexões.
5. Validar gravações no servidor, permissões e idempotência.
6. Remover rótulo de demo somente das jornadas realmente integradas.

## Matriz de teste necessária no backend

Com anônimo e dois usuários distintos: autoria forjada, leitura de arena privada, atualização de perfil alheio, self-connect, duplicação de like/conexão, comentário em post inacessível, modalidade inválida, dois check-ins simultâneos, expiração, encerramento de presença alheia e uploads fora do prefixo.

Os testes locais de reducer não substituem essa matriz. Não foi executada nesta rodada por ausência de backend configurado.

Referências oficiais: [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [Storage access control](https://supabase.com/docs/guides/storage/security/access-control), [clientes SSR](https://supabase.com/docs/guides/auth/server-side/creating-a-client).

## Cycle 0.5

Refinamento visual concluído; nenhuma mudança em persistência/Auth ou RLS. O Cycle 1 criará migrations e seeds testáveis.
