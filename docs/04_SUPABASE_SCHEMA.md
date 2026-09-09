# Pico — Supabase: schema e estado real

## Cycle 1 · fundação implementada

Migration versionada: `supabase/migrations/20260909010000_social_foundation.sql`.
Seed de desenvolvimento: `supabase/seed.sql`. Configuração local: `supabase/config.toml`.

O SQL foi aplicado do zero em Postgres/PGlite com as migrations reais. Dez grupos de testes verificam grants, RLS, trigger, seeds e constraints com anônimo e identidades distintas. A fixture de `auth.users`/`auth.uid()` existe somente em `tests/helpers/database.mjs`; não substitui validação de JWT, Auth, e-mail ou PostgREST do Supabase. Nenhum projeto hospedado foi provisionado ou alterado.

O Cycle 2 integrou leituras em /arenas, /arenas/[slug] e /perfil quando a configuração é válida. Sem variáveis, essas telas preservam DemoProvider/mock.ts; configuração inválida ou falha de banco retorna erro. As demais jornadas sociais ainda são demo.

## Modelo implementado

| Tabela | Campos e integridade | Visibilidade e escrita do cliente |
| --- | --- | --- |
| profiles | PK em auth.users, username minúsculo único 3–40, nome 2–60, bio 160, cidade/bairro 80, avatar_path, available, onboarding_completed, is_demo, created_at | SELECT authenticated; UPDATE de colunas editáveis e apenas id = auth.uid(); sem INSERT/DELETE direto |
| sports | UUID, slug enum único, nome | Catálogo público, sem escrita pelo cliente |
| arenas | UUID, slug único, nome, descrição, bairro/cidade, image_path, is_public, is_demo | Somente arenas públicas; escrita administrativa fora do app |
| arena_sports | PK arena_id/sport_id, FKs | Visibilidade da arena, sem escrita pelo cliente |
| player_sports | PK player_id/sport_id, level enum, is_primary | Leitura autenticada; inserir/editar nível e principal/excluir apenas próprio vínculo; um esporte principal por jogador |
| arena_members | PK arena_id/player_id, created_at | Leitura em arena pública; acompanhar como auth.uid() e arena pública; sair apenas do próprio vínculo |
| posts | UUID, author_id, arena_id/sport_id com FK composta, body 1–500 e não só whitespace, image_path, created_at | Leitura em arena pública; autoria própria; editar só body/image_path; exclusão própria |
| post_likes | PK post_id/player_id, created_at | Leitura/escrita herdam visibilidade do post; inserir/descurtir apenas como próprio player_id; sem UPDATE |
| comments | UUID, post_id, author_id, body 1–280 e não só whitespace, created_at | Herda visibilidade do post; autoria própria; editar só body; exclusão própria |
| checkins | UUID, player_id, arena_id/sport_id com FK composta, started_at, expires_at, ended_at | SELECT authenticated só em arena pública, não encerrado e não expirado; sem escrita direta |

Todos os dez objetos têm RLS explicitamente habilitada. A migration revoga grants potencialmente herdados de PUBLIC/anon/authenticated antes de conceder somente operações/colunas necessárias. O proprietário do banco continua administrativo; o aplicativo usa publishable key e JWT do usuário. Nenhum service_role no frontend.

`profiles` contém somente campos compartilháveis entre jogadores autenticados, sem e-mail, telefone, token ou papel administrativo. Ainda não existem perfis privados, bloqueios ou moderação. Esses recursos exigirão revisar também as leituras derivadas.

## Identidade e criação de perfil

`handle_new_user` roda como trigger AFTER INSERT em auth.users. É SECURITY DEFINER com search_path vazio, tabelas qualificadas e EXECUTE revogado do cliente/PUBLIC. Usa exclusivamente new.id para identidade, gera username `pico_` + UUID sem hífens e aceita apenas display_name textual, aparado e limitado. Não aceita username/id/role/is_demo dos metadados. Sem nome válido, usa “Novo jogador”.

Contas que existiam antes da migration recebem perfil por backfill idempotente, sem copiar e-mail. O perfil inicia com disponibilidade e onboarding falsos, avatar ausente e is_demo falso. O usuário pode editar só seus campos sociais; id, created_at e is_demo não recebem grant de atualização.

## Integridade e índices

- Slugs e usernames únicos; username canônico minúsculo evita duplicação por caixa.
- Sports: futevolei, beach-tennis, volei-praia; níveis Iniciante/Intermediário/Avançado.
- Índice parcial de player_sports permite apenas um is_primary por jogador.
- Posts/check-ins exigem combinação arena/modalidade presente em arena_sports.
- Posts indexados por feed global, arena e autor com created_at/id para paginação estável.
- Comentários indexados por post/data/id; likes e memberships por jogador.
- Exclusão de post remove likes/comentários; exclusão de conta remove seu conteúdo. Arenas/modalidades com atividade têm exclusão restrita.
- Check-in exige expires_at > started_at e duração <= 2h; ended_at não pode anteceder started_at.
- Um check-in não encerrado por jogador via índice parcial; presença ativa indexada por arena/expiração. Sem now() em predicado do índice.

## Check-in: fronteira deste ciclo

A fundação não expõe `start_checkin`/`end_checkin` ainda. Toda escrita direta do cliente está negada. Não há policy provisória de INSERT que aceite player_id/timestamps arbitrários.

No Cycle 4, criar RPCs com auth.uid(), timestamps do servidor e duração máxima de 2h. Serializar por jogador, validar arena pública e modalidade, encerrar registro anterior (inclusive expirado) e inserir o novo em transação. `end_checkin()` só altera a presença do chamador. SECURITY DEFINER, search_path vazio, EXECUTE só para authenticated. Testar identidade forjada, expiração e concorrência antes de integrar a tela.

## Seeds

Três esportes e três arenas **fictícias** de São Paulo, com UUIDs estáveis, `is_demo = true` e descrição explícita. Os esportes são catálogo; a arena/atividade não representa local ou pessoa real. Inserções `ON CONFLICT DO NOTHING` preservam dados existentes; vínculos só são adicionados a arenas marcadas demo. O seed foi aplicado duas vezes sem duplicar dados.

Sem contas Auth, posts, comentários, curtidas, presença ou métricas inventadas no seed. A imagem local da quadra é ilustrativa. Usar esse seed apenas em desenvolvimento; ambientes beta/produção devem cadastrar seu catálogo de arenas revisado separadamente.

## Tipos e consultas

`src/types/database.ts` agora corresponde às dez tabelas entregues: campos de perfil, flags demo, esporte principal, enums e FKs. Insert/Update foram reduzidos às colunas permitidas ao cliente. Objetos futuros (connections e RPCs) foram retirados do contrato executável até existir migration correspondente. Os tipos continuam manuais; gerar a partir do Supabase configurado antes da integração hospedada.

`src/lib/supabase/queries.ts` agora é chamado por read-service.ts e pelo GET /api/social/read. Há helpers de esportes, arenas/modalidades, arena por slug e perfil próprio/modalidades. Perfil usa getUser verificado e filtra o ID retornado pelo Auth; o endpoint não aceita escolha de identidade. DTOs excluem e-mail, metadata/role e caminhos privados. Catálogo público continua protegido pelas policies existentes.

## Execução local e verificação

```sh
npm ci
npm run test:db
npm test
npm run lint
npm run typecheck
npm run build
```

`test:db` executa Postgres/WASM em memória, sem Docker, servidor externo ou secrets. Os testes simulam o limite de identidade com SET ROLE e request.jwt.claim.sub exclusivamente no banco descartável. Não usar essa fixture em migrations do produto.

Para exercer a pilha completa, instalar Supabase CLI e Docker, rodar `supabase start` e `supabase migration up --local`; em um banco local descartável, `supabase db reset --local` aplica migrations e seed, **apagando os dados locais anteriores**. Copiar URL e publishable key para .env.local sem versionar. Nunca executar reset em banco que contenha trabalho a preservar.

Em projeto hospedado de desenvolvimento, usar migrations revisadas com `supabase db push --dry-run` antes da aplicação. Nenhum desses comandos hospedados foi executado nesta rodada. Testes de Auth/e-mail/PostgREST/RLS com JWTs reais permanecem obrigatórios antes do beta.

## Matriz exercitada

Dez grupos de teste: criação/RLS/seed repetido; trigger/backfill/metadata adversa; permissões anônimas; edição de perfil e colunas imutáveis; memberships/esportes e uma modalidade principal; autoria/tamanho/arena/modalidade dos posts; likes/comentários/duplicações; visibilidade herdada ao privatizar arena; bloqueio de escrita/check-in máximo/expiração/unicidade; cascata de exclusão do post.

Os dez testes existentes do demo também continuam passando. Não há afirmação de que PGlite comprova refresh de sessão, envio de e-mail, PostgREST, Storage, concorrência entre conexões ou serviço Supabase hospedado.

## Próximos ciclos

Cycle 2 implementado, com verificação hospedada ainda pendente. Cycle 3: sessão SSR renovada, onboarding/edição e logout. Cycle 4: RPCs de presença. Cycle 5: mutations sociais. Cycle 6: connections com PK follower/following, check de diferença entre IDs e policies próprias. Cycle 7: jornada ponta a ponta, dispositivos e checklist beta.

Storage privado, limites de upload, moderação e testes de e-mail continuam pendentes; campos avatar_path/image_path não significam que upload esteja implementado.

Referências: [Supabase RLS e grants](https://supabase.com/docs/guides/database/postgres/row-level-security), [perfil após signup](https://supabase.com/docs/guides/auth/managing-user-data), [PGlite](https://pglite.dev/docs/).


## Cycle 2 · execução de leitura

GET /api/social/read aceita resource=arenas (offset), arena (slug validado) ou profile (sem ID). Paginação de arenas de 24 com lookahead; modalidades são obtidas por FKs tipadas. Catálogo não exige login; perfil exige getUser no servidor. Cliente criado por requisição e cookies atualizados no Route Handler, sem estado global entre usuários. Nenhuma página privada lê sessão em Server Component neste ciclo; renovação por proxy SSR permanece no Cycle 3.

Respostas usam Cache-Control private, no-store, max-age=0 e Vary Cookie (além dos campos adicionados pelo Next). Sem cache de perfil. Falhas são normalizadas para mensagens curtas sem SQL, URL, chave ou tokens. Configuração ausente responde status demo; parcial/inválida responde configuration/503; sessão ausente authentication/401; arena/perfil ausentes 404; consulta falha unavailable/503. SDK server tem timeout de 10s e retry manual; navegador limita a espera e cancela a leitura ao desmontar/trocar contexto.

O contrato não exige modificar a migration do Cycle 1. Tipos permanecem manuais; gerar no ambiente hospedado antes do beta. Campos is_demo viajam até a UI; imagens locais de demonstração só aparecem para arenas is_demo. Sem endpoints de gravação novos.

Verificação: nove testes adicionais com SDK e transporte controlado, somados aos 20 anteriores. Build sem env preserva demo. Build isolado com fixture REST/Auth sobre PGlite exercitou catálogo, slug, vazio, erro, login de teste, perfil e logout, além de configuração incompleta em servidor separado. Isso não valida JWT/e-mail/refresh/PostgREST reais. O usuário informou que configurou .env.local, mas o arquivo não foi encontrado no caminho do projeto na conferência; localização/configuração precisa ser resolvida para testar o serviço hospedado.

Referências consultadas: [getUser](https://supabase.com/docs/reference/javascript/auth-getuser), [sessão no servidor e cache](https://supabase.com/docs/guides/auth/server-side/advanced-guide).


## Cycle 3 · onboarding

Migration 20260909030000_profile_onboarding.sql: save_profile com SECURITY INVOKER, RLS e lock no próprio perfil. Troca do esporte principal e campos sociais em uma transação. UUID do jogador vem exclusivamente de auth.uid(). API POST /api/social/mutate valida origem, tamanho, campos e getUser; erros do banco são normalizados. Leituras privadas permanecem em Route Handlers com renovação de cookies, sem Server Components privados.
