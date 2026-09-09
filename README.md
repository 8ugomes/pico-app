# Pico

**O ponto de encontro da areia. Me acha no Pico.**

Rede social mobile-first para futevôlei, beach tennis e vôlei de praia. O Cycle 2 conecta leituras de arenas e perfil ao Supabase, preservando uma demonstração social utilizável sem configuração.

## Rodar

Recomendado: Node.js 24 LTS e npm 11.

```bash
npm install
npm run dev
```

Abra [Pico local](http://localhost:3000). A entrada redireciona para /feed. Use a porta indicada pelo Next.js se 3000 estiver ocupada.

O cache npm fica em .npm-cache, definido em .npmrc e ignorado pelo Git, para contornar o EACCES do cache global do Mac. Não use sudo npm install.

## Jornadas de demonstração

| Tela | O que fazer |
| --- | --- |
| /feed | Filtrar por esporte/turma, curtir, comentar e publicar texto em uma arena |
| /arenas | Buscar nome/bairro, filtrar esporte e ver arenas acompanhadas |
| /arenas/[slug] | Conhecer a comunidade, seguir, ver posts/pessoas/sobre e iniciar check-in |
| /checkin | Escolher arena e esporte, iniciar presença por 2h e encerrar |
| /descobrir | Buscar pessoas, filtrar esporte/disponibilidade e conectar |
| /perfil | Editar nome/bio, mudar disponibilidade e acompanhar posts/arenas |
| /perfil/[username] | Conhecer outro jogador e adicioná-lo à turma |
| /login, /signup | Autenticação real preparada; indisponível sem configuração |
| /auth/callback | Confirmação PKCE com erro recuperável |

Todas as telas sociais compartilham navegação inferior fixa em celular e navegação lateral em desktop. No demo, detalhes desconhecidos retornam 404. Em leituras conectadas, a API retorna 404 e a tela mostra o estado de conteúdo indisponível.

## Modo de demonstração

**Os seis jogadores, três arenas, posts, presença e atividades são fictícios, com contexto de São Paulo.**

O jogador da demonstração é Rafa Costa. Ações vivem em memória enquanto você navega nas telas sociais: curtidas, comentários, conexões, arenas seguidas, posts, perfil e check-in. Recarregar ou sair desse conjunto de telas reinicia a demonstração.

Nenhuma dessas ações é enviada a outra pessoa ou ao Supabase. A conta de Auth, quando configurada, permanece separada do jogador fictício. O aviso de demonstração identifica cada jornada ainda fictícia. Arenas/perfil conectados têm indicação própria de origem.

Check-ins duram 2h e podem ser encerrados. A leitura local de presença é atualizada a cada 15 segundos; a expiração real será validada pelo servidor. Os tempos dos seeds são relativos ao início da sessão.

## Supabase e camada real de leitura

A demonstração funciona sem qualquer variável.

Para habilitar Auth e leituras:

1. Crie/escolha um projeto Supabase.
2. Copie .env.example para .env.local.
3. Preencha NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY com os valores públicos do painel Connect.
4. Habilite e-mail/senha e confirmação de e-mail. Use política mínima de senha compatível com os 8 caracteres do cadastro.
5. Configure Site URL como http://localhost:3000 e permita http://localhost:3000/auth/callback nas Redirect URLs.
6. Aplique a migration do Cycle 1 em um projeto de desenvolvimento e cadastre esportes/arenas; o seed fictício é apenas para desenvolvimento.
7. Reinicie o dev. Em Vercel, configure as variáveis do ambiente e faça novo build.

O fluxo usa PKCE. Preserve o template padrão com {{ .ConfirmationURL }} e abra o link no mesmo navegador do cadastro. Nunca coloque service_role, secret key, senha ou token em Git ou NEXT_PUBLIC_*.

O schema V1, integridade, RLS, índices, RPCs e Storage estão em [04_SUPABASE_SCHEMA.md](docs/04_SUPABASE_SCHEMA.md). A migration do Cycle 1 foi aplicada e testada em Postgres/PGlite local, sem aplicação em serviço hospedado. Os tipos são manuais e alinhados ao SQL; gerar pelo Supabase após configurar o projeto.

Com URL e publishable key válidas, /arenas, /arenas/[slug] e /perfil consultam /api/social/read. Ausência das duas variáveis mantém demo; configuração incompleta/inválida e falha de serviço mostram erro, sem fallback silencioso. Feed, descoberta, check-in e perfis públicos individuais ainda usam mocks.

O perfil próprio é verificado com getUser no Route Handler e nunca aceita ID do cliente nem retorna e-mail. O handler pode renovar cookies e todas as respostas usam private/no-store. Antes de páginas privadas SSR, adicionar o proxy de sessão no Cycle 3. As telas conectadas são somente leitura: edição/check-in/follow/post reais entram nos ciclos seguintes.

Referências: [SSR Supabase](https://supabase.com/docs/guides/auth/server-side/creating-a-client), [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security).

## Qualidade

```bash
npm run lint
npm run typecheck
npm run build
npm test
```

Para servir o build: npm run start. Com o dev aberto, use npm run start -- --port 3001.

Verificado nesta rodada:

- Lint, typecheck e build aprovados.
- 29 testes aprovados: dez de regras sociais, dez grupos SQL/RLS com PGlite e nove de configuração/queries/contratos.
- 15 URLs sociais respondendo 200 no build de produção.
- Home redirecionando para feed, navegação presente e arena do check-in pré-selecionada.
- 404 para arena/perfil desconhecidos.
- Auth sem configuração e callback inválido com comportamento esperado.
- Manifesto, imagens e ícones disponíveis.

O Node pode emitir um aviso sobre inferência de módulo nos testes TypeScript; os testes passam. Cycles 0.5/1 acrescentaram inspeção das seis jornadas em navegador 390×844 e testes SQL/RLS locais. Auth/PostgREST hospedados e instalação em dispositivo físico permanecem sem validação.

## PWA e visual

Manifesto standalone com start_url /feed, ícones 192/512/maskable, apple-icon, tema escuro, safe areas e redução de movimento. Layout mobile com referência de 390px, corpo de 16px, navegação fixa e ações de toque.

Não há service worker ou garantia de funcionamento offline completo. A instalação em iOS/Android e a estratégia de cache estão no [roadmap PWA](docs/pwa-roadmap.md).

As imagens locais são originais geradas para a demonstração. players.webp contém seis retratos em grade usados como avatares; urban-court.webp ilustra as arenas. Recortes da mesma imagem não representam fotos reais de locais diferentes.

## Arquivos principais

```text
src/app/(social)/                Rotas e layout social
src/app/social.css              Feed, shell, navegação e componentes comuns
src/app/social-pages.css        Arenas, check-in, descoberta e perfil
src/components/pico/            Telas, cards e DemoProvider
src/components/ui/              Botões, inputs, modal e BottomNav
src/data/mock.ts                Fonte única dos dados fictícios
src/lib/demo-state.ts           Regras e transições locais
src/lib/supabase/queries.ts      Leituras tipadas de catálogo/arenas/perfil
src/lib/supabase/read-service.ts DTOs públicos e identidade do perfil
src/app/api/social/read/route.ts Endpoint sem cache
src/components/pico/connected/  Views de leitura e estados remotos
src/types/social.ts             Contrato do domínio
src/types/database.ts           Contrato cliente alinhado às migrations locais
tests/demo-state.test.mjs       Testes de comportamento
```

## Documentos e rotina

- [Plano corrente](docs/pico-product-plan.md)
- [Deslopify](docs/deslopify.md)
- [Design system](docs/pico-design-system.md)
- [PWA roadmap](docs/pwa-roadmap.md)
- [Schema e RLS](docs/04_SUPABASE_SCHEMA.md)
- [Changelog](docs/CHANGELOG.md)

AGENTS.md exige plano e Deslopify antes de codar, verificações, atualização dos aprendizados/changelog e commit ao fim de cada rodada.

## Próximos passos

1. Cycle 3: concluir onboarding/edição de perfil e sessão, validando a integração com um Supabase de desenvolvimento.
2. Ligar check-in e interações sociais ao backend, preservando os estados e a experiência.
3. Validar PWA em dispositivos reais, preparar offline, moderação e piloto na Vercel.

Continuam fora do MVP: IA, voz, reservas, pagamentos, B2B, anúncios, ranking avançado, mapa em tempo real e app nativo.

## Git e publicação

Repositório: [8ugomes/pico-app](https://github.com/8ugomes/pico-app). Branch principal: main.

```bash
git push origin main
```

A conexão GitHub do Codex tem acesso ao repositório. O terminal deste Mac ainda precisa de autenticação própria para push via Git. Se usar GitHub CLI após instalá-lo:

```bash
gh auth login --hostname github.com --git-protocol https --web
gh auth setup-git
git push origin main
```

A publicação pela conexão GitHub pode gerar outro SHA com a identidade/horário do GitHub. Nesse caso, o conteúdo é conferido por hash, o histórico local é sincronizado e o commit local original é preservado em uma branch de backup.

Deploy Vercel ainda não foi realizado. Ao fazê-lo, usar preset Next.js, npm run build, HTTPS e variáveis/URLs Supabase do ambiente.

## Ciclo Autônomo de Evolução

O registro corrente está em [docs/CODEX_AUTONOMOUS_LOOP.md](docs/CODEX_AUTONOMOUS_LOOP.md). Cada ciclo faz audit, plan, implement, verify, document, commit e next. Cycle 0.5 refinou o visual: carvão, champagne pontual e ações verde-água. Cycle 1 acrescentou fundação Supabase versionada sem mudar o modo demo.

### Banco versionado

- `supabase/migrations/20260909010000_social_foundation.sql`: dez tabelas com RLS, grants mínimos, FKs, constraints, índices e trigger de perfil após signup.
- `supabase/seed.sql`: catálogo de três esportes e três arenas fictícias marcadas `is_demo`; idempotente, só para desenvolvimento.
- `src/types/database.ts`: contrato do cliente alinhado ao SQL entregue, com operações restritas aos campos permitidos.
- `npm run test:db`: dez grupos de testes executam as migrations reais em Postgres/PGlite descartável, sem precisar de Docker ou credenciais. `npm test` inclui esses testes e os dez testes do demo.

Nenhuma tabela foi aplicada em Supabase hospedado. O teste local usa uma fixture de identidade, não um servidor Auth: e-mail, JWT, refresh, PostgREST e Storage precisam de validação própria. Check-ins ainda não têm RPCs; escrita direta no banco está negada. Connections será adicionada no Cycle 6. As telas sociais continuam em memória, com aviso explícito de demonstração.

Para a pilha local completa, usar Supabase CLI + Docker com `supabase start` e migrations locais. O [documento de schema](docs/04_SUPABASE_SCHEMA.md) detalha configuração, grants, limites e comandos. Não aplicar o seed fictício automaticamente em produção nem versionar `.env.local`, tokens ou chaves secretas.


## Cycle 2: estados e limites

- Loading com estrutura reservada; dados confirmados só após resposta bem-sucedida; erro com retry; catálogo vazio sem inventar arenas; sessão ausente exige login; perfil ausente tem mensagem própria.
- Arenas em páginas de 24, com ordenação estável por nome/id. Busca/filtro são sobre a página atual, indicada na interface.
- is_demo continua visível mesmo em dados salvos. Não atribuir imagens fictícias a arenas reais; imagens de Storage ainda não estão integradas.
- Nenhuma contagem de comunidade, atividade fictícia ou ação local é apresentada como dado real nas views conectadas.
- Leituras descartam dados anteriores ao atualizar, mudar contexto ou retomar a aba. Sem cache privado ou service worker.

Verificação do Cycle 2: build sem env e build conectado isolado, 29 testes, HTTP e navegador em 390×844. A fixture usa SQL local real e Auth/REST simulados; isso **não comprova integração Supabase hospedada**.

Para reproduzir a inspeção controlada, em um terminal:

```sh
node tests/helpers/read-api-fixture.mjs
```

Em outro terminal, executar separadamente:

```sh
PICO_BUILD_DIR=.next-read-check NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54331 NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_fixture_only npm run build
PICO_BUILD_DIR=.next-read-check NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54331 NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_fixture_only npm run start -- --port 3002
```

A fixture aceita somente transporte local de teste, com usuário Alice e tokens inválidos fora dela. Não é fallback do produto e nunca deve ser publicada como servidor. Use apenas credenciais fictícias durante esse teste. Encerre os processos ao terminar; nenhuma credencial real é necessária. Builds isolados são ignorados pelo Git; o Next pode acrescentar seus caminhos ao tsconfig durante a verificação, removê-los depois.
