**Monitoramento:** rota de saúde e configuração gratuita externa em [Disponibilidade](docs/AVAILABILITY.md).

> Atualização da beta de 13/09/2026: o responsável decidiu cadastro com e-mail e senha, sem confirmação e sem SMTP. Recuperação por e-mail indisponível. A política explícita está em `config/auth-policy.json`; configuração auditável em `scripts/configure-beta-access.mjs`. [Revisão atual de estabilidade](docs/STABILITY_REVIEW.md). A restrição SMTP dos registros anteriores foi substituída por essa decisão.

> Preparação para beta: [segurança, testes e pendências de abertura](docs/BETA_SECURITY.md). O cadastro vigente não depende de SMTP nem de confirmação de e-mail. Antes do beta externo, ainda é obrigatório ativar proteção antiabuso diretamente no Supabase Auth, aprovar a política pública de recuperação e fechar contatos, privacidade e operação de moderação.

> Estado de desenvolvimento em 18/09/2026: [diagnóstico, mensagens, push e sequência para lojas](docs/PICO_DEVELOPMENT_REVIEW_2026-09-18.md). Mensagens e push são implementações sob ativação explícita, ainda sem publicação desta rodada. O cadastro da beta continua sem confirmação e sem SMTP; recuperação por e-mail e operação para distribuição ampla permanecem pendentes.

> Continuidade: [avaliação das 18 frentes do produto](docs/PICO_PRODUCT_ASSESSMENT_2026-09-18.md) e [prompt completo para o Codex preparar a versão de loja](docs/CODEX_CONTINUE_TO_STORE_READY.md). O prompt preserva a base existente e exige evidências de integração, aparelhos e operação antes de chamar a versão de pronta.

> Integração de 26/09/2026: as sete migrations móveis/mensagens/push foram aplicadas somente no Supabase principal após dry-run e inventário; 131 identidades de conteúdo foram preservadas. Mensagens diretas e Web Push continuam desligados no banco e na aplicação. Os tipos foram regenerados do schema hospedado. Os PRs [#42](https://github.com/8ugomes/pico-app/pull/42) e [#43](https://github.com/8ugomes/pico-app/pull/43) passaram pela CI e a revisão `66194b1a57db` foi promovida no domínio principal; versão, banco e Auth responderam saudáveis e a comparação do deploy preservou 131/131 registros.

# Pico Social

**Republicações:** publicações alheias podem aparecer no seu perfil e no Início de quem acompanha você, com autoria, curtidas, comentários e audiência originais preservados. É possível desfazer; grupos privados continuam restritos. [Contrato e verificação](docs/REPOSTS.md).

**O ponto de encontro da areia. Me acha no Pico.**

Rede social PWA mobile-first para futevôlei, beach tennis e vôlei de praia. O Ciclo 9 implementa comunidades próprias, gestão de arenas, papéis no banco, publicação com destinos, histórico privado e fotos recortadas. O Ciclo 10 organiza o perfil, elimina a duplicação do editor e acrescenta conversão HEIC/HEIF local. O editor aceita foto ou vídeo MP4, nunca ambos; “Já joguei” é uma declaração optativa no perfil, não um post nem o histórico privado. O conjunto de tutorial, comunidade oficial e cadastro aberto foi publicado no ambiente principal; o cadastro usa e-mail e senha, sem confirmação, e preserva suspensão/revogação/exclusão. [Registro da entrega e verificação da versão](docs/ONBOARDING_RELEASE.md).

[Perfil/HEIC: implementação, testes e limites do Ciclo 10](docs/CYCLE10_PROFILE.md). O código foi validado em CI e em Chromium/WebKit com ambiente de teste isolado; esta rodada não executou novo deploy nem teste em aparelhos físicos.

**Aplicativo em transição:** o cliente React local do Pico Social já é empacotado pelo Capacitor, usa API móvel por Bearer e guarda somente o refresh token no Keychain. O fluxo iOS cobre feed, comentários, republicações, bloqueio/desbloqueio, jogos privados, compartilhamento, direitos da conta, rascunhos e tentativas idempotentes por conta, deep links internos e reprodução autorizada de vídeo privado. A validação integrada passou com 262 testes, builds web/móvel/iOS e archive Release sem assinatura; o preflight ficou sem falhas técnicas. O transporte TUS de MP4 está implementado, mas criar/publicar vídeo fica desligado na 1.0 até sanitização/transcoding e validação física. Mensagens diretas e Web Push também permanecem desligados até privacidade, moderação e aparelhos serem validados; Web Push não substitui APNs no iOS. As migrations e a API integrada já estão no ambiente principal; Universal Links, sessão controlada no binário, aparelho físico, identidade/assinatura, TestFlight e App Store continuam pendentes. A PWA permanece sendo o produto público. [Arquitetura, comandos, gates e matriz física](docs/MOBILE_APP.md).

**Identidade escolhida: Aura Manteiga.** Pico Social adota a direção editorial jovem, artística e refinada, com Syne/Manrope e Manteiga/Cacau/Papel/Lavanda. [Manual completo e ativos](docs/brand-exploration/aura-manteiga/README.md) aplicados ao aplicativo: temas claro/escuro, duas fontes locais, marca em contornos, controles, composições por domínio e onboarding assistido. [Cobertura, capturas e verificações](docs/aura-redesign-review/README.md). [Design system e estado](docs/pico-design-system.md).

**Contexto para próximas tarefas:** [empresa/produto/marca](docs/pico-company-context.md), [domínios](docs/pico-domains.md), [17 skills locais](docs/pico-skills.md) e [plano corrente](docs/pico-product-plan.md). [pico-mobile](.agents/skills/pico-mobile/SKILL.md) conduz toolchains, builds e gates iOS/Android; [pico-redesign](.agents/skills/pico-redesign/SKILL.md) continua responsável pelo redesign integral. O [prompt de execução](docs/brand-exploration/aura-manteiga/PROMPT-PRODUCAO.md) não publica o aplicativo só por ser lido.

Endereço principal: [Pico](https://pico-app-sepia.vercel.app). O Ciclo 9 está integrado à `main`; publicação por `npm run deploy` no projeto Vercel `pico-app`. O endereço antigo `pico-internal.vercel.app` encaminha ao principal. [Ambientes](docs/ENVIRONMENTS.md) descreve a configuração, [operação](docs/BETA_OPERATIONS.md) explica publicação e rollback e [contratos](docs/CYCLE9_CONTRACTS.md) define permissões. A versão efetivamente servida pode ser consultada em [/api/version](https://pico-app-sepia.vercel.app/api/version). O relatório [INTERNAL_REVIEW.md](docs/INTERNAL_REVIEW.md) preserva a validação anterior à unificação.

**Comunidade oficial e autenticação (13/09):** cadastro aberto com e-mail e senha, sem confirmação e sem SMTP por decisão vigente; comunidade geral automática após o perfil, três mensagens oficiais e aviso por conta. Suspensão, revogação e exclusão continuam protegidas. [Auditoria e estado por ambiente](docs/OFFICIAL_COMMUNITY_AUTH.md) · [Configuração de e-mail](docs/EMAIL_SETUP.md).

**Tutorial guiado:** convite opcional e três passos nas telas reais: Arenas, Pessoas e Meus jogos. A preferência fica isolada por conta e pode ser pausada ou retomada, sem ações sociais automáticas. A PWA publicada e o cliente iOS local têm implementações próprias desse mesmo contrato. [Especificação](docs/ONBOARDING.md) · [Capturas e verificação](docs/onboarding-review/README.md).

**Jornada e pós-jogo:** início com acesso aos próprios grupos/arenas, navegação fixa Início/Pessoas/Comunidades/Arenas/Perfil, composições específicas e jogos privados com compartilhamento explícito separado. [Decisões de jornada](docs/JOURNEY_REFINEMENT.md) · [contratos](docs/POST_GAME.md) · [evidências](docs/journey-review/README.md). Conjunto completo publicado no ambiente principal após PR/CI, 210 verificações hospedadas e aplicação das duas migrations novas (21 em ambos os bancos). [Evidência da entrega e limites](docs/JOURNEY_RELEASE.md); consulte `/api/version` para a revisão efetivamente servida.

## Executar

Node.js 24, npm 11 e dependências do lockfile:

```bash
npm ci
npm run env:check
npm run dev
```

`.env.local` deve conter a finalidade `development`, ref, URL e publishable key do desenvolvimento exclusivo, conforme `.env.example`. Recursos de mídia e exclusão requerem `SUPABASE_SECRET_KEY` somente no servidor. Arquivos locais são ignorados e protegidos; não use sudo npm nem registre segredos em logs.

Demonstração exige `NEXT_PUBLIC_PICO_ENV=demo` e `PICO_ENV=demo`, sem chaves Supabase. Dados fictícios são identificados e ficam em memória. Configuração conectada ausente, cruzada ou indisponível falha de forma explícita; nunca troca silenciosamente para mock.

### Fundação nativa

```bash
npm run native:doctor
npm run native:assets
npm run mobile:build
npm run native:sync:ios
npm run native:verify
npm run native:build:ios
npm run native:preflight:ios
```

`native:verify` confere o shell local e falha se restar `server.url`; nesta rodada, a sincronização de trabalho é somente iOS para preservar Android. `native:preflight:ios` separa falhas técnicas de decisões humanas e não assina nem envia nada. O preview hospedado exige configuração HTTPS explícita e serve somente para ensaio interno; consulte [MOBILE_APP.md](docs/MOBILE_APP.md) antes de abrir Xcode.

Neste Mac, Xcode 27.0 e o runtime iOS 27.0 estão prontos; Android Studio Quail 4 e Temurin JDK 21 também estão instalados. O app foi executado no iOS Simulator. Android SDK/API 36 e emulador permanecem pausados.

## Jornadas conectadas

| Caminho | Comportamento |
| --- | --- |
| /signup, /login, /acesso | Cadastro aberto com e-mail e senha, sem confirmação, e admissão automática; suspensão/revogação/exclusão preservadas. Recuperação por e-mail indisponível sem SMTP. |
| /admin | Administração global: acesso beta, papéis, pedidos, catálogo/custódia e moderação auditada |
| /arenas e /arenas/[slug] | Catálogo permitido pela admissão, participação reversível, perfil do local, mural e comunidades |
| /arenas/[slug]/gestao | Edição versionada, imagens, modalidades, equipe, convites e transferência conforme papel |
| /notificacoes | Novas participações nas suas comunidades, contador e leitura individual/todas. [Contrato e publicação](docs/NOTIFICATIONS.md) |
| /comunidades | Buscar por nome em Explorar ou Minhas comunidades; grupos independentes ou vinculados, com entrada aberta, aprovada ou por convite |
| /comunidades/[slug]/gestao | Informações, participantes, papéis, fotos, convites e vínculo de arena |
| /feed | Início com atalhos aos próprios grupos/arenas e estado inicial orientado à descoberta. Post canônico: perfil, mural e grupos selecionados; audiência explícita, curtidas/comentários/denúncia; sem sugestão derivada de presença |
| /jogos | Registro privado de jogo realizado: arena, modalidade e data; correção/exclusão própria; compartilhar é uma ação separada com audiência/destinos explícitos; sem publicação ou aviso automático |
| /checkin | Compatibilidade de links: redireciona para /jogos |
| /perfil e /perfil/[username] | Perfil, esportes, avatar com recorte, publicações e vínculos visíveis; perfil próprio com abas e editor organizado separado; sem e-mail alheio |
| /descobrir | Buscar por nome/@usuário, combinar esporte/nível/arena e acompanhar pessoas; sem usar histórico privado |
| /conta | Bloqueios, denúncias próprias, fotos sem uso e exclusão com senha; recursos geridos entram em custódia |
| /recuperar, /redefinir-senha | PKCE por padrão; fluxo oficial por token preparado para templates próprios, ainda sem entrega externa comprovada |
| /instalar | Instruções por navegador, manifesto, rede e versão; atualização por decisão explícita |

Arenas de demonstração continuam rotuladas mesmo após renomear. Comunidade privada exige participação ativa para conteúdo, membros e mídia; gestão da arena ou administração global não abre leitura geral. A exceção de moderação permite examinar somente o conteúdo denunciado e registra a ação.

## Banco e comandos

O inventário corrente de migrations está em `supabase/migrations`; os recibos de aplicação ficam no plano e changelog. As sete migrations desta integração foram aplicadas no banco principal e seus tipos regenerados do schema hospedado; os switches de mensagens e push permaneceram `false`. O desenvolvimento hospedado estava inativo e não foi alterado. O legado de presença é preservado sem conversão. Tipos são gerados, não editados manualmente. Não recriar projetos corretos, reaplicar SQL registrado nem resetar banco remoto.

```bash
node --env-file=.env.local --env-file=.env.hosted-admin scripts/database.mjs dry-run
node --env-file=.env.local --env-file=.env.hosted-admin scripts/database.mjs migrate
npm run db:types
npm run lint
npm run typecheck
npm test
npm run build
```

Para comparar o CSS de primeira carga no build compilado, inicie `npm run start -- -p 3217` em outro terminal e execute `npm run measure:css`. A [revisão do Agent Harness Kit](docs/AGENT_HARNESS_KIT_REVIEW.md) documenta procedência, escopo e limites da medição.

`seed` e `test:hosted` recusam beta/produção. O gate remoto do Ciclo 9 usa desenvolvimento exclusivo e app local correspondente em localhost:3002; cria e limpa somente identidades/recursos rastreados:

```bash
# Terminal separado: build/start com os envs de desenvolvimento.
PICO_BUILD_DIR=.next-verify npm run build
PICO_BUILD_DIR=.next-verify npm run start -- -p 3002
# Outro terminal:
npm run test:hosted
```

`--keep` reserva fixtures protegidas para QA; finalizar com `npm run test:hosted -- --cleanup`. Não iniciar outra execução antes de limpar as fixtures anteriores. Scripts Cycle 8 e a fixture HTTP antiga são roteiros auxiliares, não o gate atual. Expectativas de presença foram substituídas por jogos/rejeição do legado; esses roteiros não foram executados contra infraestrutura nesta rodada. O helper SQL inicia com as migrations atuais, mas sua antiga instrução de build em loopback antecede a guarda de identidade: não altere a guarda nem a configuração para executá-lo. Testes locais usam PostgreSQL/PGlite descartável e independem do remoto.

## Segurança, fotos e operação

RLS, grants mínimos e RPCs consultam papéis/admissão vigentes, inclusive com JWT antigo. APIs verificam usuário, origem, formato e limites. Leituras sociais usam a sessão comum; cliente administrativo só realiza operações delimitadas depois da autorização. Route Handlers renovam cookies; antes de adicionar dados privados em Server Components, implementar renovação apropriada de sessão.

Buckets privados: `avatars`, `post-media`, `entity-media`, `post-videos`. O cliente iOS não deve ler Storage diretamente: cada trecho de vídeo autorizado é revalidado pelo servidor, responde `private, no-store` e chega ao player nativo por Range com Bearer apenas em memória. O transporte TUS de MP4 de até 45 MiB é resumível e cancelável, mas permanece atrás de feature gate; a 1.0 não cria nem publica vídeo pelo iPhone até sanitização/transcoding e validação física. MOV/HEVC não são aceitos. Fotos: original até 20 MiB/25 MP, recorte real no navegador e saída até 3 MiB, normalizada sem metadados no servidor. JPEG/PNG/WebP estáticos e HEIC/HEIF decodificável: conversão local nativa ou fallback sob demanda antes do recorte, sem serviço externo; variantes incompatíveis apresentam erro. [Suporte e licença](docs/THIRD_PARTY_HEIC.md). Fotos de arenas/grupos pertencem ao recurso, não à conta do uploader.

[Operação](docs/BETA_OPERATIONS.md), [schema](docs/04_SUPABASE_SCHEMA.md), [backup/restauração](docs/CONTINUITY.md), [PWA](docs/pwa-roadmap.md), [aplicativo](docs/MOBILE_APP.md) e [checklist](docs/BETA_CHECKLIST.md). A beta vigente está deliberadamente sem SMTP e sem confirmação; recuperação por e-mail, contato público e aparelhos físicos ainda exigem decisão ou trabalho externo. A fundação de mensagens diretas e o service worker exclusivo de Web Push não interceptam navegação nem guardam conteúdo privado, mas permanecem desligados até moderação, privacidade e aparelhos serem validados; eles não equivalem a mensagens ou APNs no cliente iOS. Não há fila automática de posts offline, reservas, pagamentos, anúncios ou IA/ranking. O cliente iOS local existe, mas ainda não há build assinada ou distribuição.

Leia [AGENTS.md](AGENTS.md), [plano](docs/pico-product-plan.md), [Deslopify](docs/deslopify.md), [changelog](docs/CHANGELOG.md), [Ciclo 10](docs/CYCLE10_PROFILE.md) e [loop](docs/CODEX_AUTONOMOUS_LOOP.md). Documentos numerados antigos preservam a evolução; requisitos atuais do Ciclo 9 prevalecem sobre as antigas restrições a comunidades. O registro do Ciclo 10 substitui as limitações anteriores de perfil e HEIC.

[Diagnóstico da CI e proteção do GitHub](docs/GITHUB_GOVERNANCE.md): CI aprovada e rulesets ativos, verificados remotamente. `main` exige PR e check `verify`; ambas as branches bloqueiam force push e exclusão, sem bypass.
