# Trabalhar no Pico Social

Este guia permite continuar o produto sem acesso às conversas ou à máquina da implementação. O [README](README.md#executar) contém o setup demo para um clone novo. O [estado consolidado](docs/PROJECT_STATUS.md) informa o que existe, o que foi publicado e os próximos gates. Prioridades continuam no [plano corrente](docs/pico-product-plan.md).

## Requisitos por atividade

| Atividade | Requisitos e limites |
| --- | --- |
| Web/PWA, TypeScript e testes locais | Git, Node.js 24 e npm 11. `.nvmrc` informa a linha Node; `package-lock.json` fixa as dependências. macOS/Linux são os ambientes de execução verificados; Windows pode usar Node nativo ou WSL2, mas não recebeu validação nesta rodada. |
| SQL/RLS local | `npm test` usa PGlite descartável e não exige Docker, Supabase hospedado ou conta real. Não comprova Auth, Storage nem PostgREST reais. |
| Regressão de perfil no navegador | Dependências do lockfile, Chromium/WebKit do Playwright e Python 3.12 com `pillow-heif==1.1.1`; roteiro abaixo. |
| Cliente móvel e sync iOS | `npm run native:verify` gera o bundle local e sincroniza o projeto. A CI Linux verifica esse pacote; não compila Swift nem instala no iPhone. |
| Build e Simulator iOS | macOS e Xcode completo, runtime iOS e Swift Package Manager conforme [MOBILE_APP.md](docs/MOBILE_APP.md). Aparelho físico exige pareamento, Developer Mode e assinatura pessoal. |
| Android | Projeto preservado; SDK, emulador e validação permanecem pausados. A jornada privada sem conta foi implementada para iOS. |
| Banco hospedado, backup e deploy | Acesso concedido pelo responsável e configuração privada por ambiente. Usar macOS/Linux ou WSL2 para scripts administrativos; execução Windows nativa não foi validada. |

Instale com `npm ci`, sem `sudo`, usando o cache local definido em `.npmrc`. Não troque npm por outro gerenciador nem regenere todo o lockfile para resolver uma falha pontual. Caches, builds de distribuição, SDKs e certificados ficam fora do Git; o bundle gerado em `native-shell` permanece versionado.

## Antes de mudar código

1. Leia [AGENTS.md](AGENTS.md), [plano](docs/pico-product-plan.md) e [Deslopify](docs/deslopify.md). Atualize os dois últimos com a entrega prevista antes de codar.
2. Consulte [contexto de produto/marca](docs/pico-company-context.md), [mapa de domínios](docs/pico-domains.md), [design system](docs/pico-design-system.md), [PWA](docs/pwa-roadmap.md) e [schema](docs/04_SUPABASE_SCHEMA.md). As notas antigas preservam histórico; use datas e recibos atuais.
3. Confira `git status` e preserve trabalho existente. Crie uma branch `codex/<assunto>` ou outra solicitada pelo responsável a partir de uma `main` atualizada.
4. Leia a documentação da versão instalada do Next em `node_modules/next/dist/docs/` antes de alterar APIs/convenções. Não assumir comportamento de versões anteriores.

As [17 skills locais](docs/pico-skills.md) estão em `.agents/skills`, com referências e procedência. São arquivos portáteis, legíveis por qualquer editor/agente; não exigem plugins pessoais do Codex. [PRODUCT.md](PRODUCT.md), [BRIEF.md](BRIEF.md) e [DESIGN.md](DESIGN.md) dão entradas curtas para produto e design.

## Configuração e dados

A demo usa apenas `NEXT_PUBLIC_PICO_ENV=demo` e `PICO_ENV=demo`. Não precisa de chaves. Crie `.env.local` pelo comando do README; se ele já existir, revise a configuração em vez de sobrescrever. Também confira variáveis herdadas do terminal: demo com chaves Supabase é recusada.

Para conectado, peça acesso ao desenvolvimento exclusivo e configure as variáveis de [.env.example](.env.example). [ENVIRONMENTS.md](docs/ENVIRONMENTS.md) descreve a identidade de cada destino. Uma chave válida não transforma um projeto arbitrário em desenvolvimento autorizado. O Supabase principal mantém identidade técnica `beta` e dados reais.

Nunca versionar `.env.local`, arquivos administrativos, `.vercel`, tokens, chaves privadas, backups, conteúdo de usuários ou certificados. Em `NEXT_PUBLIC_*`, nunca colocar segredos; somente URL/publishable key do Supabase podem ser credenciais públicas. Exporte dados locais pessoais somente para armazenamento privado.

Toda mudança de schema exige migration versionada, RLS e autoria verificadas. Não editar migrations aplicadas, resetar o remoto ou usar seed para publicar. [Preservação e operação](docs/BETA_OPERATIONS.md) exigem inventários privados antes/depois; [continuidade](docs/CONTINUITY.md) cobre backups. Os scripts administrativos não fazem parte do quick start.

## Verificar uma entrega

Com o ambiente demo configurado:

```bash
npm run env:check
npm run lint
npm run typecheck
npm test
npm run native:verify
npm run build
npm audit --audit-level=high
```

`typecheck` inclui a geração dos tipos de rota; não rode esse comando ao mesmo tempo que `build` no mesmo diretório de saída. `native:verify` reconstrói `native-shell`; revise e inclua diferenças geradas quando mudar o cliente móvel. Não edite o bundle manualmente. A auditoria de segredos por valor exato (`scripts/audit-secrets.mjs`) exige configuração privada local e build pronto; não criar segredos só para executá-la num clone demo.

Para mudanças de perfil/fotos, a CI também executa:

```bash
npx playwright install --with-deps chromium webkit
python -m pip install pillow-heif==1.1.1
python tests/helpers/make-heic.py
node tests/browser-profile.mjs
```

Use um ambiente virtual Python se a instalação do sistema exigir. O teste usa fixtures isoladas; não envia mídia para usuários reais. Testes hospedados exigem acesso ao desenvolvimento e o roteiro guardado de [ambientes](docs/ENVIRONMENTS.md), nunca o banco principal. Smoke local, CI, backend real, Simulator e aparelho físico são evidências diferentes.

## Fechar e integrar

Atualize plano, Deslopify e [changelog](docs/CHANGELOG.md) com resultado, checks e limitações. Faça commit de código, testes, documentação e ativos necessários; revise `git diff --check` e o conjunto staged antes do push. `main` recebe alterações por PR e check `verify`, conforme [governança](docs/GITHUB_GOVERNANCE.md); não usar force push ou contornar as proteções.

Push/merge no GitHub não executa o deploy do Pico. Publicação web ocorre pelo comando guardado `npm run deploy`, quando solicitada, na `main` limpa e sincronizada. Migrations, ativação de recursos e distribuição nas lojas têm gates próprios. Não iniciar uma dessas ações apenas por ler um prompt histórico.
