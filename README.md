# Pico Social

**Comece aqui:** [estado consolidado em 23/10/2026](docs/PROJECT_STATUS.md) · [guia para contribuir em outro ambiente](CONTRIBUTING.md) · [plano corrente](docs/pico-product-plan.md). O código e as decisões necessárias à continuidade ficam neste repositório; os recibos distinguem implementação, publicação e validação real.

**Republicações:** publicações alheias podem aparecer no seu perfil e no Início de quem acompanha você, com autoria, curtidas, comentários e audiência originais preservados. É possível desfazer; grupos privados continuam restritos. [Contrato e verificação](docs/REPOSTS.md).

**O ponto de encontro da areia. Me acha no Pico.**

Rede social PWA mobile-first para futevôlei, beach tennis e vôlei de praia. O Ciclo 9 implementa comunidades próprias, gestão de arenas, papéis no banco, publicação com destinos, histórico privado e fotos recortadas. O Ciclo 10 organiza o perfil, elimina a duplicação do editor e acrescenta conversão HEIC/HEIF local. O editor aceita foto ou vídeo MP4, nunca ambos; “Já joguei” é uma declaração optativa no perfil, não um post nem o histórico privado. O conjunto de tutorial, comunidade oficial e cadastro aberto foi publicado no ambiente principal; o cadastro usa e-mail e senha, sem confirmação, e preserva suspensão/revogação/exclusão. [Registro da entrega e verificação da versão](docs/ONBOARDING_RELEASE.md).

[Perfil/HEIC: implementação, testes e limites do Ciclo 10](docs/CYCLE10_PROFILE.md). O código foi validado em CI e em Chromium/WebKit com ambiente de teste isolado; esta rodada não executou novo deploy nem teste em aparelhos físicos.

**Aplicativo iPhone:** o cliente React local do Pico Social é empacotado pelo Capacitor e agora oferece **Usar só neste iPhone** sem conta, servidor ou internet. Nesse espaço privado, perfil, arenas próprias e jogos retrospectivos ficam num arquivo do sandbox protegido pelo iOS e excluído de backup; sair preserva os dados, exportar usa a folha nativa e apagar exige confirmação. O modo conectado continua separado, usa API móvel por Bearer e guarda somente o refresh token no Keychain. A build Debug foi instalada no iPhone 18 Pro simulado e percorrida em claro, escuro e texto de acessibilidade; o bundle também foi conferido em 320/390 px. Instalação em iPhone físico continua dependendo de aparelho pareado, Developer Mode e uma equipe de assinatura Apple disponíveis no Xcode deste Mac. Universal Links, TestFlight e App Store também permanecem pendentes. A PWA continua em paralelo. [Arquitetura, comandos, gates e matriz física](docs/MOBILE_APP.md).

**Identidade escolhida: Aura Manteiga.** Pico Social adota a direção editorial jovem, artística e refinada, com Syne/Manrope e Manteiga/Cacau/Papel/Lavanda. [Manual completo e ativos](docs/brand-exploration/aura-manteiga/README.md) aplicados ao aplicativo: temas claro/escuro, duas fontes locais, marca em contornos, controles, composições por domínio e onboarding assistido. [Cobertura, capturas e verificações](docs/aura-redesign-review/README.md). [Design system e estado](docs/pico-design-system.md).

**Contexto para próximas tarefas:** [empresa/produto/marca](docs/pico-company-context.md), [domínios](docs/pico-domains.md), [17 skills locais](docs/pico-skills.md) e [plano corrente](docs/pico-product-plan.md). [pico-mobile](.agents/skills/pico-mobile/SKILL.md) conduz toolchains, builds e gates iOS/Android; [pico-redesign](.agents/skills/pico-redesign/SKILL.md) continua responsável pelo redesign integral. O [prompt de execução](docs/brand-exploration/aura-manteiga/PROMPT-PRODUCAO.md) não publica o aplicativo só por ser lido.

Endereço principal: [Pico](https://pico-app-sepia.vercel.app). O Ciclo 9 está integrado à `main`; publicação por `npm run deploy` no projeto Vercel `pico-app`. O endereço antigo `pico-internal.vercel.app` encaminha ao principal. [Ambientes](docs/ENVIRONMENTS.md) descreve a configuração, [operação](docs/BETA_OPERATIONS.md) explica publicação e rollback e [contratos](docs/CYCLE9_CONTRACTS.md) define permissões. A versão efetivamente servida pode ser consultada em [/api/version](https://pico-app-sepia.vercel.app/api/version). O relatório [INTERNAL_REVIEW.md](docs/INTERNAL_REVIEW.md) preserva a validação anterior à unificação.

**Comunidade oficial e autenticação (13/09):** cadastro aberto com e-mail e senha, sem confirmação e sem SMTP por decisão vigente; comunidade geral automática após o perfil, três mensagens oficiais e aviso por conta. Suspensão, revogação e exclusão continuam protegidas. [Auditoria e estado por ambiente](docs/OFFICIAL_COMMUNITY_AUTH.md) · [Configuração de e-mail](docs/EMAIL_SETUP.md).

**Tutorial guiado:** convite opcional e três passos nas telas reais: Arenas, Pessoas e Meus jogos. A preferência fica isolada por conta e pode ser pausada ou retomada, sem ações sociais automáticas. A PWA publicada e o cliente iOS local têm implementações próprias desse mesmo contrato. [Especificação](docs/ONBOARDING.md) · [Capturas e verificação](docs/onboarding-review/README.md).

**Jornada e pós-jogo:** início com acesso aos próprios grupos/arenas, navegação fixa Início/Pessoas/Comunidades/Arenas/Perfil, composições específicas e jogos privados com compartilhamento explícito separado. [Decisões de jornada](docs/JOURNEY_REFINEMENT.md) · [contratos](docs/POST_GAME.md) · [evidências](docs/journey-review/README.md). Conjunto completo publicado no ambiente principal após PR/CI, 210 verificações hospedadas e aplicação das duas migrations novas (21 em ambos os bancos). [Evidência da entrega e limites](docs/JOURNEY_RELEASE.md); consulte `/api/version` para a revisão efetivamente servida.

## Executar

Use Git, Node.js 24 e npm 11 (`.nvmrc` e `package.json`). Para um **clone novo**, a demonstração web não exige Supabase, conta Apple nem arquivos deste Mac. Os comandos de setup abaixo usam Node e funcionam em shells POSIX e PowerShell:

```bash
git clone https://github.com/8ugomes/pico-app.git
cd pico-app
npm ci
node -e "require('node:fs').writeFileSync('.env.local', 'NEXT_PUBLIC_PICO_ENV=demo\nPICO_ENV=demo\n', {flag:'wx'})"
npm run env:check
npm run dev
```

Abra `http://localhost:3000`. A criação de `.env.local` recusa sobrescrever um arquivo existente. Dados fictícios são identificados e ficam em memória. Não misture chaves Supabase com demo. O espaço privado do iPhone é outra jornada, persistente no sandbox iOS, descrita abaixo.

Para desenvolvimento conectado, configure `.env.local` a partir de `.env.example` com acesso autorizado ao projeto exclusivo de desenvolvimento. Mídia e exclusão exigem `SUPABASE_SECRET_KEY` somente no servidor. A identidade dos ambientes é verificada; outro projeto exige configuração deliberada, nunca remoção das guardas. Arquivos locais são ignorados e protegidos. Veja [plataformas, checks, acesso e fluxo de PR](CONTRIBUTING.md).

### Fundação nativa

Compilação e execução iOS exigem **macOS e Xcode**. O desenvolvimento web pode ocorrer em macOS, Linux ou Windows; CI Linux cobre os checks comuns. Android permanece pausado.

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

Na primeira abertura, **Usar só neste iPhone** entra no produto sem consultar a API. O perfil local pede nome e modalidade; cidade, bairro e notas são opcionais. Esse modo não cria conta, feed, comunidade, publicação ou sincronização e não mistura seus registros com uma futura sessão conectada.

Para colocar a build em um aparelho próprio, conecte e confie no iPhone, ative o Developer Mode solicitado pelo iOS, execute `npm run native:open:ios`, selecione o aparelho e uma Personal Team em **Signing & Capabilities** e rode o target `App`. Esses passos dependem da conta Apple e do aparelho do responsável; não devem ser confundidos com o build sem assinatura do Simulator.

Evidência histórica de 18/10/2026: Xcode 27.0 e runtime iOS 27.0 foram usados no Mac da implementação, com execução no Simulator. Isso não instala toolchains em outro ambiente; siga [MOBILE_APP.md](docs/MOBILE_APP.md) e `native:doctor` na sua máquina. Android SDK/API 36 e emulador permanecem pausados.

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

O inventário corrente de migrations está em `supabase/migrations`; os recibos de aplicação ficam no plano e changelog. O último recibo hospedado, de 28/09/2026, registra 49 migrations no principal, com intenção social, medição, mensagens e push desligados. O desenvolvimento não foi declarado sincronizado; confirme o ledger antes de operar. [Estado e limites da verificação atual](docs/PROJECT_STATUS.md). O legado de presença é preservado sem conversão. Tipos são gerados, não editados manualmente. Não recriar projetos corretos, reaplicar SQL registrado nem resetar banco remoto.

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
