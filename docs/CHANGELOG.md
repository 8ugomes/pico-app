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
