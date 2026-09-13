# Changelog — Pico

## 2026-09-12 — refino integrado publicado

- PR #6 integrado após verify e regressão Chromium/WebKit aprovados; artefato Production READY promovido ao domínio principal.
- 21 migrations confirmadas em desenvolvimento/principal; tipos hospedados idênticos. Conta, dados das 29 tabelas anteriores e três arquivos preservados.
- Smoke público e navegação com sessão real confirmados; testes destrutivos restritos ao desenvolvimento, com limpeza completa. [Evidência](JOURNEY_RELEASE.md).

## 2026-09-12 — validação hospedada e preparação da publicação integrada

- Backups cifrados de desenvolvimento e principal; ledger conferido antes da aplicação das duas migrations novas no desenvolvimento. Tipos completos regenerados do Supabase remoto.
- Gate real: 210 verificações de Auth, sessão, RLS, jogos privados, compartilhamento concorrente, destinos, moderação e Storage; somente identidades descartáveis de desenvolvimento.
- Mantidos os 81 testes locais, lint, typecheck e build conectado. Publicação autorizada por PR/CI na main e `scripts/deploy.mjs`, sem bypass das proteções.
- [Preparação, contratos e limites da entrega](JOURNEY_RELEASE.md). Registros locais anteriores abaixo são históricos.

## 2026-09-12 — jornada integrada, composição e compartilhamento (local)

- Início com vínculos próprios e primeira ação; navegação fixa Início/Pessoas/Comunidades/Arenas/Perfil, sem presença ao vivo. Pessoas, grupos, lugares, posts e jogos recebem composições próprias.
- Comunidades com propósito/condições e participação pendente distinta; ações contextuais entre pessoas, arena, grupo e publicação; demo local percorre a mesma narrativa.
- Compartilhamento separado de jogo privado, com audiência/destinos visíveis, texto/foto opcionais, retry idempotente e link canônico; snapshot da data não muda ao corrigir/excluir o registro.
- Migration local 20260912091000: contexto de post sujeito a RLS, confirmação privada de envio e leitura estritamente própria do legado. Nada aplicado remotamente.
- 81 testes, lint, typecheck, builds conectado/demo e UI local passaram. 25 medições responsivas, nove telas auxiliares, texto ampliado e teclado/altura reduzida. [Relatório e limitações](journey-review/README.md).
- Roteiros de teste antigos atualizados para o contrato sem presença; sem execução remota, push, merge ou deploy nesta rodada.

## 2026-09-12 — registro privado depois do jogo (incremento local)

- Retirada transversal de presença: navegação, demo, perfis, descoberta, arena, compositor, textos e contratos HTTP; `/checkin` redireciona para `/jogos`.
- Jogos privados com arena/modalidade/data civil, correção versionada, exclusão própria e tentativas idempotentes. Chave privada mínima impede recriação por retry depois da exclusão.
- Migration aditiva 20260912090000: preserva legado sem exposição/conversão; revoga RPCs/leituras de presença e limita descoberta a vínculos/interesses. Tipos RPC gerados em banco local descartável.
- Lint, typecheck, build, 75 testes locais, 10 checks HTTP sem sessão e smoke Chromium demo/conectado com fixture. [Contratos e limites](POST_GAME.md); [evidências visuais](visual-review/post-game/README.md).
- Sem push, merge, deploy ou alteração remota. Tarefa integradora assume jornada/design completo e compartilhamento estruturado.


## Refino visual global · 2026-09-09

- Fonte nativa única, escala relativa, superfícies carvão, controles e raios consistentes; acento verde-água e vidro restrito a elevações.
- Comunidades com grupos claros e seleção múltipla acessível; feed com compositor em diálogo e rascunho preservado; perfil do Ciclo 10 harmonizado, incluindo HEIC existente.
- Correções de foco, Tab e Escape em diálogos aninhados, uma área de rolagem e ações acessíveis em altura reduzida.
- 50 medições responsivas, capturas reais antes/depois, testes de interação com dados locais, 76 testes, lint, tipagem e build aprovados. Contraste do texto discreto corrigido; regressão Chromium/WebKit ampliada.
- Sem alterações de API, Supabase, permissões, serviços ou dependências nesta rodada. [Relatório visual](visual-review/README.md).

## Ciclo 8 · preparação do beta · 2026-09-09

- Avatares e publicações com fotos reais, buckets privados, normalização sem metadados, limites de arquivo/quantidade e autoria validada no banco.
- Bloqueio bilateral, denúncia privada, triagem administrativa, exclusão de conteúdo próprio e conta com reautenticação e limpeza de Storage.
- Recuperação de senha e página de privacidade, gestão de bloqueios/denúncias/fotos em /conta; entrega externa de e-mail depende de SMTP.
- Limites de escrita no banco, incluindo acesso direto ao PostgREST; reservas de mídia concorrentes respeitam a cota. Acesso direto e assinatura de arquivos do Storage negados.
- Quatro migrations novas aplicadas após dry-run, sem recriar infraestrutura. Tipos regenerados do remoto.
- Corrigidas duas falhas encontradas no serviço hospedado: relacionamento ambíguo de autor no feed e foto ainda acessível após bloqueio. A entrega agora consulta RLS antes de retornar cada imagem sem cache.
- Lint/typecheck/build e 48 testes locais passaram. Suíte hospedada com duas identidades, mídia, moderação, recuperação por token e exclusão completa passou. UI móvel e troca de sessão entre abas verificadas; contas descartáveis limpas.
- README/schema/runbook/checklist atualizados. BLOCKED para convites externos até fechar SMTP, contato/responsável e gates operacionais; nenhum plano pago ativado.

## Integração Supabase hospedada · 2026-09-09

- Criado pico-dev no Supabase Free em São Paulo, com repo linked, cinco migrations e seed aplicados após dry-run; RLS das onze tabelas, 27 policies, grants e cinco RPCs auditados.
- Configuradas envs públicas locais e Vercel Hobby; aplicação publicada em https://pico-app-sepia.vercel.app por CLI. Projetos Samba preservados; nenhuma assinatura paga.
- Tipos gerados diretamente do banco, geração reproduzível com preservação do arquivo em falha; DTO de presença opcional separado do schema gerado. Ajustada chamada de end_checkin sem argumentos.
- Auditoria SQL somente de leitura, teste hospedado opt-in com duas contas descartáveis e limpeza, e exclusões explícitas de credenciais/fixtures no upload Vercel.
- 43 testes locais e 149 checks hospedados aprovados; lint/typecheck/build e smoke local/remoto passaram. Fluxo social, autoria negada, refresh, cookies e check-ins simultâneos comprovados. Callback PKCE validado localmente e na Vercel com tokens reais de conta descartável.
- Dev usa cadastro imediato; SMTP padrão só aceita membros da equipe. Confirmação de e-mail para público externo, testes físicos e preparação de beta permanecem explícitos em HOSTED_SUPABASE.md e BETA_CHECKLIST.md.

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


## Cycle 6 · resultado

Cycle 6 concluído: connections com RLS privada do seguidor, sem auto-conexão; descoberta paginada por arena/esporte/nível/presença ativa; perfis por username e links reais no feed/check-in. Apenas perfis com onboarding e esporte entram na descoberta; nenhuma comunidade nova. 43 testes, lint, typecheck e build passaram. Próximo: Cycle 7, jornada completa no navegador, revisão mobile/erros e checklist beta. Integração hospedada ainda pendente.


## Cycle 7 · VERIFY / DOCUMENT / NEXT

Cycle 7 concluído: jornada integrada no navegador (SQL/PGlite real, Auth/REST simulado) de cadastro até logout, incluindo onboarding, arena, check-in, post, curtir/descurtir, comentário, descoberta e conectar/desconectar. Conflito de username não grava parcialmente; falha de publicação mantém rascunho; retry não troca para demo. Formulário de arena pré-seleciona o contexto, perfil editável não repete a identidade, avisos de curtida/comentário ficam discretos, rascunho é separado por conta e presenças expiradas saem da descoberta.

Verificação visual: 390×844 e desktop 1280; cinco destinos em 320px sem overflow horizontal, um h1 por tela e inputs observados a 16px. 43 testes automatizados e 39 verificações HTTP integradas; lint/typecheck/build aprovados. A fixture serializa o Postgres descartável e não implementa segurança de Auth real. Isso não comprova e-mail, JWT, refresh hospedado, concorrência multi-conexão nem aparelhos físicos.

Ainda demo: todas as jornadas quando falta configuração; seeds continuam fictícios mesmo no banco conectado. Limites conectados: sem upload, acompanhamento de arenas na UI, edição/exclusão de posts/comentários na UI, recuperação de senha, bloqueios/moderação ou service worker. README e BETA_CHECKLIST.md documentam o que falta antes do beta hospedado.

Próximo avanço: validar o ambiente Supabase de desenvolvimento com duas contas reais e executar os itens pendentes do checklist beta. Prompt: “Execute a validação hospedada do BETA_CHECKLIST.md com o projeto de desenvolvimento configurado, mantenha o escopo dos Cycles 0.5–7 e registre as evidências.”


## Ciclo 9.7

Ciclo 9.7: recorte reutilizável (react-easy-crop 6.2.3, MIT), preparação local limitada, autorização de fotos por recurso, proteção contra remoção concorrente de arquivos em uso. 66 testes locais aprovados.


## Ciclo 9.8

9.8: contexto seguro de convites por aba, revogação de convite de comunidade, confirmação/recovery explícitos entre contextos com templates versionados; nenhum envio externo. 68 testes.


## Ciclo 9.9

9.9: /instalar, manifesto beta, versão compilada, atualização explícita, estado offline e retomada da sessão. Mantido PKCE padrão porque o Supabase Free recusou templates sem SMTP; alternativa entre contextos preparada e desativada.


## Ciclo 9.10

9.10: moderação de conteúdo e suspensão efetivas; custódia/arquivo de comunidades e arenas pela administração; backup cifrado com bytes e ensaio real de restauração local; logs mínimos, CI e wrapper de deploy interno. 71 testes locais, 170 checks hospedados, 21 UI móvel. Corrigidos submits ausentes e confirmação de avatar descartada por refresh.

## Ciclo 9.11 — regressão integrada

- Jornadas complementares de gestão, histórico, moderação e custódia validadas com sessões reais.
- Teste de formulários portátil entre macOS/Linux; guarda de Preview aceita ref vazio apenas com branch interna explícita.
- Comando hosted aponta para a suíte C9 e limpeza tolera identidade já excluída pelo teste.
- Auditoria reproduzível de segredos; documentação atual consolida ambientes, comunidades, permissões, operação e PWA.
- 72 testes locais, 170 checks remotos anteriores e 29 checks de navegador. Deploy interno e estado de CI registrados separadamente na revisão.

9.11 ajuste de deploy: Vercel tratou o primeiro deploy de projeto vazio como Production mesmo sem --prod. Tentativa interrompida em build, sem beta nas variáveis Production; wrapper agora exige --target=preview explicitamente.

## Ciclo 9 — entrega interna verificada

Preview e891dca1e741 publicado em pico-internal.vercel.app; CI verde, migrations 19/19 em dev/beta e 67 checks na URL real. Conta/arenas/foto anteriores preservadas; fixtures por ID limpas. README, ambientes, schema, operação, PWA e checklist refletem o estado publicado. Produção futura e lançamento permanecem não autorizados.

## GitHub — diagnóstico e preparação da proteção

Documentada a causa da CI antiga (ripgrep ausente), a correção já existente e a CI atual aprovada. Preparados rulesets de PR/checks para main e preservação de histórico nas duas branches; aplicação remota ainda depende da confirmação de identidade exigida pelo GitHub. Lint, typecheck e build locais passaram. Sem mudança de código, merge, deploy ou plano.

## GitHub — proteção ativada e verificada

Após autenticação do responsável, rulesets 22706380 e 22706456 salvos como ativos. Main exige PR, check verify do GitHub Actions, base atualizada e discussões resolvidas. Main e cycle-9-internal impedem force push e exclusão, sem bypass; API confirmou ambas protegidas. PR continua em rascunho, main e Preview preservados. Documentação atualizada com evidência remota.

## Publicação unificada no principal

- Orientação de ambiente interno substituída pela autorização do responsável: main publica no projeto Vercel pico-app e domínio pico-app-sepia.vercel.app.
- npm run deploy substitui deploy-internal; confere main limpa, origem sincronizada, projeto, identidade remota e migrations. Stage opcional antes de promover.
- Nome Pico na instalação, textos de acesso atualizados, encaminhamento do endereço antigo e Site URL Auth principal.
- Mesmo Supabase e dados existentes; sem migrations novas, mudança de RLS/admissão ou compra. Desenvolvimento segue exclusivo dos testes destrutivos.
- 73 testes locais, lint, types e build aprovados; variáveis Production e 19 migrations conferidas. Evidência da publicação registrada no PR da alteração.
