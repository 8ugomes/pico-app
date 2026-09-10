# Pico

**O ponto de encontro da areia. Me acha no Pico.**

Rede social PWA mobile-first para futevôlei, beach tennis e vôlei de praia. O Ciclo 9 implementa comunidades próprias, gestão de arenas, papéis no banco, publicação com destinos, histórico privado e fotos recortadas. **Exclusivo para revisão interna; lançamento não autorizado.**

Revisão publicada: [Pico interno](https://pico-internal.vercel.app), versão `e891dca1e741`, com Supabase beta real e acesso por admissão. O estado publicado, commits, evidências e pendências estão em [revisão interna](docs/INTERNAL_REVIEW.md). [Ambientes](docs/ENVIRONMENTS.md) é o mapa operacional; [contratos](docs/CYCLE9_CONTRACTS.md) define permissões e privacidade. O domínio histórico pico-app-sepia.vercel.app permanece no Ciclo 8 até decisão específica; push da branch de revisão não o atualiza.

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
| /feed | Post canônico: perfil, mural e grupos selecionados; audiência explícita, curtidas/comentários/denúncia |
| /checkin | Presença voluntária até duas horas, encerramento, histórico próprio e arenas recentes |
| /perfil e /perfil/[username] | Perfil, esportes, avatar com recorte, publicações e vínculos visíveis; sem e-mail alheio |
| /descobrir | Interesses, vínculos permitidos e conexões unilaterais; sem usar histórico privado |
| /conta | Bloqueios, denúncias próprias, fotos sem uso e exclusão com senha; recursos geridos entram em custódia |
| /recuperar, /redefinir-senha | PKCE por padrão; fluxo oficial por token preparado para templates próprios, ainda sem entrega externa comprovada |
| /instalar | Instruções por navegador, manifesto, rede e versão; atualização por decisão explícita |

Arenas de demonstração continuam rotuladas mesmo após renomear. Comunidade privada exige participação ativa para conteúdo, membros e mídia; gestão da arena ou administração global não abre leitura geral. A exceção de moderação permite examinar somente o conteúdo denunciado e registra a ação.

## Banco e comandos

19 migrations versionadas, aditivas, com backfill de posts antigos. Tipos são gerados, não editados manualmente. Não recriar projetos corretos, reaplicar SQL registrado nem resetar banco remoto.

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

Buckets privados: `avatars`, `post-media`, `entity-media`. Sem download direto ou URLs assinadas para clientes. Toda entrega consulta visibilidade atual e responde `private, no-store`. Original até 20 MiB/25 MP, recorte real no navegador e saída até 3 MiB, normalizada sem metadados no servidor. JPEG/PNG/WebP estáticos; HEIC exige exportação explícita para formato aceito. Fotos de arenas/grupos pertencem ao recurso, não à conta do uploader.

[Operação](docs/BETA_OPERATIONS.md), [schema](docs/04_SUPABASE_SCHEMA.md), [backup/restauração](docs/CONTINUITY.md), [PWA](docs/pwa-roadmap.md) e [checklist](docs/BETA_CHECKLIST.md). SMTP/caixa de teste, contato público e aparelhos físicos ainda exigem trabalho externo. Não há service worker, fila de posts offline, chat, reservas, pagamentos, anúncios, IA, ranking ou app nativo.

Leia [AGENTS.md](AGENTS.md), [plano](docs/pico-product-plan.md), [Deslopify](docs/deslopify.md), [changelog](docs/CHANGELOG.md) e [loop](docs/CODEX_AUTONOMOUS_LOOP.md). Documentos numerados antigos preservam a evolução; requisitos atuais do Ciclo 9 prevalecem sobre as antigas restrições a comunidades.

[Diagnóstico da CI e proteção do GitHub](docs/GITHUB_GOVERNANCE.md): a CI atual passou; a ativação dos rulesets está pendente da confirmação de identidade do responsável no GitHub.
