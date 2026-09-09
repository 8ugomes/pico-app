# Pico

**O ponto de encontro da areia. Me acha no Pico.**

Rede social mobile-first para futevôlei, beach tennis e vôlei de praia. A rodada 2 transforma a apresentação inicial em uma demonstração social utilizável.

## Rodar

Recomendado: Node.js 24 LTS e npm 11.

```bash
npm install
npm run dev
```

Abra [Pico local](http://localhost:3000). A entrada redireciona para /feed. Use a porta indicada pelo Next.js se 3000 estiver ocupada.

O cache npm fica em .npm-cache, definido em .npmrc e ignorado pelo Git, para contornar o EACCES do cache global do Mac. Não use sudo npm install.

## O que funciona nesta rodada

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

Todas as telas sociais compartilham navegação inferior fixa em celular e navegação lateral em desktop. Detalhes desconhecidos retornam 404 com orientação.

## Modo de demonstração

**Os seis jogadores, três arenas, posts, presença e atividades são fictícios, com contexto de São Paulo.**

O jogador da demonstração é Rafa Costa. Ações vivem em memória enquanto você navega nas telas sociais: curtidas, comentários, conexões, arenas seguidas, posts, perfil e check-in. Recarregar ou sair desse conjunto de telas reinicia a demonstração.

Nenhuma dessas ações é enviada a outra pessoa ou ao Supabase. A conta de Auth, quando configurada, permanece separada do jogador fictício. O aviso de demonstração aparece em todas as telas sociais.

Check-ins duram 2h e podem ser encerrados. A leitura local de presença é atualizada a cada 15 segundos; a expiração real será validada pelo servidor. Os tempos dos seeds são relativos ao início da sessão.

## Supabase preparado, sem bloquear o app

A demonstração funciona sem qualquer variável.

Para habilitar Auth:

1. Crie/escolha um projeto Supabase.
2. Copie .env.example para .env.local.
3. Preencha NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY com os valores públicos do painel Connect.
4. Habilite e-mail/senha e confirmação de e-mail. Use política mínima de senha compatível com os 8 caracteres do cadastro.
5. Configure Site URL como http://localhost:3000 e permita http://localhost:3000/auth/callback nas Redirect URLs.
6. Reinicie o dev. Em Vercel, configure as variáveis do ambiente e faça novo build.

O fluxo usa PKCE. Preserve o template padrão com {{ .ConfirmationURL }} e abra o link no mesmo navegador do cadastro. Nunca coloque service_role, secret key, senha ou token em Git ou NEXT_PUBLIC_*.

O schema V1, integridade, RLS, índices, RPCs e Storage estão em [04_SUPABASE_SCHEMA.md](docs/04_SUPABASE_SCHEMA.md). Nenhuma migration foi aplicada. Os tipos de banco são manuais e deverão ser gerados após a implantação do schema.

As queries preparadas exigem um cliente explícito e não são chamadas pelas telas sociais. Configurar Auth não liga automaticamente o banco ao feed. Antes de páginas privadas SSR, adicionar renovação de sessão por proxy e validar identidade no servidor.

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
- 10 testes de regras sociais aprovados usando o test runner do Node, sem biblioteca adicional.
- 15 URLs sociais respondendo 200 no build de produção.
- Home redirecionando para feed, navegação presente e arena do check-in pré-selecionada.
- 404 para arena/perfil desconhecidos.
- Auth sem configuração e callback inválido com comportamento esperado.
- Manifesto, imagens e ícones disponíveis.

O Node pode emitir um aviso sobre inferência de módulo nos testes TypeScript; os testes passam. Não houve teste de backend Supabase, inspeção automatizada em navegador ou instalação em dispositivo físico nesta rodada.

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
src/lib/supabase/queries.ts      Consultas futuras, inativas no demo
src/types/social.ts             Contrato do domínio
src/types/database.ts           Contrato Supabase V1 ainda não aplicado
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

1. Integrar perfil/arenas e Auth reais com migrations, RLS e testes entre usuários.
2. Ligar check-in e interações sociais ao backend, preservando os estados e a experiência.
3. Validar PWA em dispositivos reais, preparar offline, moderação e piloto na Vercel.

Continuam fora do MVP: IA, voz, reservas, pagamentos, B2B, anúncios, ranking avançado, mapa em tempo real e app nativo.

## Git e publicação

Repositório privado: [8ugomes/pico-app](https://github.com/8ugomes/pico-app). Branch principal: main.

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
