# Pico — Ciclo Autônomo de Evolução

## Ciclo 9.6 — histórico e vínculos

Migration 20260910095000 no desenvolvimento exclusivo. Histórico paginado deriva somente de auth.uid(), sem parâmetro de jogador; encerramento/expiração preservam registros e a exclusão pessoal os remove. Presença atual continua limitada a duas horas, separada das arenas recentes. Perfil exibe vínculos autorizados e resumo agregado apenas mediante opção explícita (sem timestamps); mudar preferência afeta a próxima leitura com a mesma sessão. Descoberta comum considera somente membros ativos/vínculos consultáveis, nunca histórico privado. Testes comprovam leitura própria, ID alheio recusado, resumo padrão privado, revogação e remoção por cascade. 63 testes locais, lint, typecheck e build isolado aprovados.

## Ciclo 9.5 — publicação canônica e audiência

Migrations 20260910094000 e corretiva 20260910094100 no desenvolvimento. Posts pessoais aceitam local/modalidade opcionais; marcação de arena difere de distribuição. Composer mostra audiência e destinos autorizados; comunidades privadas rejeitam destino público. Publicação transacional com chave por autor evita duplicação em repetição; edição própria e remoção de distribuição preservam o post e engajamento. Feed/perfil/mural/URL direta compartilham autorização; fotos de post privado não ficam acessíveis ao antigo participante nem quando ele fez o upload. Correção aditiva evita rejeição indevida do SELECT policy durante INSERT RETURNING legado, mantendo a assinatura antiga de feed. 62 testes locais, lint, typecheck e build isolado aprovados, incluindo rollback de destino inválido, deduplicação e mídia após revogação. Não aplicado ao beta nesta etapa.

## Ciclo 9.4 — comunidades próprias

Migration 20260910093000 no desenvolvimento exclusivo. Diretório, busca/minhas comunidades, página e gestão; grupos independentes ou com vínculo solicitado/aprovado; comunidade oficial única, criação idempotente e transacional com aprovação da arena. Visibilidade beta/privada separada de entrada aberta/aprovação/convite. Papéis e membros não são herdados da arena. Convite por e-mail confirmado, aceite atômico e revogação; remoção/suspensão impede leitura privada com sessão antiga. RLS executada com dono/membro e administrador Pico que não participa: este último não lê grupo privado. Conteúdo/membros privados não aparecem na ficha mínima do diretório. 60 testes locais, lint, typecheck e build isolado aprovados. Mural será integrado ao post canônico no 9.5; fotos/recorte no 9.7.

## Ciclo 9.3 — perfil e responsabilidade de arenas

Migration 20260910092000 no desenvolvimento. Edição atômica com versão, slug/is_demo preservados, modalidades desativadas sem romper posts/check-ins antigos, perfil com responsáveis, participação persistida, pedidos de criação/reivindicação/correção e aprovação administrativa. Convites de gestão por e-mail exato, hash, validade, revogação e consumo único revalidam os poderes atuais do emissor. Não enviam e-mail. UI de gestão contextual e pedidos integrada ao /admin. Testes SQL comprovaram edição autorizada/negada, concorrência por versão, destinatário correto, repetição negada e aprovação idempotente. 57 testes locais, lint, typecheck e build isolado aprovados. Nenhuma arena real foi criada no beta.

## Ciclo 9.2 — papéis e gestão

Migration 20260910091000 aplicada somente no desenvolvimento exclusivo. Papéis globais privados e papéis escopados de arena, RPCs autorizadas, interface /admin, confirmação/reautenticação para ações sensíveis e auditoria mínima. Transferência bloqueia a arena na transação e exige participante aprovado; dono excluído deixa arena em custódia, sem apagar o local. Participação suspensa não pode ser recriada por escrita direta. 54 testes locais, lint, typecheck e build isolado aprovados; testes positivos/negativos de gestão e bootstrap em PostgreSQL descartável; regressão de interface hospedada ficará no 9.11. Membro não lê lista administrativa nem concede papel a si; dono de A não interfere em B.

## Ciclo 9.1 — isolamento e admissão

Desenvolvimento exclusivo provisionado em tsebpkfnxjvhntosbkdu (Free), sem cópia de dados. Beta existente preservado e fechado por admissão no banco, inclusive JWT antigo; bootstrap executado somente no UID de @hugo confirmado pelo usuário. Migration aditiva 20260910090000 aplicada primeiro no desenvolvimento e depois no beta. Hook oficial Before User Created restringe cadastro direto por convite de e-mail exato; beta exige confirmação. SMTP permanece dependência operacional solicitada pelo usuário, sem convites externos.

51 testes locais, lint, typecheck e build isolado aprovados. Teste real no desenvolvimento: cadastro direto não convidado negado, dois cadastros com convite, acesso social negado antes da admissão, bootstrap por membro negado e revogação com JWT antigo efetiva; IDs criados limpos. Scripts recusam URL/ref cruzados, seed/teste destrutivo beta, configuração ausente e promoção produtiva. Vercel não permite env de branch sem Git conectado: projeto separado pico-internal criado para Preview; previews comuns sem credenciais beta. Nenhum deploy novo nesta etapa.

## Ciclo 9.0 — auditoria e contratos

Baseline: 7d6f288; branch cycle-9-internal. Auditoria remota read-only confirmou nove migrations, 15 tabelas RLS, 1 conta/arquivo preservados e 3 arenas demo. Arenas têm apenas SELECT para clientes, sem edição conectada: recurso ausente, não vulnerabilidade demonstrada. Baseline: 48 testes, lint, typecheck e build isolado aprovados. Plano e Deslopify atualizados antes do código; matriz/expansão em CYCLE9_CONTRACTS.md. Evidências antigas abaixo são históricas e não aprovam esta rodada.

Próximo: 9.1 isolamento e fechamento real do beta. Produção não será provisionada/promovida nesta rodada. Bootstrap depende de UID confirmado; SMTP/caixa e aparelhos físicos são dependências independentes.

# Pico — Ciclo Autônomo de Evolução

## Integração hospedada · VERIFY / DOCUMENT

Supabase pico-dev criado no Free em São Paulo, linked; cinco migrations e seed aplicados após dry-run. Onze tabelas com RLS, 27 policies e cinco RPCs autenticadas auditadas. Tipos gerados do banco substituem o contrato manual. Vercel Hobby: https://pico-app-sepia.vercel.app, duas variáveis públicas em todos os ambientes; deploy por CLI, sem alterar Samba.

Verificação: 43 testes locais, lint/typecheck/build, 149 checks hospedados com duas contas pelos origins local/Vercel, autoria negada, JWT/refresh reais e quatro check-ins simultâneos com um único ativo. Callback PKCE local/remoto validado antes de habilitar cadastro imediato no dev; SMTP padrão é restrito à equipe. Interface publicada exercitada com cadastro, onboarding, recarga, check-in, post, like e comentário. Evidências e limites em HOSTED_SUPABASE.md. Nenhuma feature ou redesign adicionado.

## Cycles 0.5–7 · histórico da validação local

Núcleo social implementado e validado localmente nos Cycles 3–7. As seções abaixo preservam as evidências e pendências da época; a integração hospedada atual está registrada acima.

## Cycle 3 — Real auth and profile · AUDIT / PLAN

Auth já usa Supabase; perfil é somente leitura e falta onboarding. Implementar edição atômica por RPC com identidade de auth.uid(), formulário de nome/username/bio/local/esporte/nível/disponibilidade, retorno ao perfil após autenticação e descarte de dados após logout. Aceite: próprio perfil apenas, rollback em esporte/username inválidos, um esporte principal, sem e-mail no DTO. Validar migrations em PGlite, lint, typecheck e build. Supabase hospedado segue sem configuração disponível neste checkout.

## Contrato de execução

Um avanço principal por ciclo: AUDIT → PLAN → IMPLEMENT → VERIFY → DOCUMENT → COMMIT → NEXT.
Ler AGENTS.md, plano, Deslopify e schema antes da implementação. Rodar lint, typecheck e build em cada ciclo; corrigir falhas antes do commit. Registrar evidências e limitações sem confundir demonstração, banco local e serviço hospedado.

Escopo permanente: rede social mobile-first para esportes de areia. Sem reservas, pagamentos, B2B, chat, ranking avançado ou IA. Comunidades são autorizadas a partir do Ciclo 9. Preservar todas as rotas canônicas e o funcionamento sem Supabase. Nunca versionar secrets; autoria de produção deriva de auth.uid().

## Sequência

| Ciclo | Avanço | Estado |
| --- | --- | --- |
| 0.5 | Premium visual pass | Concluído |
| 1 | Supabase foundation | Concluído localmente |
| 2 | Real read layer | Implementado; integração hospedada pendente |
| 3 | Real auth and profile | Implementado; validado localmente |
| 4 | Real checkin | Implementado; validado localmente |
| 5 | Real social feed | Implementado; validado localmente |
| 6 | Connections and discovery | Implementado; validado localmente |
| 7 | Product hardening | Concluído localmente; checklist hospedado pendente |

## Cycle 0.5 — Premium visual pass

### AUDIT

Base: main limpa em 4ca4e57. Seis jornadas sociais funcionam em memória; Auth tem formulários/PKCE opcionais; queries e tipos ainda não conectam o produto ao banco. Sem migrations. A revisão CSS encontrou areia aplicada a CTAs, filtros, navegação, presença e fundos inteiros. Há foco/reduced motion e estrutura mobile, mas o excesso de cor quente compete com pessoas e conteúdo.

### PLAN — antes de implementar

Avanço único: refinar o sistema visual, sem funcionalidades novas. Background #07080A, superfícies #111317, texto #F7F3EA; champagne #C8A96A só na marca/contexto. Verde-água #4DE1C1 para ação/presença. Neutralizar fundos e filtros, refinar navegação/cards/inputs e respostas a toque/hover, preservar áreas de 44px e safe areas.

Aceite: nenhuma superfície principal amarela/bege; ações consistentes; seis rotas preservadas; foco e movimento reduzido mantidos; lint, typecheck e build aprovados. Inspeção visual e verificações HTTP serão registradas separadamente.

### IMPLEMENT

Tokens globais/Tailwind, cores do manifesto/viewport, cards, ações, filtros, navegação, seleção e respostas a hover/tap refinados. Champagne restrito à marca/indicador demo; cores quentes removidas das superfícies sociais. Funcionalidades preservadas.

### VERIFY

`npm run lint`, `npm run typecheck`, `npm run build`: aprovados, sem correções necessárias. Navegador em viewport 390×844: feed, arenas, detalhe, check-in, descoberta e perfil renderizam; cinco destinos móveis; largura de conteúdo não excedeu o viewport. Capturas do feed/check-in confirmaram superfícies escuras e ações verde-água. Não equivale a testes em dispositivos físicos.

### DOCUMENT / COMMIT

Plano, Deslopify, design system, schema (estado de integração) e changelog atualizados. Commit: `Cycle 0.5: premium visual pass`.

### NEXT

Concluído: refinamento visual sem novas funções. Ainda mock: todas as ações e dados sociais. Risco: Auth hospedado e instalação móvel não verificados. Próximo: Cycle 1, SQL versionado e RLS. Prompt: “Execute Cycle 1 conforme CODEX_AUTONOMOUS_LOOP.md, teste as migrations/seeds/policies localmente, documente limites e faça commit.”

## Cycle 1 — Supabase foundation

### AUDIT

Cycle 0.5 commitado em 075fcf6; árvore limpa. Sem .env.local, Supabase CLI, Docker ou Postgres instalados. Contrato SQL existe apenas em documentação; tipos manuais não possuem cidade, nível principal ou identificação demo. As telas continuam independentes do backend. Auth opcional existente não foi exercitado contra serviço hospedado.

### PLAN — antes de implementar

Avanço único: banco versionado para dez tabelas sociais, RLS/grants explícitos, constraints/FKs/índices, trigger após signup e seeds de catálogo/arenas fictícias. Preparar campos para onboarding futuro. Conexões ficam no Cycle 6; nenhuma interface passa a usar dados reais neste ciclo.

Check-ins terão somente leitura pelo cliente nesta fundação; escrita direta revogada. RPCs com identidade derivada e relógio do servidor serão entregues no Cycle 4. Não abrir policy permissiva temporária.

Aceite: migrations aplicam do zero, seed pode repetir sem duplicar, RLS cobre todas as tabelas, anônimo não lê dados de jogadores, usuários distintos não forjam autoria, referências inválidas e arena privada são recusadas. Usar PGlite (Postgres em WASM) para executar o SQL real com fixture mínima de auth.users/auth.uid(); a fixture não é migration de produção. Validar trigger, grants, constraints e policies. Rodar lint/typecheck/build/test, documentar diferença entre SQL local e Auth/PostgREST hospedado. Commit: `Cycle 1: supabase foundation`.


### IMPLEMENT

Criada migration atômica com dez tabelas, enums, FKs/constraints/índices, RLS/grants de operação e coluna. Trigger de perfil com identidade derivada do Auth, nome sanitizado e username único; backfill para contas pré-existentes sem copiar e-mail. Seed idempotente só de esportes e arenas fictícias is_demo. Configuração Supabase CLI local e tipos manuais alinhados ao que efetivamente existe. Adicionado PGlite apenas como devDependency e comando test:db.

### VERIFY

`npm run lint`, `npm run typecheck`, `npm run build`: aprovados. `npm test`: 20/20 (dez demo + dez grupos de SQL/RLS). Migrations aplicadas do zero, seed repetido, RLS executada com anônimo/Alice/Bob e cenário de privilégios amplos herdados para comprovar revogações. Autoria forjada, perfil alheio, timestamps, arena privada, modalidade inválida, campos vazios/longos, duplicações e escrita direta em checkins recusados. Revisão reforçou body para rejeitar newline/tab sem texto, além de espaços. Nenhum comando obrigatório falhou.

Smoke de produção: seis rotas canônicas e login/signup retornaram 200; slugs inexistentes de arena/perfil retornaram 404; / redirecionou 307 para /feed. Git diff --check aprovado. Nenhum secret adicionado.

Limite: Postgres/WASM executa SQL/RLS real, mas a identidade vem de fixture local. JWT, Auth/e-mail, PostgREST, refresh, Storage, concorrência multiconexão e ambiente hospedado ainda não foram exercitados.

### DOCUMENT / COMMIT

Schema reescrito para separar implementado e futuro; plano/Deslopify/README/changelog atualizados. Commit: `Cycle 1: supabase foundation`.

### NEXT

Concluído: fundação SQL reproduzível/testada e contratos do cliente. Ainda mock: todas as telas sociais e interações do DemoProvider. Riscos: tipos manuais devem ser gerados quando houver projeto configurado; seeds fictícios só em desenvolvimento; nenhuma RPC de presença, conexão, upload, moderação ou persistência social integrada.

Próximo ciclo recomendado: Cycle 2 — Real Read Layer. Helpers de perfil próprio, esportes, arenas e slug; integrar /arenas, /arenas/[slug], /perfil com loading/erro/vazio/autenticação e indicação de origem. Não misturar Rafa demo com usuário Auth. Banco configurado que falha deve apresentar erro; só ausência de configuração usa demo. Testar com e sem env, aplicar as migrations em ambiente de desenvolvimento e validar leituras com JWT real antes de declarar integração hospedada concluída.

Prompt sugerido: “Leia AGENTS.md e docs/CODEX_AUTONOMOUS_LOOP.md. Execute o Cycle 2: camada real de leitura de perfil próprio, esportes e arenas, integrada a /arenas, /arenas/[slug] e /perfil, preservando demo explícito e distinguindo erro/vazio/loading/sessão. Use as migrations do Cycle 1; não finja sucesso de Supabase sem testar. Rode lint, typecheck, build e testes pertinentes, atualize os quatro documentos e faça commit Cycle 2: real read layer.”

## Cycle 2 — Real read layer

### AUDIT

Base c0f2a91, árvore limpa. SQL/RLS versionado e 20 testes disponíveis. Queries existentes ainda não são chamadas; detalhe por slug só conhece mocks; shell sempre mostra Rafa/atividades fictícias. getSupabaseConfig retorna null tanto para ausência quanto erro de configuração. Perfil ainda não consulta identidade verificada. Não há projeto hospedado configurado neste início de ciclo.

### PLAN — antes de implementar

Avanço único: leitura real de catálogo, arenas e perfil próprio com demo explícito. Separar configuração ausente/inválida/válida; introduzir endpoint de leitura sem cache e DTOs públicos. Perfil usa getUser no Route Handler (pode renovar cookies), sem leitura privada em Server Component ou confiança em ID do cliente. Proxy SSR fica no ciclo de Auth.

Queries tipadas: esportes, arenas públicas com modalidades, arena por slug, perfil próprio e esportes. Telas /arenas, /arenas/[slug], /perfil escolhem demo somente sem configuração. Componentes conectados exibem loading, erro com retry, vazio, sessão ausente e origem confirmada após sucesso. Shell não mistura retratos/atividades fictícias com dados conectados; seeds is_demo permanecem rotulados. Sem mutations novas e sem CTAs que escrevam localmente fingindo persistência real.

Aceite: seis rotas continuam funcionando sem env; URL/config parcial ou inválida nunca cai silenciosamente no demo; catálogo vazio não vira mock; slug desconhecido tratado; perfil exige identidade verificada e nunca retorna e-mail; falhas de banco/Auth têm mensagem segura; resposta privada sem cache. Testes de queries/contratos e da UI para estados conectado/erro/vazio/sessão, além de lint/typecheck/build e suite SQL. Validar contra Supabase hospedado somente se configuração for disponibilizada; testes com transporte controlado serão identificados como tais. Commit: `Cycle 2: real read layer`.


### IMPLEMENT

Queries de esportes, arenas públicas com modalidades e paginação de 24 itens + lookahead, detalhe por slug e perfil próprio com modalidades. Endpoint GET /api/social/read valida recurso/slug/offset, usa getUser para obter o próprio ID e retorna DTOs sem e-mail, metadados Auth ou paths privados. Cache-Control private/no-store, Vary Cookie; SDK server por requisição, cookies renováveis no Route Handler, timeout e retry manual.

/arenas, /arenas/[slug] e /perfil usam dados reais quando configurados. Sem env preservam todas as views anteriores. Config incompleta/inválida retorna erro, inclusive rejeitando secret keys/legacy service_role. Novas views possuem loading, retry, sessão ausente, perfil ausente, vazio, origem após sucesso e rotulagem is_demo. Dados anteriores são descartados ao trocar slug/página, atualizar ou voltar à aba. O shell conectado não mostra Rafa nem atividades fictícias; feed/descoberta/check-in e perfis públicos mock mantêm demonstração explícita.

Detalhe conectado não restringe slug aos mocks. Metadados são genéricos até consulta no cliente. Busca/filtros atuam na página de 24 arenas e estão identificados como tal. Nenhuma mutation social adicionada; ações do demo foram preservadas somente em seu contexto. Fotos remotas/Storage ficam fora: imagem local apenas para arenas is_demo; arena real sem foto recebe placeholder neutro.

### VERIFY

Lint/typecheck/build e 29 testes aprovados (dez demo, dez SQL/RLS, nove de configuração/queries/contratos). SDK Supabase real com transporte controlado verificou filtros, paginação, erro sem fallback, identidade verificada e DTO sem e-mail. RLS continua testada no Postgres/PGlite do Cycle 1.

Smoke de produção sem env: oito rotas 200, arena/perfil inexistentes 404, três endpoints retornando status demo sem dados inventados, recurso inválido 400 e cache privado/no-store. O primeiro assert de smoke esperava Vary exatamente Cookie; o Next acrescenta campos próprios. Corrigido o teste para verificar a presença de Cookie entre os valores, preservando os cabeçalhos corretos do framework; smoke passou depois. Após criar builds isolados, lint percorreu artefatos gerados .next-read-check/.next-invalid-check. Acrescentado ignore desses diretórios ao ESLint (sem reduzir regras do código-fonte), ajustada uma variável de teste para const e executada novamente a cadeia obrigatória. O aviso de scroll suave do Next foi resolvido declarando data-scroll-behavior no html.

Build conectado isolado em .next-read-check, porta 3002, apontando exclusivamente à fixture loopback 54331: três arenas carregadas de SQL local, sessão ausente 401, arena inexistente 404, catálogo vazio permanece vazio, falha de serviço 503 sem detalhes internos. No navegador em 390×844: loading, sucesso, rótulos demo, busca por Moema, detalhe, vazio, falha/retry/recuperação, perfil sem sessão, login de teste, perfil Alice sem e-mail/Rafa e logout com retorno à exigência de login. Sem overflow horizontal nas leituras inspecionadas. Um servidor isolado com configuração incompleta também confirmou erro explícito na interface. Captura do catálogo revisada.

Auth/REST da fixture são simulados; o SQL é executado em Postgres/PGlite. Não houve validação de JWT real, e-mail, refresh de sessão em Supabase hospedado ou teste em aparelho físico. A fixture não integra a aplicação nem é usada como fallback.

### DOCUMENT / COMMIT

Atualizados plano, Deslopify, schema, README e changelog. Configuração de build isolado documentada; fixture em tests/helpers/read-api-fixture.mjs, nunca importada no app. Commit: `Cycle 2: real read layer`.

### NEXT

Concluído: camada real de leitura e telas integradas, verificadas sem env e com transporte controlado. Ainda mock: feed, descoberta, check-ins, curtidas/comentários/conexões/acompanhamento e edição do personagem demo. Riscos: integração hospedada não exercitada; tipos manuais; busca por página; perfis públicos individuais ainda mock; falta de proxy SSR para futuras páginas privadas; sem edição real, Storage, moderação ou PWA offline completo.

Próximo ciclo: Cycle 3 — Real Auth + Profile. Concluir onboarding/edição própria, username, bio, cidade/bairro, esporte principal/nível; manter login/signup/logout existentes e adicionar renovação SSR antes de páginas privadas. Aplicar migrations em projeto de desenvolvimento configurado e validar duas contas reais antes de considerar Auth hospedado pronto.

Prompt sugerido: “Execute Cycle 3 conforme CODEX_AUTONOMOUS_LOOP.md. Preserve a camada de leitura do Cycle 2, finalize autenticação/sessão/onboarding/edição do próprio perfil com RLS e validação de username/esporte/nível/cidade, sem e-mail público e sem confundir demo com conta real. Teste autorizações com duas identidades, rode lint/typecheck/build e testes, documente limites e faça commit Cycle 3: real auth and profile.”

Configuração hospedada: o usuário informou que salvou .env.local, mas esse arquivo não foi encontrado em /Users/8ugo/Documents/picoapp durante a conferência. Pergunta sobre a localização enviada; nenhuma chave exibida ou procurada fora do escopo do projeto. A validação hospedada segue pendente dessa localização.


## Cycle 3 · resultado

Cycle 3 concluído: onboarding e edição atômica por save_profile, identidade verificada, autenticação retorna ao perfil, dados descartados após troca de sessão. 32 testes passaram; lint/typecheck/build passaram. Corrigidos parâmetro TS incompatível com strip-only e tipos gerados duplicados em .next. Auth/e-mail/refresh hospedados seguem pendentes. Próximo: Cycle 4, start_checkin/end_checkin e presença com prazo.


## Cycle 4 · AUDIT / PLAN

Check-ins atuais são demo e a tabela nega toda escrita direta. Implementar RPCs start_checkin(arena_id,sport_id) e end_checkin() com auth.uid(), lock por perfil, arena pública/modalidade válidas e prazo de duas horas. Integrar formulário e presença com atualização periódica; preservar demo. Aceite: substituição atômica, saída própria, prazo do servidor, rejeição de autoria client e arena inválida. UI mostra prazo, consentimento e saída visível; nenhum tracking. Verificar SQL, lint, typecheck e build.


## Cycle 4 · resultado

Cycle 4 implementado: start_checkin/end_checkin com auth.uid(), locks por jogador, arena pública e modalidade válidas; expiração em 2h; substituição e saída própria. /checkin usa presença real, atualização periódica e demo explícito. 36 testes passaram; lint/typecheck/build passaram. Tipos duplicados gerados pelo ambiente voltaram a aparecer: tsconfig exclui somente cópias com espaço no nome dentro de .next. Testes PGlite cobrem transações/duas identidades, mas não concorrência de múltiplas conexões de Postgres hospedado. Próximo: Cycle 5, feed social.


## Cycle 5 · AUDIT / PLAN

Feed atual é demo; schema já protege autoria e visibilidade de posts/likes/comentários. Integrar feed paginado, publicação contextualizada por arena/esporte, curtir/descurtir e comentários paginados. Leituras com contagens no banco sem carregar listas ilimitadas. Aceite: autoria derivada da sessão, sem otimismos falsos, texto preservado em erro, vazio convida ao primeiro post, RLS continua protegendo ações de outras contas. Testar SQL/validação e lint/typecheck/build.


## Cycle 5 · resultado

Cycle 5 concluído: feed e mural da arena com posts persistidos, curtidas reversíveis, comentários e paginação de 20 itens. Escritas derivam autoria de auth.uid(), validação no servidor e RLS; contagens pelo banco. Atualização após mutation preserva formulário/comentário aberto; troca de conta descarta dados anteriores. 40 testes, lint, typecheck e build passaram. Upload de fotos não implementado; Auth/PostgREST hospedados pendentes. Próximo: Cycle 6, conexões e descoberta.


## Cycle 6 · AUDIT / PLAN

Descoberta e perfis alheios ainda são demo. Criar conexões unilaterais privadas do seguidor, sem auto-conexão; descoberta paginada de perfis completos por esporte/nível, arena (vínculo ou presença ativa) e check-in ativo nas últimas duas horas. Integrar perfil por username e links do feed/presença, sem e-mail. Sem grupos/comunidades novas. Aceite: RLS de autoria, identidade verificada, filtros aplicados no banco antes da paginação, ausência de falso jogador em ambiente conectado. Testes SQL/SDK, lint/typecheck/build.


## Cycle 6 · resultado

Cycle 6 concluído: connections com RLS privada do seguidor, sem auto-conexão; descoberta paginada por arena/esporte/nível/presença ativa; perfis por username e links reais no feed/check-in. Apenas perfis com onboarding e esporte entram na descoberta; nenhuma comunidade nova. 43 testes, lint, typecheck e build passaram. Próximo: Cycle 7, jornada completa no navegador, revisão mobile/erros e checklist beta. Integração hospedada ainda pendente.


## Cycle 7 · AUDIT / PLAN

Núcleo social conectado está implementado em todos os destinos, com 43 testes; ainda falta exercer a jornada integrada no navegador e revisar estados/responsividade. Expandir fixture local de transporte para Auth simulado e SQL real das migrations, testar cadastro→onboarding→arena→check-in→post→curtida/comentário→descoberta→conexão→logout. Revisar 390px/desktop, expiração, loading sem apagar rascunho, autenticação inválida e erros sem fallback oculto. Atualizar README/schema/plano/checklist beta com evidência e limite explícito: não equivale a validar Supabase hospedado, e-mail, JWT real, concorrência multi-conexão ou instalação em aparelho.


## Cycle 7 · VERIFY / DOCUMENT / NEXT

Cycle 7 concluído: jornada integrada no navegador (SQL/PGlite real, Auth/REST simulado) de cadastro até logout, incluindo onboarding, arena, check-in, post, curtir/descurtir, comentário, descoberta e conectar/desconectar. Conflito de username não grava parcialmente; falha de publicação mantém rascunho; retry não troca para demo. Formulário de arena pré-seleciona o contexto, perfil editável não repete a identidade, avisos de curtida/comentário ficam discretos, rascunho é separado por conta e presenças expiradas saem da descoberta.

Verificação visual: 390×844 e desktop 1280; cinco destinos em 320px sem overflow horizontal, um h1 por tela e inputs observados a 16px. 43 testes automatizados e 39 verificações HTTP integradas; lint/typecheck/build aprovados. A fixture serializa o Postgres descartável e não implementa segurança de Auth real. Isso não comprova e-mail, JWT, refresh hospedado, concorrência multi-conexão nem aparelhos físicos.

Ainda demo: todas as jornadas quando falta configuração; seeds continuam fictícios mesmo no banco conectado. Limites conectados: sem upload, acompanhamento de arenas na UI, edição/exclusão de posts/comentários na UI, recuperação de senha, bloqueios/moderação ou service worker. README e BETA_CHECKLIST.md documentam o que falta antes do beta hospedado.

Próximo avanço: validar o ambiente Supabase de desenvolvimento com duas contas reais e executar os itens pendentes do checklist beta. Prompt: “Execute a validação hospedada do BETA_CHECKLIST.md com o projeto de desenvolvimento configurado, mantenha o escopo dos Cycles 0.5–7 e registre as evidências.”
