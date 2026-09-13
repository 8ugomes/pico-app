# Pico

**O ponto de encontro da areia. Me acha no Pico.**

Rede social PWA mobile-first para futevôlei, beach tennis e vôlei de praia. O Ciclo 9 implementa comunidades próprias, gestão de arenas, papéis no banco, publicação com destinos, histórico privado e fotos recortadas. O Ciclo 10 organiza o perfil, elimina a duplicação do editor e acrescenta conversão HEIC/HEIF local. A publicação usa o ambiente principal, com acesso às contas por aprovação.

[Perfil/HEIC: implementação, testes e limites do Ciclo 10](docs/CYCLE10_PROFILE.md). O código foi validado em CI e em Chromium/WebKit com ambiente de teste isolado; esta rodada não executou novo deploy nem teste em aparelhos físicos.

O refino visual global consolida fonte nativa, cores, formulários e diálogos sem mudar os fluxos de dados. [Tokens e padrões](docs/pico-design-system.md) · [capturas antes/depois, cobertura e limites](docs/visual-review/README.md).

Endereço principal: [Pico](https://pico-app-sepia.vercel.app). O Ciclo 9 está integrado à `main`; publicação por `npm run deploy` no projeto Vercel `pico-app`. O endereço antigo `pico-internal.vercel.app` encaminha ao principal. [Ambientes](docs/ENVIRONMENTS.md) descreve a configuração, [operação](docs/BETA_OPERATIONS.md) explica publicação e rollback e [contratos](docs/CYCLE9_CONTRACTS.md) define permissões. A versão efetivamente servida pode ser consultada em [/api/version](https://pico-app-sepia.vercel.app/api/version). O relatório [INTERNAL_REVIEW.md](docs/INTERNAL_REVIEW.md) preserva a validação anterior à unificação.

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

## Jornadas conectadas

| Caminho | Comportamento |
| --- | --- |
| /signup, /login, /acesso | Cadastro apenas com convite individual vigente, login e admissão separada; recuperação/exclusão próprias preservadas |
| /admin | Administração global: acesso beta, papéis, pedidos, catálogo/custódia e moderação auditada |
| /arenas e /arenas/[slug] | Catálogo permitido pela admissão, participação reversível, perfil do local, mural e comunidades |
| /arenas/[slug]/gestao | Edição versionada, imagens, modalidades, equipe, convites e transferência conforme papel |
| /comunidades | Criar/encontrar comunidades independentes ou vinculadas; entrada aberta, aprovada ou por convite |
| /comunidades/[slug]/gestao | Informações, participantes, papéis, fotos, convites e vínculo de arena |
| /feed | Início com atalhos aos próprios grupos/arenas e estado inicial orientado à descoberta. Post canônico: perfil, mural e grupos selecionados; audiência explícita, curtidas/comentários/denúncia; sem sugestão derivada de presença |
| /jogos | Registro privado de jogo realizado: arena, modalidade e data; correção/exclusão própria; compartilhar é uma ação separada com audiência/destinos explícitos; sem publicação ou aviso automático |
| /checkin | Compatibilidade de links: redireciona para /jogos |
| /perfil e /perfil/[username] | Perfil, esportes, avatar com recorte, publicações e vínculos visíveis; perfil próprio com abas e editor organizado separado; sem e-mail alheio |
| /descobrir | Interesses, vínculos permitidos e conexões unilaterais; sem usar histórico privado |
| /conta | Bloqueios, denúncias próprias, fotos sem uso e exclusão com senha; recursos geridos entram em custódia |
| /recuperar, /redefinir-senha | PKCE por padrão; fluxo oficial por token preparado para templates próprios, ainda sem entrega externa comprovada |
| /instalar | Instruções por navegador, manifesto, rede e versão; atualização por decisão explícita |

Arenas de demonstração continuam rotuladas mesmo após renomear. Comunidade privada exige participação ativa para conteúdo, membros e mídia; gestão da arena ou administração global não abre leitura geral. A exceção de moderação permite examinar somente o conteúdo denunciado e registra a ação.

## Banco e comandos

21 migrations versionadas no código local. As novas migrations `20260912090000_played_games.sql` e `20260912091000_game_sharing.sql` não foram aplicadas a nenhum banco remoto nesta rodada. O backfill histórico de posts não se aplica aos jogos: o legado de presença é preservado sem conversão. O Ciclo 10 não acrescentou migrations. Tipos são gerados, não editados manualmente. Não recriar projetos corretos, reaplicar SQL registrado nem resetar banco remoto.

```bash
node --env-file=.env.local --env-file=.env.hosted-admin scripts/database.mjs dry-run
node --env-file=.env.local --env-file=.env.hosted-admin scripts/database.mjs migrate
npm run db:types
npm run lint
npm run typecheck
npm test
npm run build
```

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

Buckets privados: `avatars`, `post-media`, `entity-media`. Sem download direto ou URLs assinadas para clientes. Toda entrega consulta visibilidade atual e responde `private, no-store`. Original até 20 MiB/25 MP, recorte real no navegador e saída até 3 MiB, normalizada sem metadados no servidor. JPEG/PNG/WebP estáticos e HEIC/HEIF decodificável: conversão local nativa ou fallback sob demanda antes do recorte, sem serviço externo; variantes incompatíveis apresentam erro. [Suporte e licença](docs/THIRD_PARTY_HEIC.md). Fotos de arenas/grupos pertencem ao recurso, não à conta do uploader.

[Operação](docs/BETA_OPERATIONS.md), [schema](docs/04_SUPABASE_SCHEMA.md), [backup/restauração](docs/CONTINUITY.md), [PWA](docs/pwa-roadmap.md) e [checklist](docs/BETA_CHECKLIST.md). SMTP/caixa de teste, contato público e aparelhos físicos ainda exigem trabalho externo. Não há service worker, fila de posts offline, chat, reservas, pagamentos, anúncios, IA, ranking ou app nativo.

Leia [AGENTS.md](AGENTS.md), [plano](docs/pico-product-plan.md), [Deslopify](docs/deslopify.md), [changelog](docs/CHANGELOG.md), [Ciclo 10](docs/CYCLE10_PROFILE.md) e [loop](docs/CODEX_AUTONOMOUS_LOOP.md). Documentos numerados antigos preservam a evolução; requisitos atuais do Ciclo 9 prevalecem sobre as antigas restrições a comunidades. O registro do Ciclo 10 substitui as limitações anteriores de perfil e HEIC.

[Diagnóstico da CI e proteção do GitHub](docs/GITHUB_GOVERNANCE.md): CI aprovada e rulesets ativos, verificados remotamente. `main` exige PR e check `verify`; ambas as branches bloqueiam force push e exclusão, sem bypass.
