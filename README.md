# Pico

**O ponto de encontro da areia. Me acha no Pico.**

Rede social PWA mobile-first para futevôlei, beach tennis e vôlei de praia. O Ciclo 9 implementa comunidades próprias, gestão de arenas, papéis no banco, publicação com destinos, histórico privado e fotos recortadas. O Ciclo 10 organiza o perfil, elimina a duplicação do editor e acrescenta conversão HEIC/HEIF local. A publicação usa o ambiente principal, com acesso às contas por aprovação.

[Perfil/HEIC: implementação, testes e limites do Ciclo 10](docs/CYCLE10_PROFILE.md). O código foi validado em CI e em Chromium/WebKit com ambiente de teste isolado; esta rodada não executou novo deploy nem teste em aparelhos físicos.

Endereço principal: [Pico](https://pico-app-sepia.vercel.app). O Ciclo 9 está integrado à `main`; publicação por `npm run deploy` no projeto Vercel `pico-app`. O endereço antigo `pico-internal.vercel.app` encaminha ao principal. [Ambientes](docs/ENVIRONMENTS.md) descreve a configuração, [operação](docs/BETA_OPERATIONS.md) explica publicação e rollback e [contratos](docs/CYCLE9_CONTRACTS.md) define permissões. A versão efetivamente servida pode ser consultada em [/api/version](https://pico-app-sepia.vercel.app/api/version). O relatório [INTERNAL_REVIEW.md](docs/INTERNAL_REVIEW.md) preserva a validação anterior à unificação.

## Executar

Node.js 24, npm 11 e dependências do lockfile:

```bash
npm ci
npm run env:check
npm run dev
```

`.env.local` deve conter a finalidade `development`, ref, URL e publishable key do desenvolvimento exclusivo, conforme `.env.example`. Recursos de mídia e exclusão requerem `SUPABASE_SECRET_KEY` somente no servidor. Arquivos locais são ignorados e protegidos; não use sudo npm nem registre segredos em logs.

Demonstração exige `NEXT_PUBLIC_PICO_ENV=demo` e `PICO_ENV=demo`, sem chaves Supabase. Dados fictícios são identificados e ficam em memória. Configuração conectada ausente, cruzada ou indisponível falha de forma explícita; nunca troca silenciosamente para mock.

## Jornadas conectadas

| Caminho | Comportamento |
| --- | --- |
| /signup, /login, /acesso | Cadastro apenas com convite individual vigente, login e admissão separada; recuperação/exclusão próprias preservadas |
| /admin | Administração global: acesso beta, papéis, pedidos, catálogo/custódia e moderação auditada |
| /arenas e /arenas/[slug] | Catálogo permitido pela admissão, participação reversível, perfil do local, mural e comunidades |
| /arenas/[slug]/gestao | Edição versionada, imagens, modalidades, equipe, convites e transferência conforme papel |
| /comunidades | Criar/encontrar comunidades independentes ou vinculadas; entrada aberta, aprovada ou por convite |
| /comunidades/[slug]/gestao | Informações, participantes, papéis, fotos, convites e vínculo de arena |
| /feed | Post canônico: perfil, mural e grupos selecionados; audiência explícita, curtidas/comentários/denúncia; sugestão opcional do mural do check-in ativo |
| /checkin | Presença voluntária até duas horas, encerramento, histórico próprio e arenas recentes |
| /perfil e /perfil/[username] | Perfil, esportes, avatar com recorte, publicações e vínculos visíveis; perfil próprio com abas e editor organizado separado; sem e-mail alheio |
| /descobrir | Interesses, vínculos permitidos e conexões unilaterais; sem usar histórico privado |
| /conta | Bloqueios, denúncias próprias, fotos sem uso e exclusão com senha; recursos geridos entram em custódia |
| /recuperar, /redefinir-senha | PKCE por padrão; fluxo oficial por token preparado para templates próprios, ainda sem entrega externa comprovada |
| /instalar | Instruções por navegador, manifesto, rede e versão; atualização por decisão explícita |

Arenas de demonstração continuam rotuladas mesmo após renomear. Comunidade privada exige participação ativa para conteúdo, membros e mídia; gestão da arena ou administração global não abre leitura geral. A exceção de moderação permite examinar somente o conteúdo denunciado e registra a ação.

## Banco e comandos

19 migrations versionadas, aditivas, com backfill de posts antigos. O Ciclo 10 não acrescenta migrations. Tipos são gerados, não editados manualmente. Não recriar projetos corretos, reaplicar SQL registrado nem resetar banco remoto.

```bash
node --env-file=.env.local --env-file=.env.hosted-admin scripts/database.mjs dry-run
node --env-file=.env.local --env-file=.env.hosted-admin scripts/database.mjs migrate
npm run db:types
npm run lint
npm run typecheck
npm test
npm run build
```

`seed` e `test:hosted` recusam beta/produção. O teste remoto atual usa desenvolvimento exclusivo e app local correspondente em localhost:3002; cria e limpa somente identidades/recursos rastreados:

```bash
# Terminal separado: build/start com os envs de desenvolvimento.
PICO_BUILD_DIR=.next-verify npm run build
PICO_BUILD_DIR=.next-verify npm run start -- -p 3002
# Outro terminal:
npm run test:hosted
```

`--keep` reserva fixtures protegidas para QA; finalizar com `npm run test:hosted -- --cleanup`. Não iniciar outra execução antes de limpar as fixtures anteriores. Scripts Cycle 8 são registros históricos e não são o gate atual. Testes locais usam PostgreSQL/PGlite descartável e independem do remoto.

## Segurança, fotos e operação

RLS, grants mínimos e RPCs consultam papéis/admissão vigentes, inclusive com JWT antigo. APIs verificam usuário, origem, formato e limites. Leituras sociais usam a sessão comum; cliente administrativo só realiza operações delimitadas depois da autorização. Route Handlers renovam cookies; antes de adicionar dados privados em Server Components, implementar renovação apropriada de sessão.

Buckets privados: `avatars`, `post-media`, `entity-media`. Sem download direto ou URLs assinadas para clientes. Toda entrega consulta visibilidade atual e responde `private, no-store`. Original até 20 MiB/25 MP, recorte real no navegador e saída até 3 MiB, normalizada sem metadados no servidor. JPEG/PNG/WebP estáticos e HEIC/HEIF decodificável: conversão local nativa ou fallback sob demanda antes do recorte, sem serviço externo; variantes incompatíveis apresentam erro. [Suporte e licença](docs/THIRD_PARTY_HEIC.md). Fotos de arenas/grupos pertencem ao recurso, não à conta do uploader.

[Operação](docs/BETA_OPERATIONS.md), [schema](docs/04_SUPABASE_SCHEMA.md), [backup/restauração](docs/CONTINUITY.md), [PWA](docs/pwa-roadmap.md) e [checklist](docs/BETA_CHECKLIST.md). SMTP/caixa de teste, contato público e aparelhos físicos ainda exigem trabalho externo. Não há service worker, fila de posts offline, chat, reservas, pagamentos, anúncios, IA, ranking ou app nativo.

Leia [AGENTS.md](AGENTS.md), [plano](docs/pico-product-plan.md), [Deslopify](docs/deslopify.md), [changelog](docs/CHANGELOG.md), [Ciclo 10](docs/CYCLE10_PROFILE.md) e [loop](docs/CODEX_AUTONOMOUS_LOOP.md). Documentos numerados antigos preservam a evolução; requisitos atuais do Ciclo 9 prevalecem sobre as antigas restrições a comunidades. O registro do Ciclo 10 substitui as limitações anteriores de perfil e HEIC.

[Diagnóstico da CI e proteção do GitHub](docs/GITHUB_GOVERNANCE.md): CI aprovada e rulesets ativos, verificados remotamente. `main` exige PR e check `verify`; ambas as branches bloqueiam force push e exclusão, sem bypass.
