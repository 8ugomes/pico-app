# Pico Social — design system Aura Manteiga

**Aura Manteiga está implementada no aplicativo em 13/09/2026.** Este documento traduz a identidade escolhida em decisões presentes no código. A [cobertura](aura-redesign-review/coverage.md) e a [revisão local](aura-redesign-review/README.md) registram superfícies e evidências. Publicação e CI remota não são comprovadas por esta consolidação.

## Autoridade e manutenção

O [contexto institucional](pico-company-context.md) e o [brief](../BRIEF.md) definem direção e limites. O [manual completo](brand-exploration/aura-manteiga/MANUAL.md), [tokens.json](brand-exploration/aura-manteiga/tokens.json), mestres em `logo/` e fontes em `fonts/` são a referência canônica de identidade. O [mapa de domínios](pico-domains.md) define contratos funcionais.

[globals.css](../src/app/globals.css) aplica valores e aliases ao produto; as folhas de composição e os componentes resolvem cada contexto. [DESIGN.md](../DESIGN.md) é a entrada portátil e sintética para agentes. O [sidecar Impeccable](../.impeccable/design.json) contém extensões e exemplos derivados para ferramentas, vinculados às variáveis do CSS. Não introduz outra paleta ou escala normativa. O estado “referência para implementação” do manual registra a edição dos ativos; o estado do app deve ser lido aqui, no código e nas evidências da rodada.

Ao evoluir o sistema, atualizar a decisão pertinente e sua origem canônica, a implementação, estas referências e o espelho derivado. Não reconstruir cores por capturas nem usar estudos anteriores para reabrir a identidade sem pedido.

## Fundação implementada

| Responsabilidade | Código vigente |
| --- | --- |
| Temas, tokens, tipografia base, botões, entrada e avisos institucionais | [globals.css](../src/app/globals.css) |
| Shell, navegação, post, busca, filtros e responsividade social | [social.css](../src/app/social.css) |
| Arenas, pessoas, comunidades, estados conectados, jogos e conta | [social-pages.css](../src/app/social-pages.css) |
| Campos, escolhas, formulários, diálogos e compositor | [forms.css](../src/app/forms.css) |
| Contexto do Início, linhas pessoais, participação e audiência | [journey.css](../src/app/journey.css) |
| Perfil, editor e progresso da configuração inicial | [profile.css](../src/app/profile.css) |
| Convite, guia, foco contextual e altura curta | [onboarding.css](../src/app/onboarding.css) |

As sete folhas recebem a mesma fundação sem alterar APIs, permissões ou dados. Os nomes de compatibilidade `graphite`, `glass`, `glass-strong` e `glass-border` apontam para superfícies e bordas semânticas atuais. `sand` aponta para Manteiga da marca; não é alias de ação. Classes históricas não autorizam retomar a identidade anterior ou implementar recursos ausentes do produto.

## Cor e temas

Manteiga dá reconhecimento; Cacau estrutura; Papel sustenta leitura; Lavanda é apoio pontual. O conjunto completo de valores e medidas permanece em [tokens.json](brand-exploration/aura-manteiga/tokens.json), com implementação correspondente em `:root`, na media query escura e no `@theme inline`.

| Papel implementado | Aplicação |
| --- | --- |
| `background`, `surface`, `surface-raised`, `surface-overlay`, `surface-input` | Fundo, leitura, camadas elevadas, diálogos e campos sólidos |
| `foreground`, `text-secondary`, `text-muted` | Texto principal, apoio e metadados com contraste |
| `accent`, `accent-ink`, `accent-hover`, `accent-active` | Ação Cacau/Papel no claro e Manteiga/Cacau no escuro |
| `accent-soft` | Seleções discretas, contextos e convites editoriais |
| `border-subtle` | Separação de conteúdo, sem substituir limite funcional |
| `border-control`, `border-control-raised` | Controles sobre superfícies padrão e sobre elevada/suave |
| `focus`, `selection-bg`, `selection-ink` | Teclado e seleção de texto |
| `disabled-bg`, `disabled-ink` | Controles realmente desabilitados, sem opacidade sobre todo o bloco |
| `success`, `warning`, `error`, `info` e respectivos fundos | Feedback associado a texto e semântica |

O modo acompanha `prefers-color-scheme`; não há nova preferência remota de conta. `color-scheme`, seleção, campos nativos e cores do viewport acompanham o modo. A entrada editorial mantém Manteiga/Cacau em ambos. Fotografias e identidades de pessoas, comunidades e arenas conservam suas cores.

Diálogos, avisos institucionais, convite do tutorial e resumo de audiência usam a borda funcional reforçada quando necessária. O foco global tem contorno de 2px e afastamento de 3px. Não usar Lavanda/Papel, Manteiga/Papel ou branco/Manteiga como pares de texto comum.

## Tipografia, marca e ativos

[layout.tsx](../src/app/layout.tsx) carrega Syne e Manrope WOFF2 locais com `next/font/local`, `display: swap` e fallbacks declarados. Syne expressa títulos e aberturas; Manrope opera corpo, campos, navegação e ações. [Brand.tsx](../src/components/pico/Brand.tsx) usa os contornos exatos do wordmark Aura, com `currentColor` e nome acessível; não depende da fonte para compor o logo. O cabeçalho usa largura de 100px e a lateral 120px.

| Papel no app | Escala aplicada |
| --- | --- |
| Abertura | `--text-hero`: clamp de 2rem a 4rem; peso 700, entrelinha 1,08 |
| Título de página | `--text-title`: clamp de 1,75rem a 2,25rem; geralmente peso 600 e entrelinha 1,15–1,2 |
| Seção | `--text-section`: 1,5rem, peso 600; seções operacionais compactas têm hierarquia própria |
| Diálogo | `--text-dialog`: 1,375rem, peso 600, entrelinha 1,3 |
| Corpo/campo | `--text-body`: 1rem; corpo com entrelinha 1,6 e campo com 1,5 |
| Label | `--text-label`: .875rem, geralmente peso 600 |
| Metadado | `--text-caption`: .8125rem |
| Navegação móvel | .75rem; destino ativo com peso 700; ícone de 22px |

Esses valores descrevem o código. A escala nominal do manual continua sendo a referência de identidade; os pesos e entrelinhas acima documentam sua adaptação às telas operacionais. Títulos usam tracking próximo de −.02em e quebra equilibrada. Texto digitado permanece em 16px na escala padrão. Evitar rótulos decorativos que repetem título e abreviações que apagam a consequência de uma ação.

Logo, favicon, Apple, ícones 192/512 e maskable usam os ativos entregues. O [relatório de assets](aura-redesign-review/assets-contrast.json) registra dez arquivos idênticos aos mestres, contornos preservados e maskable opaco. As licenças OFL acompanham as duas famílias locais. Não há nova imagem sintética publicada como dado social.

## Layout, superfícies e movimento

O shell social tem máximo de 1260px; no mobile, o miolo chega a 680px e usa margem de 20px, reduzida a 16px abaixo de 360px. Em 800px, entra a navegação lateral de 215px. Em 1160px, o miolo chega a 620px e surge a coluna contextual de 280px. Autenticação tem composição independente: formulário de até 500px e coluna editorial a partir de 1000px. Campos em pares se reorganizam nos breakpoints próprios do formulário/editor.

A navegação inferior usa largura intrínseca de cada rótulo e pode se reorganizar em linhas com texto ampliado. Não hifeniza os destinos. `BottomNav` mede sua altura e reserva o espaço inferior correspondente no conteúdo; não fixar esse espaço presumindo uma única linha. Nomes e ações longos podem quebrar, sem truncar audiência, condições de participação ou privacidade.

O ritmo usa base de 4px; os tokens reutilizados cobrem 4/8/12/16/20/24/32px. Espaços maiores aparecem na composição editorial. Controles usam raio de 16px, cards 22px, painéis 30px, pílulas 999px e avatares circulares. O destaque assimétrico de 24/24/70/24px atende entrada, convites, vazios e fotografia de arena. Cards não recebem essa forma automaticamente.

Fundos são sólidos. Posts não usam sombra; perfis e pessoas usam espaço e divisórias. Diálogos e guia sobreposto usam `shadow-elevated`, com backdrop escuro no diálogo. Não há blur obrigatório ou material de vidro por causa dos nomes legados das classes.

Estados de toque e seleção usam 160ms; transições de superfície/fotografia usam 220ms; o token de marca prevê 280ms. A curva compartilhada é `cubic-bezier(.22, 1, .36, 1)`. O CSS global remove animações e transições com movimento reduzido. Tempos definidos não são medição de fluidez em aparelho físico.

## Componentes e jornadas

Reutilizar [Button](../src/components/ui/Button.tsx), [Input](../src/components/ui/Input.tsx), [ChoiceChip](../src/components/ui/ChoiceChip.tsx) e [Modal](../src/components/ui/Modal.tsx). Botões têm primary/secondary/quiet e mínimos de 44/48/52px conforme tamanho. Campos têm label persistente, superfície sólida, borda funcional, altura mínima de 50px, ajuda associada e erro próximo. `ChoiceChip` conserva checkbox nativo, check visível e foco, além da cor selecionada.

Diálogos preservam Escape, foco contido, retorno ao acionador e fechamento de 44px fora da área rolável. O corpo rola; ações ficam no fluxo. O compositor abre os campos existentes em diálogo, preserva rascunho ao fechar e mantém audiência/destinos explícitos. Feedback de sucesso depende da confirmação real.

| Conteúdo | Composição e informação preservada |
| --- | --- |
| Início | Contextos próprios compactos; entrada editorial quando cabível; conteúdo social em primeiro plano |
| Pessoas | Linhas de identidade, modalidade, lugar e ação de acompanhar |
| Comunidades | Propósito, vínculo opcional com arena, condição de entrada e participação |
| Arenas | Fotografia/lugar, modalidades e comunidade; informações complementares em disclosures |
| Publicações | Autor, conteúdo, audiência, mídia e ações; foto e texto reais preservados |
| Jogos | Cronologia retrospectiva privada; arena, modalidade e data declarada; compartilhar exige outra ação |
| Perfil e editor | Identidade aberta, modalidades, seções de edição e feedback real; configuração inicial destaca três dados essenciais e separa opcionais |
| Conta, gestão, convites e exceções | Mesmos controles e estados; papéis, validações e limites existentes |

Registro de jogo não indica presença ou disponibilidade. Compartilhamento preserva audiência e snapshot; editar/excluir o jogo não altera a publicação. `/checkin` continua apenas redirecionamento. O redesign não altera admissão, sessão, papéis ou RLS.

## Assistência e estados

Configuração inicial, aviso institucional e tutorial continuam separados. O progresso do perfil mostra preenchimento real; o aviso institucional mantém reconhecimento por conta no servidor. O tutorial tem seis etapas, convite curto e retomada voluntária, com persistência isolada por conta/demo. “Mostrar onde” recolhe a dica antes de focar o controle; “Pausar” permanece visível. Nenhuma gravação social é executada pelo passeio.

O guia acompanha a rolagem, tem corpo rolável em sua composição padrão e se torna relativo em altura curta. Diálogos abertos o ocultam; editores suspendem avanço. Foco contextual usa o token de foco. [ONBOARDING.md](ONBOARDING.md) conserva o contrato completo.

Vazio, carregando, erro, sucesso, indisponível, selecionado e disabled combinam hierarquia visual e texto honesto. Demonstração permanece identificada e local. Não reduzir densidade removendo autoria, audiência, condição de entrada ou aviso de privacidade; remover repetições que não acrescentam informação.

## Evidências, histórico e limites

A [revisão da implementação](aura-redesign-review/README.md) registra lint/typecheck/build, 87 testes, regressões locais de onboarding e jogos e amostra visual de 39 verificações. [Contraste e assets](aura-redesign-review/assets-contrast.json) cobrem 50 pares sólidos do CSS final; [contraste renderizado](aura-redesign-review/rendered-contrast.json) cobre textos sólidos da amostra. As fontes renderizadas são as duas famílias locais e o fallback foi observado sem overflow a 320px.

As capturas usam o app Next compilado com fixtures locais e rede externa bloqueada. A amostra visual inclui 320/390/1280px e os dois temas; a regressão do guia amplia para 430/768px, altura curta, texto a 200%, teclado/foco, redução de movimento e estados de armazenamento. A cobertura de implementação não significa captura ou teste independente de toda combinação de rota e permissão. A [revisão final](aura-redesign-review/finish-review.md) registra a resolução dos rótulos redundantes e da quebra da navegação.

O sistema anterior permanece no histórico Git e nas capturas `before-*` da revisão Aura, além de [visual-review](visual-review/README.md) e [journey-review](journey-review/README.md). A antiga paleta, a fonte única e o material anterior não são especificação vigente. Os contratos funcionais preservados continuam descritos nos documentos de domínio.

Esta consolidação não comprova Supabase real, entrega de e-mail, instalação PWA em aparelho físico, teclado/safe areas de hardware ou pesquisa com jogadores. O check remoto de perfil e a publicação dependem do PR/CI e do recibo operacional; não foram comprovados nesta etapa. Verificar a revisão pública em `/api/version` após a publicação autorizada; não inferir deploy de documentação ou screenshot.

## Avatar e configuração do perfil

Cabeçalho móvel e lateral conectados usam o avatar privado da conta, com 44 px reservados, recorte circular e fallback de indisponibilidade. Na configuração inicial, foto salva, nome, usuário e esporte têm progresso de quatro requisitos. A escolha de foto fica exposta antes de existir um avatar; bio e localização aparecem como personalização opcional. A atualização de imagem preserva o rascunho do formulário.
