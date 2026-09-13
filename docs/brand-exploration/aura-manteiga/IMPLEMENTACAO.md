# Mapa de implementação — Aura Manteiga

Este documento conecta a identidade ao código encontrado em 13/09/2026, base `f80684c`. É especificação para a próxima rodada; não comprova modificação ou publicação do aplicativo. [Prompt completo](PROMPT-PRODUCAO.md).

## Ordem recomendada

1. Tokens e fontes globais; logo e ícones.
2. Controles, diálogos, navegação e shell.
3. Conteúdo social, perfis, arenas, comunidades e diário privado.
4. Gestão, convites, autenticação, conta, PWA, tutorial e estados.
5. QA visual/funcional, PR/CI e publicação no destino existente.

## Mapeamento para o código atual

| Local | O que mudar | O que preservar |
| --- | --- | --- |
| `src/app/globals.css` | Substituir tokens cromáticos; famílias Manrope/Syne; ação/foco/hover; aliases do Tailwind. | Escala de espaço, leitura, alcance de seletores e componentes existentes. |
| `src/app/layout.tsx` | `next/font/local`, variáveis de fonte e metadados de cor por modo. | SessionGuard, pt-BR, skip link, metadata/robots e fluxo de sessão. |
| `src/components/pico/Brand.tsx` | SVG `logo/wordmark.svg` em cor semântica ou variante fixa adequada; retirar texto e ponto antigos. | Link de início e nome acessível. |
| `src/app/forms.css` e `src/components/ui` | Fontes, fundos, bordas, estados e raio; tirar `color-scheme: dark` fixo do select. | Inputs, labels, validação, ChoiceChip nativo, foco contido/retornado e Escape dos diálogos. |
| `social.css`, `social-pages.css`, `journey.css`, `profile.css` | Converter cores fixas e aplicar hierarquia/curvas por conteúdo. | Conteúdo real, audiência, nomenclatura e estados conectados/demo. |
| `onboarding.css`, GuidedOnboarding, OfficialWelcome | Cores semânticas, título e acabamento. | Percurso, persistência existente do tutorial, foco e confirmação institucional. |
| `BottomNav.tsx`, `AppShell.tsx` | Marca, tipografia e seleção com sinal além da cor. | Início/Pessoas/Comunidades/Arenas/Perfil e associação de jogos ao perfil. |
| `src/app/icon.svg`, `favicon.ico`, `apple-icon.png`, `public/icons` | Substituir com as exportações da pasta `logo`. | Dimensões, MIME, propósito e carregamento pela convenção Next. |
| `src/app/manifest.ts` | Cores e caminhos/bytes dos ícones; validar maskable específico. | `id: /`, `start_url: /feed`, `scope: /`, nomes por ambiente e display standalone. |
| PwaExperience e páginas de instalação/privacidade | Superfícies, links, textos e foco com tokens corretos. | Informações de conexão, atualização explícita, rascunhos e textos jurídicos reais. |

## Compatibilidade de tokens

`tokens.css` fornece as variáveis alvo e aliases; integrar no ponto de definição, sem empilhar override. `--graphite` passa a alias de `--surface`, embora o nome histórico seja mantido temporariamente. `--sand` significa manteiga de marca; `--accent` significa ação no modo ativo. Não confundir os dois. `--color-sand` hoje é mapeado para `--accent` em `@theme inline`: rever seus consumidores quando separar os papéis. O alias `--green` também deve deixar de criar pressuposto cromático.

Rever cores fixas em `.button-primary:hover`, `.privacy-page a`, `.pwa-notice`, `.install-hint`, superfícies, avatares fallback, `.notice-success` e `.official-welcome`. Não recolorir fotos nem logos reais de pessoas e comunidades. Onde uma borda comunica um limite funcional, usar `border-control`; `border-subtle` é apenas separação decorativa.

`--font-system` pode continuar como alias transitório de `--font-body`. Não aplicar Syne globalmente a controles. Importar WOFF2 local via Next e preservar licenças. Corpo/input 16 px; navbar 12 px com alvo de 44 px; os textos minúsculos dentro dos telefones de apresentação não definem a implementação.

## Tema e ícones

O código atual força o escuro e não tem preferência de tema. O plano de referência adiciona os dois modos via `prefers-color-scheme`, com CSS que resolve o primeiro paint. Claro é a direção editorial; escuro respeita o dispositivo. Não há requisito para acrescentar um seletor de conta ou salvar dados de tema no backend.

Manifesto admite um fundo de lançamento estável; use papel como base coerente e metadados de cor de navegador por preferência do sistema. Confira o comportamento real do navegador/PWA. Não inventar uma nova instalação: os identificadores do manifesto permanecem os atuais. Atualizações de ícone podem depender do cache do sistema e devem ser verificadas no dispositivo disponível.

| Arquivo entregue | Destino previsto |
| --- | --- |
| `logo/pico-app.svg` | Referência de ícone / `src/app/icon.svg` |
| `logo/favicon.ico` | `src/app/favicon.ico` |
| `logo/apple-icon.png` | `src/app/apple-icon.png` |
| `logo/pico-192.png` | `public/icons/pico-192.png` |
| `logo/pico-512.png` | `public/icons/pico-512.png` |
| `logo/pico-maskable-512.png` | `public/icons/pico-maskable-512.png` |
| `logo/wordmark*.svg`, `lockup*.svg` | Assets de marca servidos localmente |
| `fonts/*.woff2` e OFL | Pasta local de fontes e licenças correspondente |

## Roteiro de aceite

Comparar todas as superfícies claras e escuras, incluindo estados de acesso, formulários longos, gestão e conteúdo vazio. Conferir 320/390/430/768/1440 px, zoom/texto 200%, foco/teclado, entrada de texto e safe areas. Verificar que recortes não esconderam informação e que o estilo não removeu controles. Cálculos de tokens são referência; medir os pares reais depois da cascata CSS e de sobreposições.

Rodar lint, typecheck, testes, build e smoke pertinente. A implementação visual deve preservar as regressões funcionais existentes. Validar com fixtures isoladas; não criar atividade social artificial em produção. Somente afirmar QA real de Supabase ou aparelho físico quando executado.

## Publicação posterior

O prompt completo autoriza futura implementação e publicação após os gates. Respeitar branch/PR/CI e proteções da main. `scripts/deploy.mjs` exige árvore limpa, main sincronizada com origin, projeto Vercel correto e migrations registradas. Usar **pico-app**, em **pico-app-sepia.vercel.app**. Não contornar guardas nem criar projeto paralelo. Confirmar `/api/version`, registrar versão servida e referência de rollback.

A atualização visual não exige migrations, substituição de banco, mudança de regras de acesso ou reenvio de conteúdo. Se algo estrutural já estiver pendente no ambiente, isso deve ser informado e tratado pelo procedimento próprio, sem escondê-lo como parte do branding.

### Bordas sobre superfícies elevadas

`border-control` atende os fundos padrão e de campo. Quando o limite funcional estiver sobre `surface-raised` ou `accent-soft`, usar `border-control-raised`: `#84786F` no claro e `#9D948C` no escuro. As bordas decorativas continuam discretas; os 50 pares auditados incluem estes contextos adicionais.
