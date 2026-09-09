# Changelog — Pico

## Rodada 2 · 2026-09-09

Escopo registrado antes de implementar: revisão visual forte, seis telas sociais, estado de demonstração, navegação fixa, mocks de São Paulo, documentação Supabase e verificações completas.

- Home abre diretamente /feed.
- Criadas /feed, /arenas, /arenas/[slug], /checkin, /descobrir, /perfil e /perfil/[username].
- Nova interface social com header compacto, navegação inferior, alternativa desktop e cards específicos.
- Imagens originais locais de pessoas e arena urbana; dados de São Paulo inteiramente fictícios.
- Curtidas, comentários, posts, conexões, arenas seguidas, edição de perfil e disponibilidade funcionam em memória.
- Check-in de 2h, um por jogador, com encerramento, expiração e presença compartilhada entre telas.
- Fonte mock única, tipos de domínio, reducer testável, tipos manuais do Supabase e queries futuras.
- Schema V1, RLS, constraints, índices, Storage e plano de integração documentados.
- Manifesto PWA atualizado para /feed. Auth existente preservado e separado da demonstração.
- Regra permanente em AGENTS.md: atualizar plano/Deslopify antes e depois de cada rodada, executar checks e registrar changelog/commit.
- Lint/typecheck/build aprovados; 10 testes de domínio aprovados; 15 URLs sociais, erros 404, Auth sem env, callback, ícones e manifesto verificados.
- Sem backend social real, service worker, instalação física ou inspeção automatizada em navegador nesta rodada.

## Rodada 1 · 2026-09-09

- Setup npm corrigido com cache local.
- Home inicial, login/signup e callback PKCE.
- Componentes, identidade, manifesto e ícones.
- Documentação do MVP.
- Conteúdo publicado em 8ugomes/pico-app, main (9216df6).

## Cycle 0.5 · 2026-09-09

Premium visual pass: superfícies carvão, champagne pontual, ação verde-água, filtros neutros, estados de toque/hover, manifesto alinhado. Criado registro do ciclo autônomo. Lint/typecheck/build aprovados e seis jornadas inspecionadas em viewport móvel.

## Cycle 1 · 2026-09-09

Supabase foundation: migration atômica com dez tabelas, RLS/grants mínimos, enums/constraints/índices, trigger e backfill de perfil, seed de esportes/arenas fictícias e config local. Tipos cliente alinhados, test:db com PGlite, 20 testes totais aprovados. Lint/typecheck/build e smoke das rotas aprovados. Sem aplicação hospedada ou integração social no frontend.

## Cycle 2 · 2026-09-09

Real read layer: queries de perfil próprio/esportes/arenas, endpoint privado sem cache, config ausente/inválida/conectada, três jornadas integradas, loading/erro/retry/vazio/sessão, paginação e DTO sem e-mail. Shell conectado sem pessoas/atividades inventadas. Preservado demo nas rotas não integradas e na ausência de env. 29 testes e lint/typecheck/build aprovados; UI e HTTP exercitados com SQL local e Auth/REST controlados. Integração Supabase hospedada pendente.


## Cycle 3 · resultado

Cycle 3 concluído: onboarding e edição atômica por save_profile, identidade verificada, autenticação retorna ao perfil, dados descartados após troca de sessão. 32 testes passaram; lint/typecheck/build passaram. Corrigidos parâmetro TS incompatível com strip-only e tipos gerados duplicados em .next. Auth/e-mail/refresh hospedados seguem pendentes. Próximo: Cycle 4, start_checkin/end_checkin e presença com prazo.


## Cycle 4 · resultado

Cycle 4 implementado: start_checkin/end_checkin com auth.uid(), locks por jogador, arena pública e modalidade válidas; expiração em 2h; substituição e saída própria. /checkin usa presença real, atualização periódica e demo explícito. 36 testes passaram; lint/typecheck/build passaram. Tipos duplicados gerados pelo ambiente voltaram a aparecer: tsconfig exclui somente cópias com espaço no nome dentro de .next. Testes PGlite cobrem transações/duas identidades, mas não concorrência de múltiplas conexões de Postgres hospedado. Próximo: Cycle 5, feed social.


## Cycle 5 · resultado

Cycle 5 concluído: feed e mural da arena com posts persistidos, curtidas reversíveis, comentários e paginação de 20 itens. Escritas derivam autoria de auth.uid(), validação no servidor e RLS; contagens pelo banco. Atualização após mutation preserva formulário/comentário aberto; troca de conta descarta dados anteriores. 40 testes, lint, typecheck e build passaram. Upload de fotos não implementado; Auth/PostgREST hospedados pendentes. Próximo: Cycle 6, conexões e descoberta.
